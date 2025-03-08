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
import { Cloud, Droplets, Thermometer, Wind, Search, X, RefreshCw } from 'lucide-react-native';

const occasions = [
  'Casual', 'Work', 'Formal', 'Date Night', 'Workout', 'Beach', 'Party'
];

export default function HomeScreen() {
  const { session } = useAuthStore();
  const { 
    weather: weather, 
    loading: weatherLoading, 
    fetchWeather: fetchWeather 
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
  const [occasionModalVisible, setOccasionModalVisible] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState('Casual');

  useEffect(() => {
    fetchWeather();
    fetchItems();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWeather(), fetchItems()]);
    clearRecommendation();
    setRefreshing(false);
  };

  const handleCitySearch = () => {
    if (cityInput.trim()) {
      fetchWeather(cityInput);
      setCitySearchVisible(false);
      setCityInput('');
    }
  };

  const generateRecommendation = async () => {
    if (!weather || items.length === 0) return;
    await getOutfitRecommendation(weather, items, selectedOccasion);
  };

  if (!session) {
    return null; // Will be redirected by the tab layout
  }

  if (weatherLoading || wardrobeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your fashion assistant...</Text>
      </View>
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
            <Text style={styles.greeting}>Hello, {session.user.email?.split('@')[0]}!</Text>
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
            <Text style={styles.cardTitle}>Today's Weather</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => fetchWeather()}
            >
              <RefreshCw size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>
          
          {weather ? (
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
            <Text style={styles.emptyText}>Weather information unavailable</Text>
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
                <Text style={styles.newRecommendationText}>Generate New Suggestion</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyRecommendationContainer}>
              <Text style={styles.outfitRecommendation}>
                Get AI-powered outfit recommendations tailored to the weather and your personal style.
              </Text>
              <TouchableOpacity 
                style={styles.generateButton}
                onPress={generateRecommendation}
                disabled={items.length === 0}
              >
                <Text style={styles.generateButtonText}>
                  {items.length === 0 ? 'Add items to your wardrobe first' : 'Generate Outfit Suggestion'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* From Your Wardrobe Section */}
        {items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>From Your Wardrobe</Text>
            <View style={styles.recommendedItems}>
              {items.slice(0, 4).map((item) => (
                <Text key={item.id} style={styles.recommendedItem}>• {item.name} ({item.category})</Text>
              ))}
              {items.length > 4 && (
                <Text style={styles.moreItemsText}>
                  +{items.length - 4} more items in your wardrobe
                </Text>
              )}
            </View>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
    marginTop: 16,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  newRecommendationText: {
    color: '#6366f1',
    fontWeight: '500',
    fontSize: 14,
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