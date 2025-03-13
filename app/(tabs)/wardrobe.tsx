import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Edit, Plus, Search, Trash, Upload, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera as ExpoCamera } from 'expo-camera';
import { useWardrobeStore } from '@/lib/wardrobeStore';
import { useAuthStore } from '@/lib/authStore';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';



// Color options for items
const COLOR_OPTIONS = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 
  'Purple', 'Pink', 'Brown', 'Gray', 'Beige', 'Navy', 'Multicolor'
];

// Category options for items
const CATEGORY_OPTIONS = [
  'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'
];

// Subcategories for more detailed classification
const SUBCATEGORIES = {
  'Tops': ['T-Shirt', 'Blouse', 'Sweater', 'Tank Top', 'Button-Up', 'Hoodie'],
  'Bottoms': ['Jeans', 'Pants', 'Shorts', 'Skirt', 'Leggings'],
  'Dresses': ['Casual Dress', 'Formal Dress', 'Sundress', 'Maxi Dress', 'Mini Dress'],
  'Outerwear': ['Jacket', 'Coat', 'Blazer', 'Cardigan', 'Vest'],
  'Shoes': ['Sneakers', 'Boots', 'Sandals', 'Flats', 'Heels', 'Athletic'],
  'Accessories': ['Hat', 'Scarf', 'Gloves', 'Jewelry', 'Belt', 'Bag', 'Sunglasses']
};

