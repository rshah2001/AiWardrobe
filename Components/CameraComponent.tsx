// Create a new file: components/CameraComponent.tsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Platform 
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';

interface CameraComponentProps {
  onImageCaptured: (uri: string) => void;
  onClose: () => void;
}

export default function CameraComponent({ onImageCaptured, onClose }: CameraComponentProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      
      setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions required',
          'Camera and media library permissions are required to use this feature.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady || isTakingPicture) return;
    
    try {
      setIsTakingPicture(true);
      
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      
      // Optimize the image
      const optimizedImage = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      
      setCapturedImage(optimizedImage.uri);
      
      // Save to media library
      await MediaLibrary.saveToLibraryAsync(optimizedImage.uri);
      
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsTakingPicture(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageCaptured(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera access denied</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {capturedImage ? (
        // Preview captured image
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.preview} />
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleRetake}>
              <MaterialIcons name="refresh" size={24} color="white" />
              <Text style={styles.actionText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm}>
              <MaterialIcons name="check" size={24} color="white" />
              <Text style={styles.actionText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Camera view
        <>
          <Camera 
            ref={cameraRef}
            style={styles.camera} 
            type={CameraType.back}
            onCameraReady={() => setCameraReady(true)}
          >
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </Camera>
          
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <MaterialIcons name="photo-library" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.captureButton, !cameraReady && styles.buttonDisabled]} 
              onPress={takePicture}
              disabled={!cameraReady || isTakingPicture}
            >
              {isTakingPicture ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
            
            <View style={{ width: 50 }} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: 'black',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'black',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(100, 100, 100, 0.8)',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
  },
  actionText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
});