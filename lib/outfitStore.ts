import { create } from 'zustand';
import { supabase } from './supabase';

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  image_url: string;
}

interface OutfitItem {
  id: string;
  outfit_id: string;
  wardrobe_item_id: string;
  wardrobeItem?: WardrobeItem;
}

interface Outfit {
  id: string;
  name: string;
  occasion: string;
  created_at: string;
  updated_at: string;
  items: OutfitItem[];
}

interface CreateOutfitData {
  name: string;
  occasion: string;
  itemIds: string[];
}

interface OutfitState {
  outfits: Outfit[];
  loading: boolean;
  error: string | null;
  fetchOutfits: () => Promise<void>;
  addOutfit: (outfitData: CreateOutfitData) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
}

export const useOutfitStore = create<OutfitState>((set, get) => ({
  outfits: [],
  loading: false,
  error: null,
  fetchOutfits: async () => {
    set({ loading: true });
    try {
      // Fetch outfits
      const { data: outfitsData, error: outfitsError } = await supabase
        .from('outfits')
        .select('*')
        .order('created_at', { ascending: false });

      if (outfitsError) throw outfitsError;

      // Initialize outfits array
      const outfitsWithItems: Outfit[] = [];

      // For each outfit, fetch its items
      for (const outfit of outfitsData) {
        const { data: outfitItemsData, error: outfitItemsError } = await supabase
          .from('outfit_items')
          .select('*, wardrobe_items(*)')
          .eq('outfit_id', outfit.id);

        if (outfitItemsError) throw outfitItemsError;

        // Transform the data to match our interface
        const transformedItems = outfitItemsData.map(item => ({
          id: item.id,
          outfit_id: item.outfit_id,
          wardrobe_item_id: item.wardrobe_item_id,
          wardrobeItem: item.wardrobe_items
        }));

        outfitsWithItems.push({
          ...outfit,
          items: transformedItems
        });
      }

      set({ outfits: outfitsWithItems, error: null });
    } catch (error) {
      console.error('Error fetching outfits:', error);
      set({ error: 'Failed to fetch outfits' });
    } finally {
      set({ loading: false });
    }
  },
  addOutfit: async ({ name, occasion, itemIds }) => {
    set({ loading: true });
    try {
      // Create outfit
      const { data: outfitData, error: outfitError } = await supabase
        .from('outfits')
        .insert([{ name, occasion }])
        .select()
        .single();

      if (outfitError) throw outfitError;

      // Create outfit items
      const outfitItems = itemIds.map(itemId => ({
        outfit_id: outfitData.id,
        wardrobe_item_id: itemId,
      }));

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);

      if (itemsError) throw itemsError;

      // Fetch the updated outfits
      await get().fetchOutfits();
    } catch (error) {
      console.error('Error adding outfit:', error);
      set({ error: 'Failed to add outfit' });
    } finally {
      set({ loading: false });
    }
  },
  deleteOutfit: async (id) => {
    set({ loading: true });
    try {
      // Delete the outfit (outfit_items will be cascaded due to DB constraints)
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update the state locally
      set((state) => ({
        outfits: state.outfits.filter((outfit) => outfit.id !== id),
        error: null,
      }));
    } catch (error) {
      console.error('Error deleting outfit:', error);
      set({ error: 'Failed to delete outfit' });
    } finally {
      set({ loading: false });
    }
  }
}));