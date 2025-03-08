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
  fetchWeather: async (city = 'London') => {
    set({ loading: true });
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY}`
      );

      set({
        weather: {
          temp: Math.round(response.data.main.temp),
          feels_like: Math.round(response.data.main.feels_like),
          humidity: response.data.main.humidity,
          wind_speed: Math.round(response.data.wind.speed),
          description: response.data.weather[0].description,
          icon: response.data.weather[0].icon,
        },
        error: null,
        loading: false,
      });
    } catch (error) {
      set({ error: 'Failed to fetch weather data', loading: false });
    }
  },
}));