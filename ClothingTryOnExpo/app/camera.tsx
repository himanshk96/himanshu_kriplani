import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const { mode } = useLocalSearchParams<{ mode: 'person' | 'clothing' }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>(
    mode === 'person' ? 'front' : 'back',
  );
  const cameraRef = useRef<CameraView>(null);

  const isPerson = mode === 'person';

  // Request permissions if not granted
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#533483" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need your camera to capture photos for virtual try-on. No photos are
          sent to any server — all processing happens on your device.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo) {
        setCapturedImage(photo.uri);
      }
    } catch (err: any) {
      Alert.alert('Capture Failed', err.message);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: isPerson ? [3, 4] : [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;
    // Pass back to home screen via global state or router params
    router.push({
      pathname: '/',
      params: { [`${mode}Photo`]: capturedImage },
    });
  };

  const retake = () => {
    setCapturedImage(null);
  };

  const toggleFacing = () => {
    setFacing(f => (f === 'back' ? 'front' : 'back'));
  };

  // Show captured image preview
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>
            {isPerson ? 'Person Photo' : 'Fabric Material'}
          </Text>
          <Text style={styles.previewSubtitle}>
            Make sure the {isPerson ? 'upper body is clearly visible' : 'texture is clear and well-lit'}
          </Text>
        </View>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        </View>
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeBtn} onPress={retake}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.useBtn} onPress={confirmPhoto}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.useBtnText}>Use This Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show camera
  return (
    <View style={styles.container}>
      {/* Instructions */}
      <View style={styles.instructionBar}>
        <Text style={styles.instructionText}>
          {isPerson
            ? 'Frame your upper body in the guide below'
            : 'Position fabric flat, filling the frame'}
        </Text>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="picture">
          {/* Guide overlay for person mode */}
          {isPerson && (
            <View style={styles.guideOverlay}>
              <View style={styles.guideBox}>
                <View style={styles.guideCornerTL} />
                <View style={styles.guideCornerTR} />
                <View style={styles.guideCornerBL} />
                <View style={styles.guideCornerBR} />
              </View>
              <Text style={styles.guideText}>Upper body</Text>
            </View>
          )}
        </CameraView>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
          <Ionicons name="images-outline" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
          <View style={styles.captureBtnOuter}>
            <View style={styles.captureBtnInner} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.flipBtn} onPress={toggleFacing}>
          <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#a8a8b3',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionBar: {
    padding: 14,
    backgroundColor: '#1a1a2e',
  },
  instructionText: {
    fontSize: 14,
    color: '#a8a8b3',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: '55%',
    height: '65%',
    borderWidth: 0,
    position: 'relative',
  },
  guideCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#e94560',
    borderTopLeftRadius: 8,
  },
  guideCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#e94560',
    borderTopRightRadius: 8,
  },
  guideCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#e94560',
    borderBottomLeftRadius: 8,
  },
  guideCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#e94560',
    borderBottomRightRadius: 8,
  },
  guideText: {
    color: 'rgba(233,69,96,0.7)',
    fontSize: 12,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  galleryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e94560',
  },
  flipBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHeader: {
    padding: 16,
    backgroundColor: '#1a1a2e',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  previewSubtitle: {
    fontSize: 13,
    color: '#a8a8b3',
    marginTop: 4,
  },
  previewContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: '#0f0f1a',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 40,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#533483',
  },
  retakeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  useBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#e94560',
  },
  useBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
