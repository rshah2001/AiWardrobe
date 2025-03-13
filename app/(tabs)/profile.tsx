import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ChevronRight, Edit, LogOut, MapPin, Moon, Settings, User } from 'lucide-react-native';
import { useAuthStore } from '@/lib/authStore';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { session, signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    username: '',
    avatar_url: null,
    preferred_location: 'London',
    notifications_enabled: true,
    dark_mode: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile>({...profile});

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
      // Fetch user profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setProfile({
          username: data.username || (session.user.email?.split('@')[0] ?? ''),
          avatar_url: data.avatar_url,
          preferred_location: data.preferred_location || 'Tampa',
          notifications_enabled: data.notifications_enabled ?? true,
          dark_mode: data.dark_mode ?? false
        });
        setEditedProfile({
          username: data.username || (session.user.email?.split('@')[0] ?? ''),
          avatar_url: data.avatar_url,
          preferred_location: data.preferred_location || 'Tampa',
          notifications_enabled: data.notifications_enabled ?? true,
          dark_mode: data.dark_mode ?? false
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
      const updates = {
        id: session.user.id,
        username: editedProfile.username,
        avatar_url: editedProfile.avatar_url,
        preferred_location: editedProfile.preferred_location,
        notifications_enabled: editedProfile.notifications_enabled,
        dark_mode: editedProfile.dark_mode,
        updated_at: new Date()
      };
      
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert(updates);
      
      if (error) throw error;
      
      setProfile(editedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

interface Profile {
    username: string;
    avatar_url: string | null;
    preferred_location: string;
    notifications_enabled: boolean;
    dark_mode: boolean;
}

const uploadAvatar = async (uri: string) => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
        // Convert image to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Upload to Supabase Storage
        const filename = `avatar-${session.user.id}-${Date.now()}`;
        const { data, error } = await supabase
            .storage
            .from('avatars')
            .upload(filename, blob);
        
        if (error) throw error;
        
        // Get public URL
        const { data: publicUrlData } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(filename);
        
        // Update local state
        const newAvatarUrl = publicUrlData.publicUrl;
        setEditedProfile((prevProfile: Profile) => ({...prevProfile, avatar_url: newAvatarUrl}));
        
        if (!isEditing) {
            // If not in edit mode, update profile immediately
            updateProfileField('avatar_url', newAvatarUrl);
        }
    } catch (error) {
        console.error('Error uploading avatar:', error);
        Alert.alert('Error', 'Failed to upload avatar');
    } finally {
        setLoading(false);
    }
};

const updateProfileField = async (field: keyof Profile, value: any) => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
        const updates: Partial<Profile> & { id: string; updated_at: Date } = {
            id: session.user.id,
            [field]: value,
            updated_at: new Date()
        };
        
        // Update the profile in Supabase
        const { error } = await supabase
            .from('profiles')
            .upsert(updates);
        
        if (error) throw error;
        
        // Update local state
        setProfile({...profile, [field]: value});
    } catch (error) {
        console.error(`Error updating ${field}:`, error);
        Alert.alert('Error', `Failed to update ${field}`);
    } finally {
        setLoading(false);
    }
};

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  if (!session) {
    router.replace('/login');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={pickImage}
            disabled={loading}
          >
            {profile.avatar_url ? (
              <Image 
              source={{ uri: isEditing ? editedProfile.avatar_url ?? '' : profile.avatar_url ?? '' }} 
              style={styles.avatar} 
            />
            
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color="#9ca3af" />
              </View>
            )}
            <View style={styles.editAvatarButton}>
              <Edit size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          {isEditing ? (
            <TextInput
              style={styles.usernameInput}
              value={editedProfile.username}
              onChangeText={(text) => setEditedProfile({...editedProfile, username: text})}
              placeholder="Username"
              maxLength={20}
            />
          ) : (
            <Text style={styles.username}>{profile.username}</Text>
          )}
          
          <Text style={styles.email}>{session.user.email}</Text>
          
          {isEditing ? (
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={[styles.editButton, styles.cancelButton]}
                onPress={() => {
                  setEditedProfile({...profile});
                  setIsEditing(false);
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.editButton, styles.saveButton]}
                onPress={updateProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => setIsEditing(true)}
              disabled={loading}
            >
              <Edit size={16} color="#6366f1" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Sections */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {/* Location Preference */}
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MapPin size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Location</Text>
              {isEditing ? (
                <TextInput
                  style={styles.settingInput}
                  value={editedProfile.preferred_location}
                  onChangeText={(text) => setEditedProfile({...editedProfile, preferred_location: text})}
                  placeholder="Your location"
                />
              ) : (
                <Text style={styles.settingValue}>{profile.preferred_location}</Text>
              )}
            </View>
          </View>
          
          {/* Notification Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Feather name="bell" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>Receive daily outfit suggestions</Text>
            </View>
            <Switch
              value={isEditing ? editedProfile.notifications_enabled : profile.notifications_enabled}
              onValueChange={(value) => {
                if (isEditing) {
                  setEditedProfile({...editedProfile, notifications_enabled: value});
                } else {
                  updateProfileField('notifications_enabled', value);
                }
              }}
              trackColor={{ false: '#e5e7eb', true: '#c7d2fe' }}
              thumbColor={isEditing ? (editedProfile.notifications_enabled ? '#6366f1' : '#f3f4f6') : (profile.notifications_enabled ? '#6366f1' : '#f3f4f6')}
              disabled={loading}
            />
          </View>
          
          {/* Dark Mode Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Moon size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Switch to dark theme</Text>
            </View>
            <Switch
              value={isEditing ? editedProfile.dark_mode : profile.dark_mode}
              onValueChange={(value) => {
                if (isEditing) {
                  setEditedProfile({...editedProfile, dark_mode: value});
                } else {
                  updateProfileField('dark_mode', value);
                }
              }}
              trackColor={{ false: '#e5e7eb', true: '#c7d2fe' }}
              thumbColor={isEditing ? (editedProfile.dark_mode ? '#6366f1' : '#f3f4f6') : (profile.dark_mode ? '#6366f1' : '#f3f4f6')}
              disabled={loading}
            />
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Feather name="help-circle" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Feather name="file-text" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Terms & Privacy Policy</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Feather name="info" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>About the App</Text>
              <Text style={styles.settingDescription}>Version 1.0.0</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={loading}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  usernameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 4,
    paddingVertical: 4,
    minWidth: 200,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  editProfileText: {
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingValue: {
    fontSize: 15,
    color: '#6b7280',
  },
  settingInput: {
    fontSize: 15,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  signOutText: {
    marginLeft: 8,
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
});