import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GemmaModelService from '../src/services/GemmaModelService';

export default function HomeScreen() {
  const [modelReady, setModelReady] = useState(false);
  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
  const [clothingPhoto, setClothingPhoto] = useState<string | null>(null);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    const ready = await GemmaModelService.isModelDownloaded();
    setModelReady(ready);
  };

  const handleCapture = (mode: 'person' | 'clothing') => {
    if (!modelReady) {
      Alert.alert(
        'AI Model Required',
        'Download the Gemma 4 model first to enable virtual try-on.',
        [
          { text: 'Download Now', onPress: () => router.push('/model-download') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    router.push({ pathname: '/camera', params: { mode } });
  };

  const handleProcess = () => {
    if (!personPhoto || !clothingPhoto) {
      Alert.alert('Photos Required', 'Capture both a person photo and clothing material.');
      return;
    }
    router.push({
      pathname: '/processing',
      params: { personPhoto, clothingPhoto },
    });
  };

  const model = GemmaModelService.getSelectedModel();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Virtual Try-On</Text>
        <Text style={styles.subtitle}>
          Powered by Gemma 4 E4B • On-Device AI
        </Text>
      </View>

      {/* Model Status Card */}
      <TouchableOpacity
        style={[styles.modelCard, modelReady ? styles.modelReady : styles.modelPending]}
        onPress={() => router.push('/model-download')}>
        <Ionicons
          name={modelReady ? 'checkmark-circle' : 'cloud-download-outline'}
          size={28}
          color={modelReady ? '#40916c' : '#e94560'}
        />
        <View style={styles.modelInfo}>
          <Text style={styles.modelName}>{model.displayName}</Text>
          <Text style={styles.modelDetail}>
            {modelReady
              ? 'Ready • Vision + Text • On-device'
              : `Tap to download (${model.size})`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#a8a8b3" />
      </TouchableOpacity>

      {/* Photo Capture Cards */}
      <Text style={styles.sectionTitle}>Capture Photos</Text>
      <View style={styles.photoRow}>
        {/* Person Photo */}
        <TouchableOpacity
          style={styles.photoCard}
          onPress={() => handleCapture('person')}>
          {personPhoto ? (
            <Image source={{ uri: personPhoto }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoEmpty}>
              <Ionicons name="person-outline" size={40} color="#533483" />
              <Text style={styles.photoLabel}>Person</Text>
              <Text style={styles.photoHint}>Upper body photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Clothing Photo */}
        <TouchableOpacity
          style={styles.photoCard}
          onPress={() => handleCapture('clothing')}>
          {clothingPhoto ? (
            <Image source={{ uri: clothingPhoto }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoEmpty}>
              <Ionicons name="shirt-outline" size={40} color="#533483" />
              <Text style={styles.photoLabel}>Material</Text>
              <Text style={styles.photoHint}>Fabric close-up</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* How it works */}
      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>How it works</Text>
        <View style={styles.step}>
          <Text style={styles.stepNum}>1</Text>
          <Text style={styles.stepText}>Take a photo of yourself (upper body)</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNum}>2</Text>
          <Text style={styles.stepText}>Take a photo of any fabric/material</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNum}>3</Text>
          <Text style={styles.stepText}>AI creates you wearing that material as a shirt</Text>
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateBtn, (!personPhoto || !clothingPhoto) && styles.generateDisabled]}
        onPress={handleProcess}
        disabled={!personPhoto || !clothingPhoto}>
        <Ionicons name="sparkles" size={22} color="#fff" />
        <Text style={styles.generateText}>Generate Try-On</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#a8a8b3',
    marginTop: 4,
  },
  modelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  modelReady: {
    backgroundColor: 'rgba(64,145,108,0.15)',
    borderWidth: 1,
    borderColor: '#40916c',
  },
  modelPending: {
    backgroundColor: 'rgba(233,69,96,0.1)',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  modelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modelName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modelDetail: {
    fontSize: 12,
    color: '#a8a8b3',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  photoCard: {
    flex: 1,
    aspectRatio: 0.8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#533483',
    borderStyle: 'dashed',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  photoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  photoHint: {
    fontSize: 11,
    color: '#a8a8b3',
  },
  howItWorks: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  howTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a8a8b3',
    marginBottom: 10,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#533483',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 22,
    marginRight: 10,
    overflow: 'hidden',
  },
  stepText: {
    fontSize: 13,
    color: '#ddd',
    flex: 1,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e94560',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  generateDisabled: {
    backgroundColor: '#3a3a4a',
    opacity: 0.5,
  },
  generateText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
});
