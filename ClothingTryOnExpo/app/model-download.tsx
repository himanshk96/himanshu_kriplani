import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GemmaModelService, {
  GEMMA_4_MODELS,
  ModelVariant,
  DownloadProgress,
} from '../src/services/GemmaModelService';

type DownloadState = 'idle' | 'downloading' | 'completed' | 'error';

export default function ModelDownloadScreen() {
  const [selectedVariant, setSelectedVariant] = useState<ModelVariant>('E4B');
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExisting();
  }, []);

  const checkExisting = async () => {
    const exists = await GemmaModelService.isModelDownloaded();
    if (exists) setDownloadState('completed');
  };

  const selectModel = (variant: ModelVariant) => {
    setSelectedVariant(variant);
    GemmaModelService.setSelectedModel(variant);
  };

  const startDownload = async () => {
    setDownloadState('downloading');
    setError(null);
    setProgress(0);

    try {
      await GemmaModelService.downloadModel((p: DownloadProgress) => {
        setProgress(p.progress);
        setDownloadedBytes(p.totalBytesWritten);
      });
      setDownloadState('completed');
    } catch (err: any) {
      setDownloadState('error');
      setError(err.message || 'Download failed');
    }
  };

  const handleContinue = () => {
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Model',
      'This will free up storage but you\'ll need to re-download before using try-on.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await GemmaModelService.deleteModel();
            setDownloadState('idle');
            setProgress(0);
          },
        },
      ],
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <View style={styles.container}>
      {/* Platform Info */}
      <View style={styles.platformBanner}>
        <Ionicons
          name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-android'}
          size={20}
          color="#e94560"
        />
        <Text style={styles.platformText}>
          {Platform.OS === 'ios'
            ? 'iOS • Metal GPU Acceleration'
            : 'Android • GPU Delegate'}
        </Text>
      </View>

      {/* Model Selection */}
      <Text style={styles.sectionTitle}>Select Model</Text>

      {(Object.entries(GEMMA_4_MODELS) as [ModelVariant, typeof GEMMA_4_MODELS.E4B][]).map(
        ([key, model]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.modelOption,
              selectedVariant === key && styles.modelSelected,
            ]}
            onPress={() => selectModel(key)}
            disabled={downloadState === 'downloading'}>
            <View style={styles.radioOuter}>
              {selectedVariant === key && <View style={styles.radioInner} />}
            </View>
            <View style={styles.modelOptionInfo}>
              <Text style={styles.modelOptionName}>{model.displayName}</Text>
              <Text style={styles.modelOptionDesc}>{model.description}</Text>
              <View style={styles.modelTags}>
                {model.capabilities.map(cap => (
                  <Text key={cap} style={styles.tag}>
                    {cap}
                  </Text>
                ))}
                <Text style={styles.tagSize}>{model.size}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ),
      )}

      {/* Download Section */}
      <View style={styles.downloadSection}>
        {downloadState === 'idle' && (
          <TouchableOpacity style={styles.downloadBtn} onPress={startDownload}>
            <Ionicons name="cloud-download" size={22} color="#fff" />
            <Text style={styles.downloadBtnText}>
              Download {GEMMA_4_MODELS[selectedVariant].displayName}
            </Text>
          </TouchableOpacity>
        )}

        {downloadState === 'downloading' && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressPercent}>
                {(progress * 100).toFixed(1)}%
              </Text>
              <Text style={styles.progressBytes}>
                {formatBytes(downloadedBytes)} / {GEMMA_4_MODELS[selectedVariant].size}
              </Text>
            </View>
            <Text style={styles.progressHint}>
              Download once, then all AI runs offline on your device
            </Text>
          </View>
        )}

        {downloadState === 'completed' && (
          <View style={styles.completedSection}>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#40916c" />
              <Text style={styles.completedText}>Model Ready</Text>
            </View>
            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
              <Text style={styles.continueBtnText}>Start Using Try-On</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete Model</Text>
            </TouchableOpacity>
          </View>
        )}

        {downloadState === 'error' && (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={startDownload}>
              <Text style={styles.retryBtnText}>Retry Download</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#a8a8b3" />
        <Text style={styles.infoText}>
          Gemma 4 runs entirely on your device. No data is sent to any server.
          Your photos never leave your phone.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 20,
  },
  platformBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  platformText: {
    fontSize: 14,
    color: '#a8a8b3',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modelSelected: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233,69,96,0.08)',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e94560',
  },
  modelOptionInfo: {
    flex: 1,
  },
  modelOptionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  modelOptionDesc: {
    fontSize: 13,
    color: '#a8a8b3',
    marginBottom: 8,
    lineHeight: 18,
  },
  modelTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    fontSize: 11,
    color: '#e94560',
    backgroundColor: 'rgba(233,69,96,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tagSize: {
    fontSize: 11,
    color: '#a8a8b3',
    backgroundColor: 'rgba(168,168,179,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  downloadSection: {
    marginTop: 8,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 14,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressSection: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 14,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#2d2d44',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 5,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBytes: {
    fontSize: 13,
    color: '#a8a8b3',
  },
  progressHint: {
    fontSize: 12,
    color: '#a8a8b3',
    textAlign: 'center',
    marginTop: 4,
  },
  completedSection: {
    gap: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(64,145,108,0.15)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#40916c',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 14,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteBtnText: {
    color: '#a8a8b3',
    fontSize: 13,
  },
  errorSection: {
    backgroundColor: 'rgba(233,69,96,0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#e94560',
    fontSize: 14,
  },
  retryBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#a8a8b3',
    flex: 1,
    lineHeight: 17,
  },
});
