import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import ModelService from '../services/ModelService';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({navigation}: HomeScreenProps) {
  const [modelReady, setModelReady] = useState(false);
  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
  const [clothingPhoto, setClothingPhoto] = useState<string | null>(null);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    const [gemmaReady, segReady] = await Promise.all([
      ModelService.isModelDownloaded(),
      ModelService.isSegmentationModelDownloaded(),
    ]);
    setModelReady(gemmaReady && segReady);
  };

  const handleCapturePerson = () => {
    if (!modelReady) {
      Alert.alert(
        'Model Required',
        'Please download the AI model first before capturing photos.',
        [{text: 'Download', onPress: () => navigation.navigate('ModelDownload')},
         {text: 'Cancel'}],
      );
      return;
    }
    navigation.navigate('Camera', {mode: 'person'});
  };

  const handleCaptureClothing = () => {
    if (!modelReady) {
      Alert.alert(
        'Model Required',
        'Please download the AI model first.',
        [{text: 'Download', onPress: () => navigation.navigate('ModelDownload')},
         {text: 'Cancel'}],
      );
      return;
    }
    navigation.navigate('Camera', {mode: 'clothing'});
  };

  const handleProcess = () => {
    if (!personPhoto || !clothingPhoto) {
      Alert.alert('Photos Required', 'Please capture both a person photo and a clothing material photo.');
      return;
    }
    navigation.navigate('Processing', {personPhoto, clothingPhoto});
  };

  // Listen for photo results from camera screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkModelStatus();
    });
    return unsubscribe;
  }, [navigation]);

  const modelInfo = ModelService.getModelInfo();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Virtual Clothing Try-On</Text>
        <Text style={styles.subtitle}>
          Powered by Gemma Edge AI • {Platform.OS === 'ios' ? 'CoreML' : 'TFLite'}
        </Text>
      </View>

      {/* Model Status */}
      <TouchableOpacity
        style={[styles.modelStatus, modelReady ? styles.modelReady : styles.modelNotReady]}
        onPress={() => navigation.navigate('ModelDownload')}>
        <Text style={styles.modelStatusIcon}>{modelReady ? '✓' : '↓'}</Text>
        <View style={styles.modelStatusText}>
          <Text style={styles.modelName}>{modelInfo.gemma.name}</Text>
          <Text style={styles.modelDetail}>
            {modelReady ? 'Ready for inference' : `Tap to download (${modelInfo.gemma.size})`}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Photo Capture Section */}
      <View style={styles.photoSection}>
        <Text style={styles.sectionTitle}>Step 1: Capture Photos</Text>

        <View style={styles.photoGrid}>
          {/* Person Photo */}
          <TouchableOpacity
            style={styles.photoCard}
            onPress={handleCapturePerson}>
            {personPhoto ? (
              <Image source={{uri: personPhoto}} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>👤</Text>
                <Text style={styles.photoLabel}>Person</Text>
                <Text style={styles.photoHint}>Tap to capture</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Clothing Material Photo */}
          <TouchableOpacity
            style={styles.photoCard}
            onPress={handleCaptureClothing}>
            {clothingPhoto ? (
              <Image source={{uri: clothingPhoto}} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>👕</Text>
                <Text style={styles.photoLabel}>Material</Text>
                <Text style={styles.photoHint}>Tap to capture</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Process Button */}
      <TouchableOpacity
        style={[
          styles.processButton,
          (!personPhoto || !clothingPhoto) && styles.processButtonDisabled,
        ]}
        onPress={handleProcess}
        disabled={!personPhoto || !clothingPhoto}>
        <Text style={styles.processButtonText}>Generate Try-On</Text>
        <Text style={styles.processButtonSubtext}>
          AI will dress the person in the material
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#a8a8b3',
  },
  modelStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  modelReady: {
    backgroundColor: '#1b4332',
    borderWidth: 1,
    borderColor: '#40916c',
  },
  modelNotReady: {
    backgroundColor: '#3d1f00',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  modelStatusIcon: {
    fontSize: 24,
    marginRight: 12,
    color: '#fff',
  },
  modelStatusText: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modelDetail: {
    fontSize: 12,
    color: '#a8a8b3',
    marginTop: 2,
  },
  photoSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  photoCard: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#533483',
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  photoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  photoHint: {
    fontSize: 12,
    color: '#a8a8b3',
  },
  processButton: {
    backgroundColor: '#e94560',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  processButtonDisabled: {
    backgroundColor: '#4a4a5a',
    opacity: 0.6,
  },
  processButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  processButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
});
