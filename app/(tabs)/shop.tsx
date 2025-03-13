import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, Filter, Search, ShoppingBag, X } from 'lucide-react-native';
import { useWeatherStore } from '@/lib/weatherStore';
import axios from 'axios';

// Mock data for fashion items - in a real app, this would come from an API
const MOCK_FASHION_ITEMS = [
  {
    id: '1',
    name: 'Classic White T-Shirt',
    brand: 'Essentials',
    price: 19.99,
    category: 'Tops',
    description: 'A versatile white t-shirt made from 100% organic cotton.',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    link: 'https://www.example.com/product/1',
  },
  {
    id: '2',
    name: 'Slim Fit Jeans',
    brand: 'Denim Co.',
    price: 49.99,
    category: 'Bottoms',
    description: 'Comfortable slim fit jeans with a modern wash.',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    link: 'https://www.example.com/product/2',
  },
  {
    id: '3',
    name: 'Casual Blazer',
    brand: 'Urban Style',
    price: 89.99,
    category: 'Outerwear',
    description: 'A versatile blazer that works for both casual and formal occasions.',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    link: 'https://www.example.com/product/3',
  },
  {
    id: '4',
    name: 'Summer Dress',
    brand: 'Sunlight',
    price: 59.99,
    category: 'Dresses',
    description: 'Light and flowing summer dress with floral pattern.',
    imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    link: 'https://www.example.com/product/4',
  },
  {
    id: '5',
    name: 'Leather Sneakers',
    brand: 'StepWell',
    price: 79.99,
    category: 'Shoes',
    description: 'Comfortable and stylish leather sneakers for everyday wear.',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    link: 'https://www.example.com/product/5',
  },
  {
    id: '6',
    name: 'Wool Sweater',
    brand: 'Cozy',
    price: 65.99,
    category: 'Tops',
    description: 'Warm wool sweater perfect for cold weather.',
    imageUrl: 'https://images.unsplash.com/photo-1599663501548-54f238a7af9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    link: 'https://www.example.com/product/6',
  },
  {
    id: '7',
    name: 'Waterproof Jacket',
    brand: 'OutdoorPlus',
    price: 99.99,
    category: 'Outerwear',
    description: 'Durable waterproof jacket for rainy days and outdoor activities.',
    imageUrl: 'https://images.unsplash.com/photo-1545594861-3bef43ff2fc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    link: 'https://www.example.com/product/7',
  },
  {
    id: '8',
    name: 'Formal Shirt',
    brand: 'Executive',
    price: 45.99,
    category: 'Tops',
    description: 'Crisp formal shirt suitable for business occasions.',
    imageUrl: 'https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    link: 'https://www.example.com/product/8',
  },
];

// Category icons
const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'tops', name: 'Tops' },
  { id: 'bottoms', name: 'Bottoms' },
  { id: 'dresses', name: 'Dresses' },
  { id: 'outerwear', name: 'Outerwear' },
  { id: 'shoes', name: 'Shoes' },
  { id: 'accessories', name: 'Accessories' },
];

// Price range filters
const PRICE_RANGES = [
  { id: 'all', name: 'All Prices' },
  { id: 'under25', name: 'Under $25' },
  { id: '25to50', name: '$25 to $50' },
  { id: '50to100', name: '$50 to $100' },
  { id: 'over100', name: 'Over $100' },
];

