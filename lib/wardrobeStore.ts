import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  image_url: string;
  created_at: string;
}

interface WardrobeState {
  items: WardrobeItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<WardrobeItem, 'id' | 'created_at'>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  fetchItems: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ items: data, error: null });
    } catch (error) {
      set({ error: 'Failed to fetch wardrobe items' });
    } finally {
      set({ loading: false });
    }
  },
  addItem: async (item) => {
    set({ loading: true });
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
    } catch (error) {
      set({ error: 'Failed to add wardrobe item' });
    } finally {
      set({ loading: false });
    }
  },
  deleteItem: async (id) => {
    set({ loading: true });
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
      set({ error: 'Failed to delete wardrobe item' });
    } finally {
      set({ loading: false });
    }
  },
}));