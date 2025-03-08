import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useWardrobeStore } from '@/lib/wardrobeStore';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '@/lib/authStore';

// Define interface for the outfit
interface Outfit {
  id: string;
  name: string;
  occasion: string;
  created_at: string;
  items: OutfitItem[];
}

interface OutfitItem {
  id: string;
  outfit_id: string;
  wardrobe_item_id: string;
  wardrobeItem?: WardrobeItem;  // Changed from wardrobe_items to wardrobeItem
}

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  image_url: string;
}

export default function OutfitsScreen() {
  const { items, loading: wardrobeLoading, fetchItems } = useWardrobeStore();
  const { session } = useAuthStore();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('Casual');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentOutfit, setCurrentOutfit] = useState<Outfit | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchOutfits();
  }, []);

  const goBack = () => {
    router.back();
  };

  const fetchOutfits = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      // Fetch outfits
      const { data: outfitsData, error: outfitsError } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (outfitsError) throw outfitsError;

      // Initialize outfits array
      const outfitsWithItems: Outfit[] = [];

      // For each outfit, fetch its items
      for (const outfit of outfitsData) {
        const { data: outfitItemsData, error: outfitItemsError } = await supabase
          .from('outfit_items')
          .select(`
            id, 
            outfit_id, 
            wardrobe_item_id,
            wardrobe_items (*)
          `)
          .eq('outfit_id', outfit.id);

        if (outfitItemsError) throw outfitItemsError;

        // Transform the data to match our interface
        const transformedItems = outfitItemsData.map(item => ({
          id: item.id,
          outfit_id: item.outfit_id,
          wardrobe_item_id: item.wardrobe_item_id,
          wardrobeItem: item.wardrobe_items  // Map from wardrobe_items to wardrobeItem
        }));

        outfitsWithItems.push({
          ...outfit,
          items: transformedItems
        });
      }

      setOutfits(outfitsWithItems);
    } catch (error) {
      console.error('Error fetching outfits:', error);
      Alert.alert('Error', 'Failed to load outfits');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOutfit = async () => {
    if (!session) {
      Alert.alert('Error', 'You must be logged in to create outfits');
      return;
    }

    if (!name) {
      Alert.alert('Error', 'Please enter a name for the outfit');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item for your outfit');
      return;
    }

    setLoading(true);
    try {
      // Create outfit
      const { data: outfitData, error: outfitError } = await supabase
        .from('outfits')
        .insert([{ 
          name, 
          occasion,
          user_id: session.user.id 
        }])
        .select()
        .single();

      if (outfitError) throw outfitError;

      // Create outfit items
      const outfitItems = selectedItems.map(itemId => ({
        outfit_id: outfitData.id,
        wardrobe_item_id: itemId,
      }));

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);

      if (itemsError) throw itemsError;

      // Refresh outfits
      await fetchOutfits();

      // Reset form
      setName('');
      setOccasion('Casual');
      setSelectedItems([]);
      setModalVisible(false);
    } catch (error) {
      console.error('Error adding outfit:', error);
      Alert.alert('Error', 'Failed to add outfit');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOutfit = async (id: string) => {
    Alert.alert(
      'Delete Outfit',
      'Are you sure you want to delete this outfit?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Delete the outfit (outfit_items will be cascaded)
              const { error } = await supabase
                .from('outfits')
                .delete()
                .eq('id', id);

              if (error) throw error;

              // Refresh outfits
              await fetchOutfits();
            } catch (error) {
              console.error('Error deleting outfit:', error);
              Alert.alert('Error', 'Failed to delete outfit');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openOutfitDetails = (outfit: Outfit) => {
    setCurrentOutfit(outfit);
    setDetailsModalVisible(true);
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Outfits</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.outfitContainer}
              onPress={() => openOutfitDetails(item)}
            >
              <View style={styles.outfitHeader}>
                <View>
                  <Text style={styles.outfitName}>{item.name}</Text>
                  <Text style={styles.outfitOccasion}>{item.occasion}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteOutfit(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                </TouchableOpacity>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.outfitItems}
              >
                {item.items.map(outfitItem => (
                  <View key={outfitItem.id} style={styles.outfitItemContainer}>
                    <Image 
                      source={{ uri: outfitItem.wardrobeItem?.image_url }} 
                      style={styles.outfitItemImage} 
                    />
                    <Text style={styles.outfitItemCategory} numberOfLines={1}>
                      {outfitItem.wardrobeItem?.category}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No outfits found</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.emptyButtonText}>Create your first outfit</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add Outfit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setName('');
          setOccasion('Casual');
          setSelectedItems([]);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Outfit</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Outfit Name"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Occasion:</Text>
              <Picker
                selectedValue={occasion}
                onValueChange={(value) => setOccasion(value)}
                style={styles.picker}
              >
                <Picker.Item label="Casual" value="Casual" />
                <Picker.Item label="Work" value="Work" />
                <Picker.Item label="Formal" value="Formal" />
                <Picker.Item label="Sport" value="Sport" />
                <Picker.Item label="Beach" value="Beach" />
                <Picker.Item label="Party" value="Party" />
              </Picker>
            </View>

            <Text style={styles.sectionTitle}>Select Items</Text>
            
            {wardrobeLoading ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'].map(category => {
                  const categoryItems = items.filter(item => item.category === category);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <View key={category} style={styles.categorySection}>
                      <Text style={styles.categoryTitle}>{category}</Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.itemsContainer}
                      >
                        {categoryItems.map(item => (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.selectableItem,
                              selectedItems.includes(item.id) && styles.selectedItem,
                            ]}
                            onPress={() => toggleItemSelection(item.id)}
                          >
                            <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            {selectedItems.includes(item.id) && (
                              <View style={styles.checkmarkContainer}>
                                <Ionicons name="checkmark-circle" size={20} color="#4A90E2" />
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setName('');
                  setOccasion('Casual');
                  setSelectedItems([]);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddOutfit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Outfit Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.detailsHeader}>
              <Text style={styles.modalTitle}>{currentOutfit?.name}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.outfitOccasion}>{currentOutfit?.occasion}</Text>
            
            <Text style={styles.sectionTitle}>Outfit Items</Text>
            
            {currentOutfit?.items.map(item => (
              <View key={item.id} style={styles.detailItemRow}>
                <Image 
                  source={{ uri: item.wardrobeItem?.image_url }} 
                  style={styles.detailItemImage} 
                />
                <View style={styles.detailItemInfo}>
                  <Text style={styles.detailItemName}>{item.wardrobeItem?.name}</Text>
                  <Text style={styles.detailItemCategory}>{item.wardrobeItem?.category}</Text>
                  {item.wardrobeItem?.color && (
                    <Text style={styles.detailItemColor}>{item.wardrobeItem.color}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
    paddingBottom: 50,
  },
  outfitContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  outfitName: {
    fontSize: 18,
    fontWeight: '600',
  },
  outfitOccasion: {
    color: '#666',
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
  outfitItems: {
    paddingTop: 5,
    paddingBottom: 5,
  },
  outfitItemContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  outfitItemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 5,
  },
  outfitItemCategory: {
    fontSize: 12,
    color: '#666',
    width: 70,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    marginBottom: 8,
    color: '#666',
  },
  picker: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 15,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  itemsContainer: {
    paddingBottom: 10,
  },
  selectableItem: {
    width: 100,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedItem: {
    borderColor: '#4A90E2',
    backgroundColor: '#f0f7ff',
  },
  itemImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    marginBottom: 5,
  },
  itemName: {
    fontSize: 14,
    textAlign: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  closeButton: {
    padding: 5,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 10,
  },
  detailItemImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 15,
  },
  detailItemInfo: {
    flex: 1,
  },
  detailItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailItemCategory: {
    fontSize: 14,
    color: '#666',
  },
  detailItemColor: {
    fontSize: 12,
    color: '#888',
  },
});