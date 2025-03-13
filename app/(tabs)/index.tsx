import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../lib/authStore';
import { useWeatherStore } from '../../lib/weatherStore';
import { useWardrobeStore } from '../../lib/wardrobeStore';
import { useAIStore } from '../../stores/aiStore';
import { Droplets, Thermometer, Wind, Search, X, RefreshCw, MapPin, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';

const occasions = [
  'Casual', 'Work', 'Formal', 'Date Night', 'Workout', 'Beach', 'Party'
];

export default function HomeScreen() {
  const { session } = useAuthStore();
  const { 
    weather, 
    loading: weatherLoading,
    error: weatherError,
    fetchWeather 
  } = useWeatherStore();
  const { 
    items, 
    loading: wardrobeLoading, 
    fetchItems 
  } = useWardrobeStore();
  const {
    outfitRecommendation,
    loading: aiLoading,
    getOutfitRecommendation,
    clearRecommendation
  } = useAIStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [citySearchVisible, setCitySearchVisible] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [currentCity, setCurrentCity] = useState('London'); // Default city
  const [occasionModalVisible, setOccasionModalVisible] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState('Casual');
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!session) {
      router.replace('/login');
      return;
    }
    
    // Load data on initial mount
    const loadData = async () => {
      try {
        console.log('Fetching weather data...');
        await fetchWeather(currentCity);
        console.log('Weather data:', weather);
        
        console.log('Fetching wardrobe items...');
        await fetchItems();
        console.log('Wardrobe items:', items);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        // Hide initial loading state regardless of success/failure
        setInitialLoad(false);
      }
    };
    
    loadData();
  }, [session]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchWeather(currentCity), fetchItems()]);
      clearRecommendation();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCitySearch = () => {
    if (cityInput.trim()) {
      setCurrentCity(cityInput);
      fetchWeather(cityInput);
      setCitySearchVisible(false);
      setCityInput('');
    }
  };

  const generateRecommendation = async () => {
    if (!weather || items.length === 0) {
      if (items.length === 0) {
        Alert.alert(
          "No Wardrobe Items",
          "Please add some clothing items to your wardrobe first to get outfit recommendations.",
          [
            { text: "Add Items", onPress: () => router.push('/wardrobe') },
            { text: "Cancel", style: "cancel" }
          ]
        );
      }
      return;
    }
    await getOutfitRecommendation(weather, items, selectedOccasion);
  };

  // Handle initial loading state
  if (initialLoad) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading your fashion assistant...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle authentication redirect
  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Redirecting to login...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with search city option */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {session.user.email?.split('@')[0] || 'there'}!</Text>
            <Text style={styles.subtitle}>How are you dressing today?</Text>
          </View>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setCitySearchVisible(true)}
          >
            <Search size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
        
        {/* Weather Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.locationDisplay}>
              <Text style={styles.cardTitle}>Today's Weather</Text>
              {currentCity && (
                <View style={styles.locationContainer}>
                  <MapPin size={14} color="#6366f1" />
                  <Text style={styles.locationText}>{currentCity}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => fetchWeather(currentCity)}
            >
              <RefreshCw size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>
          
          {weatherLoading ? (
            <View style={styles.weatherLoadingContainer}>
              <ActivityIndicator color="#6366f1" />
              <Text style={styles.weatherLoadingText}>Fetching weather data...</Text>
            </View>
          ) : weatherError ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={24} color="#ef4444" />
              <Text style={styles.errorText}>
                {typeof weatherError === 'string' 
                  ? weatherError 
                  : "Couldn't fetch weather. Please try again."}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchWeather(currentCity)}
              >
                <RefreshCw size={16} color="#ffffff" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : weather ? (
            <View style={styles.weatherContent}>
              <View style={styles.weatherMain}>
                <View style={styles.weatherTemp}>
                  <Text style={styles.temperature}>{weather.temp}°C</Text>
                  <Text style={styles.weatherDescription}>{weather.description}</Text>
                </View>
                
                {weather.icon && (
                  <Image 
                    source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png` }}
                    style={styles.weatherIcon}
                  />
                )}
              </View>
              
              <View style={styles.weatherDetails}>
                <View style={styles.weatherItem}>
                  <Thermometer size={16} color="#6366f1" />
                  <Text style={styles.weatherItemText}>Feels like: {weather.feels_like}°C</Text>
                </View>
                
                <View style={styles.weatherItem}>
                  <Droplets size={16} color="#6366f1" />
                  <Text style={styles.weatherItemText}>Humidity: {weather.humidity}%</Text>
                </View>
                
                <View style={styles.weatherItem}>
                  <Wind size={16} color="#6366f1" />
                  <Text style={styles.weatherItemText}>Wind: {weather.wind_speed} km/h</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyText}>Weather information unavailable</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => fetchWeather(currentCity)}
              >
                <RefreshCw size={16} color="#6366f1" />
                <Text style={styles.emptyStateButtonText}>Get Weather</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* AI Outfit Recommendation Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>AI Outfit Suggestion</Text>
            <TouchableOpacity 
              style={styles.occasionButton}
              onPress={() => setOccasionModalVisible(true)}
            >
              <Text style={styles.occasionButtonText}>{selectedOccasion}</Text>
            </TouchableOpacity>
          </View>
          
          {aiLoading ? (
            <View style={styles.aiLoadingContainer}>
              <ActivityIndicator color="#6366f1" />
              <Text style={styles.aiLoadingText}>Generating your perfect outfit...</Text>
            </View>
          ) : outfitRecommendation ? (
            <View style={styles.recommendationContainer}>
              <Text style={styles.recommendationText}>{outfitRecommendation}</Text>
              <TouchableOpacity 
                style={styles.newRecommendationButton}
                onPress={generateRecommendation}
              >
                <RefreshCw size={14} color="#6366f1" />
                <Text style={styles.newRecommendationText}>Generate New Suggestion</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyRecommendationContainer}>
              <Text style={styles.outfitRecommendation}>
                Get AI-powered outfit recommendations tailored to the weather and your personal style.
              </Text>
              <TouchableOpacity 
                style={[
                  styles.generateButton,
                  (items.length === 0 || !weather) && styles.disabledButton
                ]}
                onPress={generateRecommendation}
                disabled={items.length === 0 || !weather}
              >
                <Text style={styles.generateButtonText}>
                  {items.length === 0 
                    ? 'Add items to your wardrobe first' 
                    : !weather 
                    ? 'Waiting for weather data'
                    : 'Generate Outfit Suggestion'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* From Your Wardrobe Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Wardrobe</Text>
          {wardrobeLoading ? (
            <View style={styles.wardrobeLoadingContainer}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.wardrobeLoadingText}>Loading items...</Text>
            </View>
          ) : items.length > 0 ? (
            <View style={styles.recommendedItems}>
              {items.slice(0, 4).map((item) => (
                <Text key={item.id} style={styles.recommendedItem}>• {item.name} ({item.category})</Text>
              ))}
              {items.length > 4 && (
                <Text style={styles.moreItemsText}>
                  +{items.length - 4} more items in your wardrobe
                </Text>
              )}
              <TouchableOpacity
                style={styles.viewWardrobeButton}
                onPress={() => router.push('/wardrobe')}
              >
                <Text style={styles.viewWardrobeButtonText}>View Wardrobe</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyText}>Your wardrobe is empty</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push('/wardrobe')}
              >
                <Text style={styles.emptyStateButtonText}>Add Clothing Items</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* City Search Modal */}
      <Modal
        visible={citySearchVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCitySearchVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Location</Text>
              <TouchableOpacity onPress={() => setCitySearchVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.cityInput}
              placeholder="Enter city name"
              value={cityInput}
              onChangeText={setCityInput}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleCitySearch}
            />
            
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleCitySearch}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Occasion Selection Modal */}
      <Modal
        visible={occasionModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setOccasionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Occasion</Text>
              <TouchableOpacity onPress={() => setOccasionModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {occasions.map((occasion) => (
              <TouchableOpacity
                key={occasion}
                style={[
                  styles.occasionOption,
                  selectedOccasion === occasion && styles.selectedOccasion
                ]}
                onPress={() => {
                  setSelectedOccasion(occasion);
                  setOccasionModalVisible(false);
                }}
              >
                <Text style={[
                  styles.occasionOptionText,
                  selectedOccasion === occasion && styles.selectedOccasionText
                ]}>
                  {occasion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationDisplay: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    color: '#6366f1',
    marginLeft: 4,
    fontSize: 14,
  },
  refreshButton: {
    padding: 4,
  },
  weatherContent: {
    flexDirection: 'column',
  },
  weatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherTemp: {
    flexDirection: 'column',
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherDescription: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
  },
  weatherIcon: {
    width: 70,
    height: 70,
  },
  weatherDetails: {
    marginTop: 4,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherItemText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  weatherLoadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  weatherLoadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  wardrobeLoadingContainer: {
    padding: 8,
    alignItems: 'center',
  },
  wardrobeLoadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#ef4444',
    marginVertical: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 12,
  },
  emptyStateButton: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateButtonText: {
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 6,
  },
  outfitRecommendation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  recommendedItems: {
    marginTop: 8,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  recommendedItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
  },
  moreItemsText: {
    fontSize: 14,
    color: '#6366f1',
    marginTop: 8,
    textAlign: 'center',
  },
  viewWardrobeButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  viewWardrobeButtonText: {
    color: '#6366f1',
    fontWeight: '500',
  },
  occasionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  occasionButtonText: {
    color: '#6366f1',
    fontWeight: '500',
    fontSize: 14,
  },
  aiLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  aiLoadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  recommendationContainer: {
    padding: 4,
  },
  recommendationText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  newRecommendationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
  },
  newRecommendationText: {
    color: '#6366f1',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
  emptyRecommendationContainer: {
    alignItems: 'center',
    padding: 8,
  },
  generateButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a5a6f6',
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cityInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  occasionOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOccasion: {
    backgroundColor: '#f0f4ff',
  },
  occasionOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOccasionText: {
    color: '#6366f1',
    fontWeight: '500',
  },
});