export default function WardrobeScreen() {
  const { session } = useAuthStore();
  const { 
    items, 
    loading, 
    error, 
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    tagItemWithAI,
    loadAIModel
  } = useWardrobeStore();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<keyof typeof SUBCATEGORIES>(CATEGORY_OPTIONS[0] as keyof typeof SUBCATEGORIES);
  const [itemSubcategory, setItemSubcategory] = useState(SUBCATEGORIES[CATEGORY_OPTIONS[0] as keyof typeof SUBCATEGORIES][0]);
  const [itemColor, setItemColor] = useState(COLOR_OPTIONS[0]);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  
  const cameraRef = useRef<ExpoCamera>(null);

  useEffect(() => {
    if (session) {
      fetchItems();
      loadAIModel().catch(error => 
        console.warn('AI model loading failed, continuing without AI features:', error)
      );
    }
  }, [session]);

  useEffect(() => {
    // Reset subcategory when category changes
    if (itemCategory && SUBCATEGORIES[itemCategory]) {
      setItemSubcategory(SUBCATEGORIES[itemCategory][0]);
    }
  }, [itemCategory]);

  useEffect(() => {
    // Request camera permissions
    (async () => {
      const { status } = await ExpoCamera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  const filteredItems = items.filter(item => {
    // Filter by category
    const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
    
    // Filter by search query
    const searchMatch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && searchMatch;
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      
      // Analyze image with AI if available
      if (result.assets[0].uri) {
        processImageWithAI(result.assets[0].uri);
      }
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCameraVisible(false);
        setImageUri(photo.uri);
        
        // Analyze image with AI
        processImageWithAI(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const processImageWithAI = async (uri: string) => {
    try {
      setAiProcessing(true);
      const tagResult = await tagItemWithAI(uri);
      
      if (tagResult) {
        // Set category based on AI prediction
        if (tagResult.category && CATEGORY_OPTIONS.includes(tagResult.category)) {
          setItemCategory(tagResult.category as keyof typeof SUBCATEGORIES);
          // Also set subcategory if available
          if (SUBCATEGORIES[tagResult.category as keyof typeof SUBCATEGORIES] && SUBCATEGORIES[tagResult.category as keyof typeof SUBCATEGORIES].length > 0) {
            setItemSubcategory(SUBCATEGORIES[tagResult.category as keyof typeof SUBCATEGORIES][0]);
          }
        }
        
        // Set color if detected
        if (tagResult.colors && tagResult.colors.length > 0) {
          const detectedColor = tagResult.colors[0];
          if (COLOR_OPTIONS.includes(detectedColor)) {
            setItemColor(detectedColor);
          }
        }

        // Generate a name based on color and category
        if (tagResult.category && tagResult.colors && tagResult.colors.length > 0) {
          const suggestedName = `${tagResult.colors[0]} ${tagResult.category.toLowerCase()}`;
          setItemName(suggestedName);
        }
      }
    } catch (error) {
      console.error('Error processing image with AI:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  const uploadToStorage = async (uri: string) => {
    try {
      // First, compress the image to reduce file size
      const compressed = await manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { format: SaveFormat.JPEG, compress: 0.7 }
      );
      
      // Convert to base64
      const base64Image = await FileSystem.readAsStringAsync(compressed.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Generate a unique filename
      const filename = `${session?.user.id}-${Date.now()}.jpg`;
      const filePath = `wardrobe-items/${filename}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, base64Image, {
          contentType: 'image/jpeg',
          upsert: false,
        });
        
      if (error) throw error;
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
        
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleAddItem = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image');
      return;
    }
    
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter a name for the item');
      return;
    }
    
    try {
      // Show loading state
      setAiProcessing(true);
      
      // Upload image to storage
      const imageUrl = await uploadToStorage(imageUri);
      
      // Create new item
      const fullCategory = itemSubcategory ? `${itemCategory} - ${itemSubcategory}` : itemCategory;
      
      await addItem({
        name: itemName,
        category: fullCategory,
        color: itemColor,
        image_url: imageUrl,
      });
      
      // Reset form and close modal
      resetForm();
      setAddModalVisible(false);
      
      // Show success message
      Alert.alert('Success', 'Item added to your wardrobe');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    } finally {
      setAiProcessing(false);
    }
  };

  const handleEditItem = async () => {
    if (!currentItem) return;
    
    try {
      // Show loading state
      setAiProcessing(true);
      
      let imageUrl = currentItem.image_url;
      
      // If image was changed, upload new one
      if (imageUri && imageUri !== currentItem.image_url) {
        imageUrl = await uploadToStorage(imageUri);
      }
      
      // Update item
      const fullCategory = itemSubcategory ? `${itemCategory} - ${itemSubcategory}` : itemCategory;
      
      await updateItem(currentItem.id, {
        name: itemName,
        category: fullCategory,
        color: itemColor,
        image_url: imageUrl,
      });
      
      // Reset form and close modal
      resetForm();
      setEditModalVisible(false);
      
      // Show success message
      Alert.alert('Success', 'Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    } finally {
      setAiProcessing(false);
    }
  };

  const handleDeleteItem = (item: any) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(item.id);
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setImageUri(null);
    setItemName('');
    setItemCategory(CATEGORY_OPTIONS[0] as keyof typeof SUBCATEGORIES);
    setItemSubcategory(SUBCATEGORIES[CATEGORY_OPTIONS[0] as keyof typeof SUBCATEGORIES][0]);
    setItemColor(COLOR_OPTIONS[0]);
    setCurrentItem(null);
  };

  const openEditModal = (item: any) => {
    setCurrentItem(item);
    setImageUri(item.image_url);
    setItemName(item.name);
    
    // Parse category and subcategory
    const categorySplit = item.category.split(' - ');
    if (categorySplit.length > 1 && CATEGORY_OPTIONS.includes(categorySplit[0])) {
      setItemCategory(categorySplit[0]);
      setItemSubcategory(categorySplit[1]);
    } else {
      setItemCategory(item.category);
      setItemSubcategory('');
    }
    
    setItemColor(item.color);
    setEditModalVisible(true);
  };

  if (!session) {
    return null; // Will be redirected by the tab layout
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.image_url }} style={styles.itemImage} />
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <View style={[styles.colorIndicator, { backgroundColor: item.color.toLowerCase() }]} />
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={styles.itemActionButton}
          onPress={() => openEditModal(item)}
        >
          <Edit size={18} color="#6366f1" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.itemActionButton}
          onPress={() => handleDeleteItem(item)}
        >
          <Trash size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setAddModalVisible(true);
          }}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {['All', ...CATEGORY_OPTIONS].map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      ) : filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.itemList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No items match your search' : 'No items in your wardrobe yet'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => {
                resetForm();
                setAddModalVisible(true);
              }}
            >
              <Text style={styles.emptyButtonText}>Add Your First Item</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Add Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => {
          resetForm();
          setAddModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Item</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  resetForm();
                  setAddModalVisible(false);
                }}
              >
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Image Picker */}
              <View style={styles.imagePickerContainer}>
                {imageUri ? (
                  <View style={styles.selectedImageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setImageUri(null)}
                    >
                      <X size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>No image selected</Text>
                  </View>
                )}

                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.imageButton}
                    onPress={pickImage}
                  >
                    <Upload size={20} color="#fff" />
                    <Text style={styles.imageButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.imageButton}
                    onPress={() => setCameraVisible(true)}
                    disabled={cameraPermission !== true}
                  >
                    <Camera size={20} color="#fff" />
                    <Text style={styles.imageButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {aiProcessing && (
                <View style={styles.aiProcessingContainer}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.aiProcessingText}>Analyzing image...</Text>
                </View>
              )}

              {/* Item Details Form */}
              <View style={styles.formContainer}>
                <Text style={styles.formLabel}>Item Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter item name"
                  value={itemName}
                  onChangeText={setItemName}
                />
                
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.pickerItem,
                          itemCategory === category && styles.pickerItemActive,
                        ]}
                        onPress={() => setItemCategory(category as keyof typeof SUBCATEGORIES)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            itemCategory === category && styles.pickerItemTextActive,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                {itemCategory && SUBCATEGORIES[itemCategory] && (
                  <>
                    <Text style={styles.formLabel}>Subcategory</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                      >
                        {SUBCATEGORIES[itemCategory].map((subcategory) => (
                          <TouchableOpacity
                            key={subcategory}
                            style={[
                              styles.pickerItem,
                              itemSubcategory === subcategory && styles.pickerItemActive,
                            ]}
                            onPress={() => setItemSubcategory(subcategory)}
                          >
                            <Text
                              style={[
                                styles.pickerItemText,
                                itemSubcategory === subcategory && styles.pickerItemTextActive,
                              ]}
                            >
                              {subcategory}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
                
                <Text style={styles.formLabel}>Color</Text>
                <View style={styles.colorContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                  >
                    {COLOR_OPTIONS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color.toLowerCase() },
                          itemColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setItemColor(color)}
                      />
                    ))}
                  </ScrollView>
                  <Text style={styles.selectedColorText}>{itemColor}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!imageUri || !itemName) && styles.submitButtonDisabled,
                ]}
                onPress={handleAddItem}
                disabled={!imageUri || !itemName || aiProcessing}
              >
                {aiProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add to Wardrobe</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => {
          resetForm();
          setEditModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  resetForm();
                  setEditModalVisible(false);
                }}
              >
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Image Picker */}
              <View style={styles.imagePickerContainer}>
                {imageUri ? (
                  <View style={styles.selectedImageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setImageUri(null)}
                    >
                      <X size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>No image selected</Text>
                  </View>
                )}

                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.imageButton}
                    onPress={pickImage}
                  >
                    <Upload size={20} color="#fff" />
                    <Text style={styles.imageButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.imageButton}
                    onPress={() => setCameraVisible(true)}
                    disabled={cameraPermission !== true}
                  >
                    <Camera size={20} color="#fff" />
                    <Text style={styles.imageButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {aiProcessing && (
                <View style={styles.aiProcessingContainer}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.aiProcessingText}>Analyzing image...</Text>
                </View>
              )}

              {/* Item Details Form - Same as Add Modal */}
              <View style={styles.formContainer}>
                <Text style={styles.formLabel}>Item Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter item name"
                  value={itemName}
                  onChangeText={setItemName}
                />
                
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.pickerItem,
                          itemCategory === category && styles.pickerItemActive,
                        ]}
                        onPress={() => setItemCategory(category as keyof typeof SUBCATEGORIES)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            itemCategory === category && styles.pickerItemTextActive,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                {itemCategory && SUBCATEGORIES[itemCategory] && (
                  <>
                    <Text style={styles.formLabel}>Subcategory</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                      >
                        {SUBCATEGORIES[itemCategory].map((subcategory) => (
                          <TouchableOpacity
                            key={subcategory}
                            style={[
                              styles.pickerItem,
                              itemSubcategory === subcategory && styles.pickerItemActive,
                            ]}
                            onPress={() => setItemSubcategory(subcategory)}
                          >
                            <Text
                              style={[
                                styles.pickerItemText,
                                itemSubcategory === subcategory && styles.pickerItemTextActive,
                              ]}
                            >
                              {subcategory}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
                
                <Text style={styles.formLabel}>Color</Text>
                <View style={styles.colorContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                  >
                    {COLOR_OPTIONS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color.toLowerCase() },
                          itemColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setItemColor(color)}
                      />
                    ))}
                  </ScrollView>
                  <Text style={styles.selectedColorText}>{itemColor}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!imageUri || !itemName) && styles.submitButtonDisabled,
                ]}
                onPress={handleEditItem}
                disabled={!imageUri || !itemName || aiProcessing}
              >
                {aiProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Camera Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={cameraVisible}
        onRequestClose={() => setCameraVisible(false)}
      >
        {cameraPermission ? (
          <View style={styles.cameraContainer}>
            <ExpoCamera
              ref={cameraRef}
              style={styles.camera}
            >
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.cameraCancelButton}
                  onPress={() => setCameraVisible(false)}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={takePicture}
                >
                  <View style={styles.cameraButtonInner} />
                </TouchableOpacity>
              </View>
            </ExpoCamera>
          </View>
        ) : (
          <View style={styles.cameraPermissionContainer}>
            <Text style={styles.cameraPermissionText}>
              Camera permission is required to take pictures.
            </Text>
            <TouchableOpacity
              style={styles.cameraPermissionButton}
              onPress={() => setCameraVisible(false)}
            >
              <Text style={styles.cameraPermissionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContainer: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
  },
  categoryText: {
    color: '#4b5563',
    fontSize: 16,
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  itemList: {
    padding: 20,
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemActions: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: 8,
  },
  itemActionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 5,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedImageContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  imageButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 8,
  },
  aiProcessingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
  },
  aiProcessingText: {
    marginLeft: 8,
    color: '#6366f1',
    fontSize: 14,
  },
  formContainer: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  pickerItemActive: {
    backgroundColor: '#6366f1',
  },
  pickerItemText: {
    color: '#4b5563',
    fontSize: 14,
  },
  pickerItemTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  colorContainer: {
    marginBottom: 20,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  selectedColorText: {
    marginTop: 8,
    color: '#4b5563',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#c7c7c7',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 30,
  },
  cameraCancelButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  cameraPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraPermissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#4b5563',
  },
  cameraPermissionButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cameraPermissionButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});