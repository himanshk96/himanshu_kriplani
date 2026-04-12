import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {launchCamera, launchImageLibrary, CameraOptions} from 'react-native-image-picker';
import {RootStackParamList} from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Camera'>;
  route: RouteProp<RootStackParamList, 'Camera'>;
};

export default function CameraScreen({navigation, route}: Props) {
  const {mode} = route.params;
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const isPerson = mode === 'person';
  const title = isPerson ? 'Capture Person Photo' : 'Capture Clothing Material';
  const instructions = isPerson
    ? 'Take a clear, full upper-body photo of the person. Ensure good lighting and a neutral background for best results.'
    : 'Take a close-up photo of the raw clothing material/fabric. Make sure the texture and pattern are clearly visible.';

  const cameraOptions: CameraOptions = {
    mediaType: 'photo',
    quality: 0.9,
    maxWidth: 1024,
    maxHeight: 1024,
    saveToPhotos: false,
    cameraType: 'back',
  };

  const handleTakePhoto = async () => {
    setIsCapturing(true);
    try {
      const result = await launchCamera(cameraOptions);
      if (result.assets && result.assets[0]?.uri) {
        setCapturedImage(result.assets[0].uri);
      } else if (result.errorCode) {
        Alert.alert('Camera Error', result.errorMessage || 'Failed to capture photo');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Camera not available');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.9,
        maxWidth: 1024,
        maxHeight: 1024,
      });
      if (result.assets && result.assets[0]?.uri) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick image');
    }
  };

  const handleConfirm = () => {
    if (!capturedImage) return;

    // Navigate back to Home and pass the photo
    // Using a simple event-based approach via navigation params
    navigation.navigate('Home');
    // In a real app, you'd use a state manager or context here
    // For now, we'll store it and the Home screen will pick it up
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <View style={styles.container}>
      {/* Header Instructions */}
      <View style={styles.instructionBox}>
        <Text style={styles.instructionTitle}>{title}</Text>
        <Text style={styles.instructionText}>{instructions}</Text>
      </View>

      {/* Preview Area */}
      <View style={styles.previewArea}>
        {capturedImage ? (
          <Image source={{uri: capturedImage}} style={styles.preview} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>{isPerson ? '👤' : '🧵'}</Text>
            <Text style={styles.placeholderText}>No photo captured yet</Text>
            <Text style={styles.placeholderHint}>
              {isPerson
                ? 'Stand 3-5 feet away, facing camera'
                : 'Place fabric flat on a surface'}
            </Text>
          </View>
        )}

        {/* Overlay guide for person mode */}
        {!capturedImage && isPerson && (
          <View style={styles.guideOverlay}>
            <View style={styles.guideBox}>
              <Text style={styles.guideText}>Align upper body here</Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {capturedImage ? (
          <View style={styles.confirmActions}>
            <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
              <Text style={styles.retakeBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Use This Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.captureActions}>
            <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
              <Text style={styles.galleryBtnText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={handleTakePhoto}
              disabled={isCapturing}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
            <View style={styles.spacer} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  instructionBox: {
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#533483',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 13,
    color: '#a8a8b3',
    lineHeight: 18,
  },
  previewArea: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  placeholderHint: {
    fontSize: 14,
    color: '#a8a8b3',
    textAlign: 'center',
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: '60%',
    height: '70%',
    borderWidth: 2,
    borderColor: 'rgba(233,69,96,0.4)',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  guideText: {
    fontSize: 12,
    color: 'rgba(233,69,96,0.6)',
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  captureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  galleryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#533483',
  },
  galleryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(233,69,96,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e94560',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e94560',
  },
  spacer: {
    width: 72,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#533483',
  },
  retakeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#e94560',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
