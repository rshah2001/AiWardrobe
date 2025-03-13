import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cloud, Droplets, MapPin, RefreshCw, Search, Thermometer, Wind } from 'lucide-react-native';
import { useWeatherStore } from '@/lib/weatherStore';
import { useWardrobeStore } from '@/lib/wardrobeStore';
import { useAuthStore } from '@/lib/authStore';

export default function WeatherScreen() {
  const { session } = useAuthStore();
  const { weather, loading, error, fetchWeather } = useWeatherStore();
  const { items, loading: wardrobeLoading } = useWardrobeStore();
  
  const [city, setCity] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    if (session) {
      fetchWeather();
    }
  }, [session]);
  
  const handleSearch = () => {
    if (searchCity.trim()) {
      fetchWeather(searchCity.trim());
      setCity(searchCity.trim());
      setSearchCity('');
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWeather(city || undefined);
    setRefreshing(false);
  };
  
  if (!session) {
    return null; // Will be redirected by the tab layout
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
          />
        }
      >
        <Text style={styles.title}>Weather Forecast</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search city..."
            value={searchCity}
            onChangeText={setSearchCity}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Search size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Current Weather Card */}
        <View style={styles.weatherCard}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => fetchWeather(city || undefined)}
              >
                <RefreshCw size={16} color="#fff" />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : weather ? (
            <>
              <View style={styles.locationRow}>
                <MapPin size={18} color="#6366f1" />
                <Text style={styles.locationText}>{city || 'Current Location'}</Text>
              </View>
              
              <View style={styles.weatherMain}>
                <View style={styles.temperatureContainer}>
                  <Text style={styles.temperature}>{weather.temp}°C</Text>
                  <Text style={styles.feelsLike}>Feels like {weather.feels_like}°C</Text>
                </View>
                
                <View style={styles.weatherIconContainer}>
                  {weather.icon && (
                    <Image 
                      source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png` }} 
                      style={styles.weatherIcon} 
                    />
                  )}
                  <Text style={styles.weatherDescription}>{weather.description}</Text>
                </View>
              </View>
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Wind size={18} color="#6366f1" />
                  <Text style={styles.detailText}>Wind</Text>
                  <Text style={styles.detailValue}>{weather.wind_speed} km/h</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Droplets size={18} color="#6366f1" />
                  <Text style={styles.detailText}>Humidity</Text>
                  <Text style={styles.detailValue}>{weather.humidity}%</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Cloud size={18} color="#6366f1" />
                  <Text style={styles.detailText}>Condition</Text>
                  <Text style={styles.detailValue}>{weather.description}</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>No weather data available</Text>
          )}
        </View>
        
        {/* Outfit Recommendations Based on Weather */}
        <View style={styles.recommendationCard}>
          <Text style={styles.cardTitle}>Outfit Recommendations</Text>
          
          {loading || !weather ? (
            <Text style={styles.recommendationText}>
              Loading weather data to provide recommendations...
            </Text>
          ) : (
            <>
              <Text style={styles.recommendationText}>
                {getWeatherRecommendation(weather.temp, weather.description)}
              </Text>
              
              {items.length > 0 ? (
                <View style={styles.recommendedItems}>
                  <Text style={styles.recommendedTitle}>Suggested items from your wardrobe:</Text>
                  {getRecommendedItems(items, weather).map((item, index) => (
                    <Text key={index} style={styles.recommendedItem}>• {item.name} ({item.category})</Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.noItemsText}>
                  Add items to your wardrobe to get personalized recommendations
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions for recommendations
function getWeatherRecommendation(temp: number, description: string): string {
  const lowercaseDescription = description.toLowerCase();
  const hasRain = lowercaseDescription.includes('rain') || lowercaseDescription.includes('drizzle');
  const hasSnow = lowercaseDescription.includes('snow');
  const hasClouds = lowercaseDescription.includes('cloud');
  const hasMist = lowercaseDescription.includes('mist') || lowercaseDescription.includes('fog');
  
  if (temp < 5) {
    if (hasSnow) {
      return "It's very cold with snow. Wear a heavy winter coat, thermal layers, waterproof boots, scarf, hat, and gloves.";
    } else {
      return "It's very cold today. Bundle up with a heavy winter coat, thermal layers, scarf, hat, and gloves.";
    }
  } else if (temp < 10) {
    if (hasRain) {
      return "It's cold and rainy. Wear a warm waterproof jacket, sweater, jeans, and waterproof shoes.";
    } else {
      return "It's cold today. Wear a warm jacket or coat, sweater, jeans, and closed shoes.";
    }
  } else if (temp < 18) {
    if (hasRain) {
      return "It's cool and rainy. A light waterproof jacket, long-sleeve shirt, and pants with waterproof shoes would work well.";
    } else {
      return "It's cool today. A light jacket or sweater with pants would be comfortable.";
    }
  } else if (temp < 25) {
    if (hasRain) {
      return "Mild temperatures with rain. Light waterproof jacket with a t-shirt and pants is recommended.";
    } else if (hasClouds) {
      return "Pleasant temperature with clouds. Light layers that can be removed if the sun comes out.";
    } else {
      return "Pleasant temperature today. A t-shirt with light pants or a casual dress would be comfortable.";
    }
  } else if (temp < 30) {
    if (hasRain) {
      return "Warm and rainy. Light, breathable, and quick-drying clothes are recommended with a light rain jacket.";
    } else {
      return "It's warm today. Light, breathable clothes like shorts, t-shirts, or summer dresses would be comfortable.";
    }
  } else {
    if (hasRain) {
      return "Hot and rainy. Very light, breathable clothes with a light rain jacket or umbrella.";
    } else {
      return "It's hot today. Wear very light, breathable clothes to stay cool. Don't forget sunscreen!";
    }
  }
}

function getRecommendedItems(items: any[], weather: any) {
  const temp = weather.temp;
  const lowercaseDescription = weather.description.toLowerCase();
  const hasRain = lowercaseDescription.includes('rain') || lowercaseDescription.includes('drizzle');
  const hasSnow = lowercaseDescription.includes('snow');
  
  // Define what categories to prioritize based on weather
  let topCategories: string[] = [];
  let bottomCategories: string[] = [];
  let accessoryCategories: string[] = [];
  
  if (temp < 5) {
    topCategories = ['Outerwear', 'Sweaters'];
    bottomCategories = ['Pants', 'Jeans'];
    accessoryCategories = ['Scarves', 'Hats', 'Gloves', 'Accessories'];
  } else if (temp < 15) {
    topCategories = ['Jackets', 'Outerwear', 'Sweaters', 'Long Sleeve'];
    bottomCategories = ['Pants', 'Jeans'];
    if (hasRain || hasSnow) {
      accessoryCategories = ['Shoes', 'Boots', 'Accessories'];
    }
  } else if (temp < 25) {
    topCategories = hasRain ? ['Jackets', 'Long Sleeve'] : ['T-Shirts', 'Shirts', 'Light Jackets'];
    bottomCategories = ['Pants', 'Jeans', 'Skirts'];
    if (hasRain) {
      accessoryCategories = ['Shoes', 'Accessories'];
    }
  } else {
    topCategories = ['T-Shirts', 'Tank Tops', 'Shirts'];
    bottomCategories = ['Shorts', 'Skirts', 'Light Pants'];
    accessoryCategories = ['Hats', 'Sunglasses', 'Accessories'];
  }
  
  // Filter items based on categories
  const filteredItems = items.filter(item => {
    const category = item.category.toLowerCase();
    return topCategories.some(c => category.includes(c.toLowerCase())) || 
           bottomCategories.some(c => category.includes(c.toLowerCase())) ||
           accessoryCategories.some(c => category.includes(c.toLowerCase()));
  });
  
  // Select a few items to recommend
  return filteredItems.slice(0, 4);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 180,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  weatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  temperatureContainer: {
    flex: 1,
  },
  temperature: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  feelsLike: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  weatherIconContainer: {
    alignItems: 'center',
  },
  weatherIcon: {
    width: 80,
    height: 80,
  },
  weatherDescription: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  recommendationText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  recommendedItems: {
    marginTop: 8,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  recommendedItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#e53e3e',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
  noItemsText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});