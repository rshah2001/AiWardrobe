import { useEffect, useState } from 'react';
// Fix import paths - use absolute imports with @ alias
import { useAuthStore } from '@/lib/authStore';
import { supabase } from '@/lib/supabase';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we check authentication
SplashScreen.preventAutoHideAsync();

export function useFrameworkReady() {
  const { setSession } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        // Update the auth store with the session
        setSession(session);
        
        // Simulate some loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        // Tell the application to render
        setIsReady(true);
        
        // Hide splash screen
        await SplashScreen.hideAsync();
      }
    }
    
    prepare();
  }, []);

  return isReady;
}