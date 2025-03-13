// App.tsx or _layout.tsx (root component)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import { useAuthStore } from '../../lib/authStore';
import { supabase } from '../../lib/supabase';
import * as SplashScreen from 'expo-splash-screen';
import { AlertCircle } from 'lucide-react-native';

// Keep splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSession } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        console.log('Initializing app...');
        
        // Test supabase connection
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase connection error:', error);
          setError('Connection error. Please check your internet connection and try again.');
        } else {
          // Set session if available
          setSession(data.session);
          console.log('App initialized successfully');
        }
        
        // Add artificial delay to show splash screen (remove in production)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error('Error during app initialization:', err);
        setError('Something went wrong. Please restart the app.');
      } finally {
        // Mark app as ready
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Handle retry when there's an error
  const handleRetry = async () => {
    setError(null);
    setAppReady(false);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setError('Connection error. Please check your internet connection and try again.');
      } else {
        setSession(data.session);
      }
    } catch (err) {
      setError('Something went wrong. Please restart the app.');
    } finally {
      setAppReady(true);
    }
  };

  // Show loading screen while app is initializing
  if (!appReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your style assistant...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }
  
  // Show error screen if there was an error
  if (error) {
    return (
      <View style={styles.container}>
        <AlertCircle size={80} color="#ef4444" style={styles.errorImage} />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <StatusBar style="auto" />
      </View>
    );
  }

  // App is ready and no errors, show the actual app
  return (
    <SafeAreaProvider>
      <Slot />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
    // Fallback background color if image is missing
    backgroundColor: '#f8f8f8',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
});