import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../lib/authStore';
import { useWeatherStore } from '../../lib/weatherStore';
import { useWardrobeStore } from '../../lib/wardrobeStore';
import { Cloud, Droplets, Thermometer, Wind } from 'lucide-react-native';

export default function HomeScreen() {
  const { session } = useAuthStore();
  const { weather, loading: weatherLoading, fetchWeather } = useWeatherStore();
  const { items, loading: wardrobeLoading, fetchItems } = useWardrobeStore();

  useEffect(() => {
    fetchWeather();
    fetchItems();
  }, []);

  if (!session) {
    return null; // Will be redirected by the tab layout
  }

  if (weatherLoading || wardrobeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.greeting}>Hello, {session.user.email?.split('@')[0]}!</Text>
        
        {/* Weather Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Weather</Text>
          
          {weather ? (
            <View style={styles.weatherContent}>
              <View style={styles.weatherMain}>
                <Text style={styles.temperature}>{weather.temp}°C</Text>
                <Text style={styles.weatherDescription}>{weather.description}</Text>
              </View>
              
              <View style={styles.weatherDetails}>
                <View style={styles.weatherItem}>
                  <Thermometer size={18} color="#6366f1" />
                  <Text style={styles.weatherItemText}>Feels like: {weather.feels_like}°C</Text>
                </View>
                
                <View style={styles.weatherItem}>
                  <Droplets size={18} color="#6366f1" />
                  <Text style={styles.weatherItemText}>Humidity: {weather.humidity}%</Text>
                </View>
                
                <View style={styles.weatherItem}>
                  <Wind size={18} color="#6366f1" />
                  <Text style={styles.weatherItemText}>Wind: {weather.wind_speed} km/h</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Weather information unavailable</Text>
          )}
        </View>
        
        {/* Recommended Outfit Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recommended for Today</Text>
          
          <Text style={styles.outfitRecommendation}>
            Based on the weather, we recommend wearing layers today.
          </Text>
          
          {items.length > 0 ? (
            <View style={styles.recommendedItems}>
              <Text style={styles.recommendedTitle}>From your wardrobe:</Text>
              {items.slice(0, 3).map((item) => (
                <Text key={item.id} style={styles.recommendedItem}>• {item.name} ({item.category})</Text>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Add items to your wardrobe to get personalized recommendations</Text>
          )}
        </View>
      </ScrollView>
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
  scrollContainer: {
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  weatherContent: {
    flexDirection: 'column',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    marginRight: 16,
    color: '#333',
  },
  weatherDescription: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
  },
  weatherDetails: {
    marginTop: 8,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherItemText: {
    marginLeft: 8,
    color: '#666',
  },
  outfitRecommendation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});