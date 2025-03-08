import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
// Fix the import path here
import { useWeatherStore } from '../lib/weatherStore';
import { Ionicons } from '@expo/vector-icons';

interface WeatherWidgetProps {
  location?: string;
  onLocationChange?: (location: string) => void;
  compact?: boolean;
}

export default function WeatherWidget({ 
  location = 'London', 
  onLocationChange,
  compact = false 
}: WeatherWidgetProps) {
  const { weather, loading, error, fetchWeather } = useWeatherStore();
  const [currentLocation, setCurrentLocation] = useState(location);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(location);

  useEffect(() => {
    fetchWeather(currentLocation);
  }, [currentLocation]);

  const handleLocationUpdate = () => {
    if (editText.trim() !== '') {
      setCurrentLocation(editText.trim());
      if (onLocationChange) {
        onLocationChange(editText.trim());
      }
    } else {
      setEditText(currentLocation);
    }
    setIsEditing(false);
  };

  // Function to get clothing recommendation based on temperature
  const getRecommendation = () => {
    if (!weather) return '';
    
    const temp = weather.temp;
    
    if (temp < 5) {
      return 'Very cold! Wear a heavy coat, scarf, gloves, and warm layers.';
    } else if (temp < 10) {
      return 'Cold. A winter coat and layers recommended.';
    } else if (temp < 15) {
      return 'Cool. Light jacket or sweater recommended.';
    } else if (temp < 20) {
      return 'Mild. Light layers and a jacket may be needed.';
    } else if (temp < 25) {
      return 'Warm. Light clothing recommended.';
    } else {
      return 'Hot! Light, breathable clothing recommended.';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }

  if (error || !weather) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Text style={styles.errorText}>Could not load weather data</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchWeather(currentLocation)}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Location Header */}
      <View style={styles.locationContainer}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              placeholder="Enter city name"
              autoFocus
              onSubmitEditing={handleLocationUpdate}
            />
            <TouchableOpacity onPress={handleLocationUpdate} style={styles.editButton}>
              <Ionicons name="checkmark" size={18} color="#4A90E2" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>
              {currentLocation}
            </Text>
            {onLocationChange && (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                <Ionicons name="pencil" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Weather Display */}
      <View style={styles.weatherRow}>
        <Text style={styles.temperature}>{weather.temp}°C</Text>
        <Image 
          source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png` }} 
          style={styles.weatherIcon} 
        />
      </View>
      
      <Text style={styles.weatherDesc}>{weather.description}</Text>
      
      {!compact && (
        <>
          <View style={styles.weatherDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="thermometer-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Feels like: {weather.feels_like}°C</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Humidity: {weather.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Wind: {weather.wind_speed} m/s</Text>
            </View>
          </View>
          
          <View style={styles.recommendationContainer}>
            <Ionicons name="shirt-outline" size={18} color="#4A90E2" style={styles.recommendationIcon} />
            <Text style={styles.recommendationText}>{getRecommendation()}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    padding: 15,
  },
  locationContainer: {
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    paddingHorizontal: 8,
  },
  editButton: {
    padding: 5,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  weatherIcon: {
    width: 80,
    height: 80,
  },
  weatherDesc: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginVertical: 5,
  },
  weatherDetails: {
    marginTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  detailText: {
    marginLeft: 5,
    color: '#666',
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  recommendationIcon: {
    marginRight: 5,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    textAlign: 'center',
    color: '#e74c3c',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'center',
  },
  retryText: {
    color: '#333',
  },
});