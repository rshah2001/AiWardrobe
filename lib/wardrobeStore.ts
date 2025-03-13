import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  image_url: string;
  created_at: string;
  tags?: string[];
}

interface ItemTaggingResult {
  category: string;
  colors: string[];
  tags: string[];
}

interface WardrobeState {
  items: WardrobeItem[];
  loading: boolean;
  error: string | null;
  aiModel: mobilenet.MobileNet | null;
  modelLoading: boolean;
  
  // Basic CRUD functions
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<WardrobeItem, 'id' | 'created_at'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<WardrobeItem, 'id' | 'created_at'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  
  // AI-related functions
  loadAIModel: () => Promise<void>;
  tagItemWithAI: (imageUri: string) => Promise<ItemTaggingResult>;
  detectColor: (imageUri: string) => Promise<string[]>;
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  aiModel: null,
  modelLoading: false,
  
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ items: data, error: null });
    } catch (error) {
      console.error('Error fetching wardrobe items:', error);
      set({ error: 'Failed to fetch wardrobe items' });
    } finally {
      set({ loading: false });
    }
  },
  
  addItem: async (item) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        items: [data, ...state.items],
        error: null,
      }));
      return data;
    } catch (error) {
      console.error('Error adding wardrobe item:', error);
      set({ error: 'Failed to add wardrobe item' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  updateItem: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      set((state) => ({
        items: state.items.map(item => item.id === id ? data : item),
        error: null,
      }));
      return data;
    } catch (error) {
      console.error('Error updating wardrobe item:', error);
      set({ error: 'Failed to update wardrobe item' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  deleteItem: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('wardrobe_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        error: null,
      }));
    } catch (error) {
      console.error('Error deleting wardrobe item:', error);
      set({ error: 'Failed to delete wardrobe item' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  loadAIModel: async (): Promise<void> => {
    set({ modelLoading: true, error: null });
    try {
      // Ensure TensorFlow.js is ready
      await tf.ready();
      console.log('TensorFlow.js is ready');
      
      // Load MobileNet model
      const model = await mobilenet.load();
      console.log('MobileNet model loaded');
      
      set({ aiModel: model, error: null });
      // Model loaded successfully
    } catch (error) {
      console.error('Error loading AI model:', error);
      set({ error: 'Failed to load AI model' });
      throw error;
    } finally {
      set({ modelLoading: false });
    }
  },
  
  tagItemWithAI: async (imageUri) => {
    set({ loading: true, error: null });
    try {
      let model = get().aiModel;
      if (!model) {
        console.log('Model not loaded');
      }
      
      // Process the image for analysis
      const processedUri = await preprocessImage(imageUri);
      
      // Convert image to format suitable for TensorFlow
      const imgB64 = await FileSystem.readAsStringAsync(processedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Create an HTMLImageElement (for web) or use a different approach for native
      const imgElement = await createImageElement(imgB64);
      
      // Classify the image
      if (!model) {
        throw new Error('AI model is not loaded');
      }
      const predictions = await model.classify(imgElement);
      console.log('AI Predictions:', predictions);
      
      // Extract clothing category
      const category = determineClothingCategory(predictions);
      
      // Detect colors
      const colors = await get().detectColor(imageUri);
      
      // Extract tags from predictions
      const tags = predictions.map(p => p.className.split(',')[0].trim());
      
      return { category, colors, tags };
    } catch (error) {
      console.error('Error tagging item with AI:', error);
      set({ error: 'Failed to analyze image with AI' });
      
      // Return default values if AI fails
      return {
        category: 'Other',
        colors: ['Unknown'],
        tags: []
      };
    } finally {
      set({ loading: false });
    }
  },
  
  detectColor: async (imageUri) => {
    try {
      // Resize the image to make processing faster
      const manipResult = await manipulateAsync(
        imageUri,
        [{ resize: { width: 300 } }],
        { format: SaveFormat.JPEG }
      );
      
      // For a production app, you would implement color analysis here
      // For demonstration, we'll return some placeholder colors
      const defaultColors = ['Blue', 'Black', 'White', 'Red', 'Green'];
      return [defaultColors[Math.floor(Math.random() * defaultColors.length)]];
    } catch (error) {
      console.error('Error detecting colors:', error);
      return ['Unknown'];
    }
  }
}));

// Helper functions
async function preprocessImage(uri: string) {
  try {
    // Resize and compress the image for better performance
    const processedImage = await manipulateAsync(
      uri,
      [{ resize: { width: 224, height: 224 } }],
      { format: SaveFormat.JPEG, compress: 0.8 }
    );
    return processedImage.uri;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    return uri; // Return original if processing fails
  }
}

async function createImageElement(base64Image: string) {
  if (Platform.OS === 'web') {
    // For web platform
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = `data:image/jpeg;base64,${base64Image}`;
    });
  } else {
    // For native platforms (requires a different approach)
    // This is a simplified version - in a real app, you would use
    // a platform-specific tensor creation method
    const imgBuffer = tf.util.encodeString(base64Image, 'base64').buffer;
    const tensor = decodeJpeg(new Uint8Array(imgBuffer));
    return tensor;
  }
}

function determineClothingCategory(predictions: Array<{ className: string, probability: number }>): string {
  // Map MobileNet predictions to clothing categories
  const topPredictions = predictions.map(p => p.className.toLowerCase());
  
  const categoryMappings: { [key: string]: string } = {
    'shirt': 'Tops',
    'jersey': 'Tops',
    't-shirt': 'Tops',
    'blouse': 'Tops',
    'sweater': 'Tops',
    'jacket': 'Outerwear',
    'coat': 'Outerwear',
    'suit': 'Outerwear',
    'trousers': 'Bottoms',
    'jeans': 'Bottoms',
    'pants': 'Bottoms',
    'shorts': 'Bottoms',
    'skirt': 'Bottoms',
    'dress': 'Dresses',
    'gown': 'Dresses',
    'shoes': 'Shoes',
    'sneaker': 'Shoes',
    'boot': 'Shoes',
    'sandal': 'Shoes',
    'hat': 'Accessories',
    'cap': 'Accessories',
    'sunglasses': 'Accessories',
    'necktie': 'Accessories',
    'scarf': 'Accessories',
    'glove': 'Accessories',
    'sock': 'Accessories',
    'bag': 'Accessories',
    'backpack': 'Accessories',
    'belt': 'Accessories',
    'watch': 'Accessories',
    'jewelry': 'Accessories'
  };
  
  // Check if any of our predictions match a known clothing category
  for (const pred of topPredictions) {
    for (const [keyword, category] of Object.entries(categoryMappings)) {
      if (pred.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Default category if no match is found
  return 'Other';
}