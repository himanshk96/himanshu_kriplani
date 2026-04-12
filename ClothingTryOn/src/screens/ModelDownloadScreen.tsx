import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import ModelService, {DownloadProgress} from '../services/ModelService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ModelDownload'>;
};

type DownloadState = 'idle' | 'downloading' | 'completed' | 'error';

export default function ModelDownloadScreen({navigation}: Props) {
  const [gemmaState, setGemmaState] = useState<DownloadState>('idle');
  const [segState, setSegState] = useState<DownloadState>('idle');
  const [gemmaProgress, setGemmaProgress] = useState(0);
  const [segProgress, setSegProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const modelInfo = ModelService.getModelInfo();

  useEffect(() => {
    checkExistingModels();
  }, []);

  const checkExistingModels = async () => {
    const [gemmaExists, segExists] = await Promise.all([
      ModelService.isModelDownloaded(),
      ModelService.isSegmentationModelDownloaded(),
    ]);
    if (gemmaExists) setGemmaState('completed');
    if (segExists) setSegState('completed');
  };

  const downloadGemma = async () => {
    setGemmaState('downloading');
    setError(null);
    try {
      await ModelService.downloadModel((progress: DownloadProgress) => {
        setGemmaProgress(progress.progress);
      });
      setGemmaState('completed');
    } catch (err: any) {
      setGemmaState('error');
      setError(err.message || 'Download failed');
    }
  };

  const downloadSegmentation = async () => {
    setSegState('downloading');
    setError(null);
    try {
      await ModelService.downloadSegmentationModel((progress: DownloadProgress) => {
        setSegProgress(progress.progress);
      });
      setSegState('completed');
    } catch (err: any) {
      setSegState('error');
      setError(err.message || 'Download failed');
    }
  };

  const downloadAll = async () => {
    if (gemmaState !== 'completed') await downloadGemma();
    if (segState !== 'completed') await downloadSegmentation();
  };

  const handleContinue = () => {
    if (gemmaState === 'completed' && segState === 'completed') {
      navigation.goBack();
    } else {
      Alert.alert('Models Required', 'Please download all models to continue.');
    }
  };

  const cancelDownload = () => {
    ModelService.cancelDownload();
    setGemmaState('idle');
    setGemmaProgress(0);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Platform: {Platform.OS.toUpperCase()}</Text>
        <Text style={styles.infoText}>
          Models are optimized for your device using{' '}
          {Platform.OS === 'ios' ? 'CoreML acceleration' : 'GPU delegate via TFLite'}
        </Text>
      </View>

      {/* Gemma Model */}
      <View style={styles.modelCard}>
        <View style={styles.modelHeader}>
          <Text style={styles.modelName}>Gemma 2B (Edge)</Text>
          <Text style={styles.modelBadge}>{modelInfo.gemma.format}</Text>
        </View>
        <Text style={styles.modelSize}>Size: {modelInfo.gemma.size}</Text>
        <Text style={styles.modelDesc}>
          Language model for intelligent clothing fit guidance and texture mapping parameters.
        </Text>

        {gemmaState === 'idle' && (
          <TouchableOpacity style={styles.downloadBtn} onPress={downloadGemma}>
            <Text style={styles.downloadBtnText}>Download</Text>
          </TouchableOpacity>
        )}
        {gemmaState === 'downloading' && (
          <View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {width: `${gemmaProgress * 100}%`}]} />
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {(gemmaProgress * 100).toFixed(1)}%
              </Text>
              <TouchableOpacity onPress={cancelDownload}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {gemmaState === 'completed' && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Downloaded</Text>
          </View>
        )}
        {gemmaState === 'error' && (
          <TouchableOpacity style={styles.retryBtn} onPress={downloadGemma}>
            <Text style={styles.retryBtnText}>Retry Download</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segmentation Model */}
      <View style={styles.modelCard}>
        <View style={styles.modelHeader}>
          <Text style={styles.modelName}>Body Segmentation</Text>
          <Text style={styles.modelBadge}>{modelInfo.segmentation.format}</Text>
        </View>
        <Text style={styles.modelSize}>Size: {modelInfo.segmentation.size}</Text>
        <Text style={styles.modelDesc}>
          MediaPipe-based model for detecting body regions and clothing boundaries.
        </Text>

        {segState === 'idle' && (
          <TouchableOpacity style={styles.downloadBtn} onPress={downloadSegmentation}>
            <Text style={styles.downloadBtnText}>Download</Text>
          </TouchableOpacity>
        )}
        {segState === 'downloading' && (
          <View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {width: `${segProgress * 100}%`}]} />
            </View>
            <Text style={styles.progressText}>
              {(segProgress * 100).toFixed(1)}%
            </Text>
          </View>
        )}
        {segState === 'completed' && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Downloaded</Text>
          </View>
        )}
        {segState === 'error' && (
          <TouchableOpacity style={styles.retryBtn} onPress={downloadSegmentation}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {gemmaState !== 'completed' || segState !== 'completed' ? (
          <TouchableOpacity style={styles.downloadAllBtn} onPress={downloadAll}>
            <Text style={styles.downloadAllText}>Download All Models</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Continue to App</Text>
          </TouchableOpacity>
        )}
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
  infoSection: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#a8a8b3',
    lineHeight: 18,
  },
  modelCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#533483',
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modelBadge: {
    fontSize: 11,
    color: '#e94560',
    backgroundColor: 'rgba(233,69,96,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  modelSize: {
    fontSize: 13,
    color: '#a8a8b3',
    marginBottom: 4,
  },
  modelDesc: {
    fontSize: 13,
    color: '#a8a8b3',
    lineHeight: 18,
    marginBottom: 12,
  },
  downloadBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2d2d44',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    color: '#a8a8b3',
  },
  cancelText: {
    fontSize: 13,
    color: '#e94560',
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#1b4332',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    color: '#40916c',
    fontSize: 14,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#3d1f00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#e94560',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#e94560',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  actions: {
    marginTop: 'auto',
  },
  downloadAllBtn: {
    backgroundColor: '#533483',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueBtn: {
    backgroundColor: '#40916c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
