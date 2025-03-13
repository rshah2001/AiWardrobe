// stores/aiStore.ts
import { create } from 'zustand';
import { generateOutfitRecommendation, getStyleAdvice } from '../lib/openaiService';

interface AIState {
  outfitRecommendation: string | null;
  styleAdvice: string | null;
  loading: boolean;
  error: string | null;
  getOutfitRecommendation: (weather: any, wardrobeItems: any[], occasion?: string) => Promise<void>;
  getStyleAdvice: (item: any, question: string) => Promise<void>;
  clearRecommendation: () => void;
  clearStyleAdvice: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  outfitRecommendation: null,
  styleAdvice: null,
  loading: false,
  error: null,
  
  getOutfitRecommendation: async (weather, wardrobeItems, occasion) => {
    set({ loading: true, error: null });
    try {
      const recommendation = await generateOutfitRecommendation(weather, wardrobeItems, occasion);
      set({ outfitRecommendation: recommendation, loading: false });
    } catch (error) {
      console.error('Error in AI recommendation:', error);
      set({ 
        error: 'Failed to generate recommendation. Please try again.', 
        loading: false 
      });
    }
  },
  
  getStyleAdvice: async (item, question) => {
    set({ loading: true, error: null });
    try {
      const advice = await getStyleAdvice(item, question);
      set({ styleAdvice: advice, loading: false });
    } catch (error) {
      console.error('Error getting style advice:', error);
      set({ 
        error: 'Failed to get style advice. Please try again.', 
        loading: false 
      });
    }
  },
  
  clearRecommendation: () => set({ outfitRecommendation: null }),
  clearStyleAdvice: () => set({ styleAdvice: null }),
}));