export default function ShopScreen() {
  const { weather } = useWeatherStore();
  const [items, setItems] = useState(MOCK_FASHION_ITEMS);
  const [filteredItems, setFilteredItems] = useState(MOCK_FASHION_ITEMS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof MOCK_FASHION_ITEMS[0] | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [weatherRecommendations, setWeatherRecommendations] = useState<typeof MOCK_FASHION_ITEMS>([]);


  useEffect(() => {
    // In a real app, fetch items from API
    // For demo, we're using the mock data
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (weather) {
      generateWeatherRecommendations();
    }
  }, [weather, items]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, selectedPriceRange, items]);

  const generateWeatherRecommendations = () => {
    if (!weather || !items.length) return;

    const temp = weather.temp;
    const hasRain = weather.description.toLowerCase().includes('rain');
    
    let recommendedCategories = [];
    
    if (temp < 10) {
      recommendedCategories = ['Outerwear', 'Tops'];
      if (hasRain) recommendedCategories.push('Shoes');
    } else if (temp < 20) {
      recommendedCategories = ['Tops', 'Bottoms'];
      if (hasRain) recommendedCategories.push('Outerwear');
    } else {
      recommendedCategories = ['Tops', 'Dresses', 'Bottoms'];
    }
    
    const recommendations = items.filter(item => 
      recommendedCategories.some(cat => 
        item.category.toLowerCase().includes(cat.toLowerCase())
      )
    );
    
    // Limit to 4 items
    setWeatherRecommendations(recommendations.slice(0, 4));
  };

  const applyFilters = () => {
    let filtered = [...items];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Apply price filter
    if (selectedPriceRange !== 'all') {
      switch (selectedPriceRange) {
        case 'under25':
          filtered = filtered.filter(item => item.price < 25);
          break;
        case '25to50':
          filtered = filtered.filter(item => item.price >= 25 && item.price <= 50);
          break;
        case '50to100':
          filtered = filtered.filter(item => item.price > 50 && item.price <= 100);
          break;
        case 'over100':
          filtered = filtered.filter(item => item.price > 100);
          break;
      }
    }
    
    setFilteredItems(filtered);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setFilterModalVisible(false);
  };

interface FashionItem {
    id: string;
    name: string;
    brand: string;
    price: number;
    category: string;
    description: string;
    imageUrl: string;
    link: string;
}

interface Weather {
    temp: number;
    description: string;
}

interface Recommendation {
    id: string;
    name: string;
    brand: string;
    price: number;
    category: string;
    description: string;
    imageUrl: string;
    link: string;
  }

const openItemDetails = (item: FashionItem) => {
    setSelectedItem(item);
    setDetailsModalVisible(true);
};

const openProductLink = (url: string) => {
    Linking.canOpenURL(url).then(supported => {
        if (supported) {
            Linking.openURL(url);
        } else {
            Alert.alert("Error", "Cannot open this URL");
        }
    });
};

  const renderItem = ({ item }: { item: FashionItem }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => openItemDetails(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemContent}>
        <Text style={styles.itemBrand}>{item.brand}</Text>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderWeatherItem = ({ item }: { item: FashionItem }) => (
    <TouchableOpacity 
      style={styles.weatherItemCard}
      onPress={() => openItemDetails(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.weatherItemImage} />
      <View style={styles.weatherItemContent}>
        <Text style={styles.weatherItemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.weatherItemPrice}>${item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={24} color="#4b5563" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clothes, brands..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Weather-based recommendations */}
        {weather && weatherRecommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>Recommended for Today's Weather</Text>
            <Text style={styles.weatherInfo}>
              {weather.temp}°C, {weather.description}
            </Text>
            
            <FlatList
              data={weatherRecommendations}
              renderItem={renderWeatherItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weatherItemsContainer}
            />
          </View>
        )}

        {/* Category selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        ) : filteredItems.length > 0 ? (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.itemsGrid}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No items match your search</Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Items</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <Text style={styles.filterLabel}>Categories</Text>
              <View style={styles.filterOptions}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.filterOption,
                      selectedCategory === category.id && styles.filterOptionActive,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedCategory === category.id && styles.filterOptionTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.filterOptions}>
                {PRICE_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    style={[
                      styles.filterOption,
                      selectedPriceRange === range.id && styles.filterOptionActive,
                    ]}
                    onPress={() => setSelectedPriceRange(range.id)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedPriceRange === range.id && styles.filterOptionTextActive,
                      ]}
                    >
                      {range.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.filterButtons}>
                <TouchableOpacity 
                  style={styles.resetFiltersButton}
                  onPress={resetFilters}
                >
                  <Text style={styles.resetFiltersText}>Reset All</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Item Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        {selectedItem && (
          <View style={styles.modalContainer}>
            <View style={styles.detailsModalContent}>
              <ScrollView>
                <Image 
                  source={{ uri: selectedItem.imageUrl }} 
                  style={styles.detailsImage} 
                />
                
                <TouchableOpacity 
                  style={styles.closeDetailsButton}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.detailsContent}>
                  <Text style={styles.detailsBrand}>{selectedItem.brand}</Text>
                  <Text style={styles.detailsName}>{selectedItem.name}</Text>
                  <Text style={styles.detailsPrice}>${selectedItem.price.toFixed(2)}</Text>
                  
                  <Text style={styles.detailsCategory}>
                    Category: {selectedItem.category}
                  </Text>
                  
                  <Text style={styles.detailsDescription}>
                    {selectedItem.description}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.buyButton}
                    onPress={() => openProductLink(selectedItem.link)}
                  >
                    <Text style={styles.buyButtonText}>View Product</Text>
                    <ExternalLink size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
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
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  recommendationsSection: {
    margin: 20,
    marginTop: 0,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  weatherInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  weatherItemsContainer: {
    paddingVertical: 8,
  },
  weatherItemCard: {
    width: 140,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  weatherItemImage: {
    width: '100%',
    height: 180,
  },
  weatherItemContent: {
    padding: 12,
  },
  weatherItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  weatherItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 10,
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
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  itemsGrid: {
    paddingHorizontal: 16,
  },
  itemCard: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  itemContent: {
    padding: 12,
  },
  itemBrand: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontWeight: '500',
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
    maxHeight: '80%',
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
    padding: 4,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#6366f1',
  },
  filterOptionText: {
    color: '#4b5563',
    fontSize: 14,
  },
  filterOptionTextActive: {
    color: '#ffffff',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resetFiltersButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  resetFiltersText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  detailsModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  detailsImage: {
    width: '100%',
    height: 400,
  },
  closeDetailsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContent: {
    padding: 20,
  },
  detailsBrand: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailsName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  detailsPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 16,
  },
  detailsCategory: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 16,
  },
  detailsDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
    marginBottom: 24,
  },
  buyButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buyButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});