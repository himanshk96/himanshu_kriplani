import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';

export default function ResultScreen() {
  const { resultImage, personPhoto, clothingPhoto, processingTime, description } =
    useLocalSearchParams<{
      resultImage: string;
      personPhoto: string;
      clothingPhoto: string;
      processingTime: string;
      description: string;
    }>();

  const [viewMode, setViewMode] = useState<'result' | 'compare'>('result');

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resultImage!);
      } else {
        Alert.alert('Sharing not available on this device');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleSave = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Grant photo library access to save.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(resultImage!);
      Alert.alert('Saved!', 'Try-on result saved to your photo library.');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save image.');
    }
  };

  const handleNewTryOn = () => {
    router.replace('/');
  };

  const timeInSeconds = processingTime
    ? (parseInt(processingTime) / 1000).toFixed(1)
    : '?';

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'result' && styles.toggleActive]}
          onPress={() => setViewMode('result')}>
          <Text style={[styles.toggleText, viewMode === 'result' && styles.toggleTextActive]}>
            Result
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'compare' && styles.toggleActive]}
          onPress={() => setViewMode('compare')}>
          <Text style={[styles.toggleText, viewMode === 'compare' && styles.toggleTextActive]}>
            Before / After
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Image */}
      <View style={styles.imageSection}>
        {viewMode === 'result' ? (
          <Image source={{ uri: resultImage }} style={styles.mainImage} />
        ) : (
          <View style={styles.comparison}>
            <View style={styles.compCol}>
              <Image source={{ uri: personPhoto }} style={styles.compImage} />
              <Text style={styles.compLabel}>Original</Text>
            </View>
            <View style={styles.compDivider} />
            <View style={styles.compCol}>
              <Image source={{ uri: resultImage }} style={styles.compImage} />
              <Text style={styles.compLabel}>Try-On</Text>
            </View>
          </View>
        )}
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <Image source={{ uri: clothingPhoto }} style={styles.fabricThumb} />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>{description || 'Virtual try-on complete'}</Text>
          <Text style={styles.infoSub}>
            Processed in {timeInSeconds}s • Gemma 4 E4B • On-device
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color="#fff" />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave}>
          <Ionicons name="download-outline" size={22} color="#fff" />
          <Text style={styles.actionBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newBtn} onPress={handleNewTryOn}>
        <Ionicons name="refresh" size={18} color="#e94560" />
        <Text style={styles.newBtnText}>Try Another Outfit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 16,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#e94560',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a8a8b3',
  },
  toggleTextActive: {
    color: '#fff',
  },
  imageSection: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f0f1a',
    marginBottom: 14,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  comparison: {
    flex: 1,
    flexDirection: 'row',
    padding: 8,
    gap: 4,
  },
  compCol: {
    flex: 1,
  },
  compImage: {
    flex: 1,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  compLabel: {
    textAlign: 'center',
    color: '#a8a8b3',
    fontSize: 12,
    marginTop: 6,
  },
  compDivider: {
    width: 2,
    backgroundColor: '#533483',
    marginHorizontal: 4,
    borderRadius: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  fabricThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoSub: {
    fontSize: 12,
    color: '#a8a8b3',
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#533483',
  },
  saveBtn: {
    backgroundColor: '#40916c',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e94560',
  },
  newBtnText: {
    color: '#e94560',
    fontSize: 15,
    fontWeight: '600',
  },
});
