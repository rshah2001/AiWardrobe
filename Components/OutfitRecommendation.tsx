import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useWeatherStore } from '@/lib/weatherStore';
import { useWardrobeStore } from '@/lib/wardrobeStore';
import { Ionicons } from '@expo/vector-icons';
import { Thermometer, Wind, Droplets, Sun, CloudRain, Check } from 'lucide-react-native';

interface OutfitRecommendationProps {
  occasion?: string;
}

export default function OutfitRecommendation({ occasion = 'Casual' }: OutfitRecommendationProps) {
  const { weather, loading: weatherLoading } = useWeatherStore();
  const { items, loading: wardrobeLoading } = useWardrobeStore();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [recommendedOutfit, setRecommendedOutfit] = useState<any[]>([]);

  useEffect(() => {
    if (weather && items.length > 0) {
      // Generate outfit recommendation based on weather and occasion
      const recommendation = generateOutfitRecommendation(weather, items, occasion);
      setRecommendedOutfit(recommendation);
    }
  }, [weather, items, occasion]);

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  if (weatherLoading || wardrobeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Generating your outfit recommendation...</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Weather data is required for outfit recommendations</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Add items to your wardrobe to get outfit recommendations</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.weatherSummary}>
        <Text style={styles.weatherTitle}>Current Weather:</Text>
        <View style={styles.weatherDetails}>
          <View style={styles.weatherItem}>
            <Thermometer size={16} color="#6366f1" />
            <Text style={styles.weatherValue}>{weather.temp}°C</Text>
          </View>
          
          <View style={styles.weatherItem}>
            <Wind size={16} color="#6366f1" />
            <Text style={styles.weatherValue}>{weather.wind_speed} km/h</Text>
          </View>
          
          <View style={styles.weatherItem}>
            <Droplets size={16} color="#6366f1" />
            <Text style={styles.weatherValue}>{weather.humidity}%</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recommended for {occasion}</Text>
      <Text style={styles.recommendationText}>
        {getRecommendationText(weather, occasion)}
      </Text>

      <View style={styles.outfitContainer}>
        {recommendedOutfit.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.outfitItems}
          >
            {recommendedOutfit.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.outfitItem,
                  selectedItems.includes(item.id) && styles.selectedItem
                ]}
                onPress={() => toggleItemSelection(item.id)}
              >
                <Image 
                  source={{ uri: item.image_url }} 
                  style={styles.itemImage} 
                />
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                
                {selectedItems.includes(item.id) && (
                  <View style={styles.checkmark}>
                    <Check size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noItemsText}>No suitable items found in your wardrobe</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => setDetailsVisible(true)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (selectedItems.length === 0) && styles.disabledButton
          ]}
          disabled={selectedItems.length === 0}
        >
          <Text style={styles.saveButtonText}>Save Outfit</Text>
        </TouchableOpacity>
      </View>

      {/* Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsVisible}
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Outfit Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setDetailsVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Weather-Based Recommendation for {occasion}</Text>
            
            <View style={styles.weatherCard}>
              <Text style={styles.weatherCardTitle}>Current Weather</Text>
              <View style={styles.weatherCardContent}>
                <View style={styles.weatherMainInfo}>
                  <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
                  <Text style={styles.weatherDesc}>{weather.description}</Text>
                </View>
                
                <View style={styles.weatherCardDetails}>
                  <View style={styles.weatherDetailItem}>
                    <Thermometer size={16} color="#6366f1" />
                    <Text style={styles.weatherDetailText}>Feels like: {weather.feels_like}°C</Text>
                  </View>
                  
                  <View style={styles.weatherDetailItem}>
                    <Wind size={16} color="#6366f1" />
                    <Text style={styles.weatherDetailText}>Wind: {weather.wind_speed} km/h</Text>
                  </View>
                  
                  <View style={styles.weatherDetailItem}>
                    <Droplets size={16} color="#6366f1" />
                    <Text style={styles.weatherDetailText}>Humidity: {weather.humidity}%</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <Text style={styles.recommendationTitle}>Our Recommendation</Text>
            <Text style={styles.recommendationDescription}>
              {getDetailedRecommendation(weather, occasion)}
            </Text>
            
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setDetailsVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper functions
function getRecommendationText(weather: any, occasion: string): string {
  const temp = weather.temp;
  const description = weather.description.toLowerCase();
  
  let baseRecommendation = '';
  
  // Temperature based recommendations
  if (temp < 5) {
    baseRecommendation = "It's very cold today. Layer up with warm clothing including a heavy coat, scarf, and gloves.";
  } else if (temp < 10) {
    baseRecommendation = "It's quite cold. Wear a warm jacket or coat with layers underneath.";
  } else if (temp < 15) {
    baseRecommendation = "It's cool today. A light jacket or sweater would be appropriate.";
  } else if (temp < 20) {
    baseRecommendation = "The temperature is mild. Light layers that can be removed if needed are ideal.";
  } else if (temp < 25) {
    baseRecommendation = "It's pleasantly warm. Light clothing like t-shirts and pants would be comfortable.";
  } else if (temp < 30) {
    baseRecommendation = "It's warm today. Light, breathable fabrics are recommended.";
  } else {
    baseRecommendation = "It's hot today. Wear very light, breathable clothing to stay cool.";
  }
  
  // Weather condition adjustments
  if (description.includes('rain')) {
    baseRecommendation += " Don't forget a waterproof jacket or umbrella as there's rain.";
  } else if (description.includes('snow')) {
    baseRecommendation += " Be prepared for snow with waterproof boots and a warm hat.";
  } else if (description.includes('wind')) {
    baseRecommendation += " It's windy, so consider wearing items that won't catch the wind.";
  } else if (description.includes('cloud')) {
    baseRecommendation += " It's cloudy, so the temperature might feel cooler than it is.";
  } else if (description.includes('sun') || description.includes('clear')) {
    baseRecommendation += " It's sunny, so don't forget sun protection if you'll be outside.";
  }
  
  // Occasion-specific additions
  if (occasion.toLowerCase() === 'formal') {
    baseRecommendation += " For a formal occasion, opt for dress shoes and more elegant pieces.";
  } else if (occasion.toLowerCase() === 'business') {
    baseRecommendation += " For business attire, professional clothing adapted to the weather is best.";
  } else if (occasion.toLowerCase() === 'sport' || occasion.toLowerCase() === 'workout') {
    baseRecommendation += " For sports or working out, choose moisture-wicking fabrics.";
  } else if (occasion.toLowerCase() === 'casual') {
    baseRecommendation += " For a casual day, comfort is key while staying weather-appropriate.";
  }
  
  return baseRecommendation;
}

function getDetailedRecommendation(weather: any, occasion: string): string {
  const temp = weather.temp;
  const description = weather.description.toLowerCase();
  
  let detailedRec = "Based on the current weather conditions and your selected occasion, here's what we recommend:\n\n";
  
  // Layering advice based on temperature
  if (temp < 10) {
    detailedRec += "• Multiple layers to trap heat\n";
    detailedRec += "• Base layer: thermal or long-sleeve shirt\n";
    detailedRec += "• Mid layer: sweater or fleece\n";
    detailedRec += "• Outer layer: insulated coat or jacket\n";
  } else if (temp < 20) {
    detailedRec += "• Light to medium layering\n";
    detailedRec += "• Base layer: t-shirt or light long-sleeve\n";
    detailedRec += "• Outer layer: light jacket, cardigan, or sweater\n";
  } else {
    detailedRec += "• Light, breathable clothing\n";
    detailedRec += "• Single layers in breathable fabrics\n";
  }
  
  // Weather-specific advice
  if (description.includes('rain')) {
    detailedRec += "\nFor rain protection:\n";
    detailedRec += "• Waterproof outer layer\n";
    detailedRec += "• Water-resistant footwear\n";
    detailedRec += "• Consider an umbrella\n";
  } else if (description.includes('snow')) {
    detailedRec += "\nFor snow protection:\n";
    detailedRec += "• Waterproof and insulated outerwear\n";
    detailedRec += "• Waterproof boots with good traction\n";
    detailedRec += "• Hat, gloves, and scarf\n";
  } else if (temp > 25 && (description.includes('sun') || description.includes('clear'))) {
    detailedRec += "\nFor sun protection:\n";
    detailedRec += "• Light-colored clothing\n";
    detailedRec += "• Hat or cap\n";
    detailedRec += "• Sunglasses\n";
  }
  
  // Occasion-specific advice
  detailedRec += `\nFor ${occasion} occasions:\n`;
  if (occasion.toLowerCase() === 'formal') {
    detailedRec += "• Prioritize formal wear while adapting to weather\n";
    detailedRec += "• Consider a dress coat rather than casual outerwear\n";
    detailedRec += "• Dress shoes appropriate for the weather conditions\n";
  } else if (occasion.toLowerCase() === 'business') {
    detailedRec += "• Professional attire adapted to weather conditions\n";
    detailedRec += "• Layer with blazers or cardigans if needed\n";
    detailedRec += "• Weather-appropriate business footwear\n";
  } else if (occasion.toLowerCase() === 'sport') {
    detailedRec += "• Moisture-wicking fabrics\n";
    detailedRec += "• Layers that can be removed during activity\n";
    detailedRec += "• Appropriate athletic footwear\n";
  } else {
    detailedRec += "• Comfort-focused choices\n";
    detailedRec += "• Practical clothing suitable for daily activities\n";
    detailedRec += "• Weather-appropriate casual footwear\n";
  }
  
  return detailedRec;
}

function generateOutfitRecommendation(weather: any, items: any[], occasion: string) {
  const temp = weather.temp;
  const hasRain = weather.description.toLowerCase().includes('rain');
  const hasSnow = weather.description.toLowerCase().includes('snow');
  
  // Filter items based on temperature and weather conditions
  let recommendedItems = [];
  
  // Top layer
  let tops = items.filter(item => {
    const category = item.category.toLowerCase();
    if (temp < 10) {
      return category.includes('sweater') || category.includes('jacket') || category.includes('coat');
    } else if (temp < 20) {
      return category.includes('shirt') || category.includes('blouse') || category.includes('light jacket');
    } else {
      return category.includes('t-shirt') || category.includes('tank') || category.includes('shirt');
    }
  });
  
  // Bottom layer
  let bottoms = items.filter(item => {
    const category = item.category.toLowerCase();
    if (temp < 15) {
      return category.includes('jeans') || category.includes('pants') || category.includes('trousers');
    } else {
      return category.includes('shorts') || category.includes('skirt') || category.includes('light pants');
    }
  });
  
  // Outerwear if needed
  let outerwear = [];
  if (temp < 15 || hasRain || hasSnow) {
    outerwear = items.filter(item => {
      const category = item.category.toLowerCase();
      if (hasRain) {
        return category.includes('rain') || category.includes('waterproof') || category.includes('jacket');
      } else if (hasSnow) {
        return category.includes('winter') || category.includes('coat') || category.includes('jacket');
      } else if (temp < 5) {
        return category.includes('coat') || category.includes('winter');
      } else {
        return category.includes('jacket') || category.includes('hoodie') || category.includes('cardigan');
      }
    });
  }
  
  // Shoes
  let shoes = items.filter(item => {
    const category = item.category.toLowerCase();
    if (hasRain || hasSnow) {
      return category.includes('boots') || category.includes('waterproof');
    } else if (temp < 10) {
      return category.includes('boots') || category.includes('closed');
    } else {
      return category.includes('shoes') || category.includes('sneakers') || category.includes('sandals');
    }
  });
  
  // Accessories
  let accessories = items.filter(item => {
    const category = item.category.toLowerCase();
    if (temp < 5) {
      return category.includes('scarf') || category.includes('hat') || category.includes('gloves');
    } else if (temp > 25) {
      return category.includes('hat') || category.includes('sunglasses');
    } else {
      return category.includes('accessories');
    }
  });
  
  // Filter based on occasion
  const occasionLower = occasion.toLowerCase();
  if (occasionLower !== 'casual') {
    // Apply occasion-specific filters
    if (occasionLower === 'formal' || occasionLower === 'business') {
      tops = tops.filter(item => {
        const name = item.name.toLowerCase();
        const category = item.category.toLowerCase();
        return !name.includes('t-shirt') && !name.includes('tank') && 
               !category.includes('t-shirt') && !category.includes('tank');
      });
      
      bottoms = bottoms.filter(item => {
        const name = item.name.toLowerCase();
        const category = item.category.toLowerCase();
        return !name.includes('shorts') && !name.includes('jeans') && 
               !category.includes('shorts') && !category.includes('jeans');
      });
    } else if (occasionLower === 'sport' || occasionLower === 'workout') {
      tops = tops.filter(item => {
        const name = item.name.toLowerCase();
        const category = item.category.toLowerCase();
        return name.includes('sport') || name.includes('athletic') || 
               category.includes('sport') || category.includes('athletic');
      });
      
      bottoms = bottoms.filter(item => {
        const name = item.name.toLowerCase();
        const category = item.category.toLowerCase();
        return name.includes('sport') || name.includes('athletic') || 
               category.includes('sport') || category.includes('athletic');
      });
    }
  }
  
  // Combine selections to make a complete outfit
  recommendedItems = [
    ...(tops.length > 0 ? [tops[Math.floor(Math.random() * tops.length)]] : []),
    ...(bottoms.length > 0 ? [bottoms[Math.floor(Math.random() * bottoms.length)]] : []),
    ...(outerwear.length > 0 ? [outerwear[Math.floor(Math.random() * outerwear.length)]] : []),
    ...(shoes.length > 0 ? [shoes[Math.floor(Math.random() * shoes.length)]] : []),
    ...(accessories.length > 0 ? [accessories[Math.floor(Math.random() * accessories.length)]] : [])
  ];
  
  return recommendedItems.filter(item => item !== undefined);
}
// Add this at the bottom of your OutfitRecommendation.tsx file
const styles = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      marginVertical: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    weatherSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    weatherTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    weatherDetails: {
      flexDirection: 'row',
    },
    weatherItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    weatherValue: {
      marginLeft: 4,
      fontSize: 14,
      color: '#666',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#333',
    },
    recommendationText: {
      fontSize: 14,
      lineHeight: 20,
      color: '#666',
      marginBottom: 16,
    },
    outfitContainer: {
      minHeight: 150,
    },
    outfitItems: {
      paddingVertical: 10,
    },
    outfitItem: {
      width: 120,
      marginRight: 12,
      backgroundColor: '#f8f8f8',
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#eee',
    },
    selectedItem: {
      borderColor: '#6366f1',
      backgroundColor: '#f0f7ff',
    },
    itemImage: {
      width: 100,
      height: 100,
      borderRadius: 8,
      marginBottom: 8,
    },
    itemName: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      color: '#333',
    },
    itemCategory: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
      textAlign: 'center',
    },
    checkmark: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: '#6366f1',
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    detailsButton: {
      flex: 1,
      backgroundColor: '#f0f0f0',
      padding: 14,
      borderRadius: 8,
      marginRight: 8,
      alignItems: 'center',
    },
    detailsButtonText: {
      color: '#333',
      fontWeight: '500',
    },
    saveButton: {
      flex: 1,
      backgroundColor: '#6366f1',
      padding: 14,
      borderRadius: 8,
      marginLeft: 8,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#fff',
      fontWeight: '500',
    },
    disabledButton: {
      backgroundColor: '#c7c7c7',
    },
    loadingContainer: {
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 10,
      color: '#666',
      fontSize: 14,
    },
    emptyContainer: {
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: '#999',
      textAlign: 'center',
      fontSize: 14,
      fontStyle: 'italic',
    },
    noItemsText: {
      color: '#666',
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 20,
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
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    closeButton: {
      padding: 5,
    },
    modalSubtitle: {
      fontSize: 16,
      color: '#666',
      marginBottom: 16,
    },
    weatherCard: {
      backgroundColor: '#f8f8f8',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    weatherCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      color: '#333',
    },
    weatherCardContent: {
      flexDirection: 'column',
    },
    weatherMainInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    weatherTemp: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333',
      marginRight: 16,
    },
    weatherDesc: {
      fontSize: 16,
      color: '#666',
      textTransform: 'capitalize',
    },
    weatherCardDetails: {
      marginTop: 8,
    },
    weatherDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    weatherDetailText: {
      marginLeft: 8,
      color: '#666',
    },
    recommendationTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: '#333',
    },
    recommendationDescription: {
      fontSize: 14,
      lineHeight: 22,
      color: '#666',
    },
    closeModalButton: {
      backgroundColor: '#6366f1',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
    },
    closeModalButtonText: {
      color: '#fff',
      fontWeight: '500',
    },
  });