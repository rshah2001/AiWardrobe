import { create } from 'zustand';
import axios from 'axios';

interface Weather {
  temp: number;
  description: string;
  icon: string;
  feels_like: number;
  humidity: number;
  wind_speed: number;
}

interface WeatherStore {
  weather: Weather | null;
  loading: boolean;
  error: string | null;
  fetchWeather: (city?: string) => Promise<void>;
}

export const useWeatherStore = create<WeatherStore>((set) => ({
  weather: null,
  loading: false,
  error: null,
  fetchWeather: async (city = 'Tampa') => {
    set({ loading: true, error: null });
    try {
      // For development - use environment variable in production
      const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
      
      console.log(`Fetching weather for ${city} with API key: ${API_KEY.substring(0, 3)}...`);
      
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
      );

      console.log('OpenWeather API Response:', JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.main || !response.data.weather || response.data.weather.length === 0) {
        throw new Error('Invalid response format from weather API');
      }

      const weatherData = {
        temp: Math.round(response.data.main.temp),
        feels_like: Math.round(response.data.main.feels_like),
        humidity: response.data.main.humidity,
        wind_speed: Math.round(response.data.wind.speed),
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
      };

      set({
        weather: weatherData,
        error: null,
        loading: false,
      });
    } catch (error) {
      console.error('Weather API error:', error);
      
      let errorMessage = 'Failed to fetch weather data';
      
      if (axios.isAxiosError(error)) {
        // Handle specific HTTP error codes
        if (error.response) {
          const status = error.response.status;
          
          switch (status) {
            case 401:
              errorMessage = 'API key error. Please check your OpenWeather API key';
              break;
            case 404:
              errorMessage = `City "${city}" not found`;
              break;
            case 429:
              errorMessage = 'Too many requests. Please try again later';
              break;
            default:
              errorMessage = `Error ${status}: ${error.response.statusText || 'Unknown error'}`;
          }
          
          console.error('Response details:', {
            status,
            data: error.response.data
          });
        } else if (error.request) {
          errorMessage = 'Network error. Please check your internet connection';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      set({ 
        error: errorMessage,
        loading: false,
        weather: null
      });
    }
  },
}));