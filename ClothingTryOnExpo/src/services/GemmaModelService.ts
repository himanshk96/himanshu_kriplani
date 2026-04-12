import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Gemma 4 E4B Model Configuration
 *
 * Uses Google's Gemma 4 Edge 4B model which supports:
 * - Native vision (can see and understand images)
 * - Text generation
 * - Function calling
 * - Runs entirely on-device via MediaPipe LLM Inference
 *
 * The E4B model has ~4B effective parameters (8B total) and is optimized
 * for flagship phones. For older/mid-range devices, fall back to E2B.
 */

export const GEMMA_4_MODELS = {
  E4B: {
    name: 'gemma-4-e4b-it-int4',
    displayName: 'Gemma 4 E4B (Recommended)',
    fileName: 'gemma-4-e4b-it-int4.bin',
    url: 'https://huggingface.co/google/gemma-4-e4b-it-mediapipe/resolve/main/gemma-4-e4b-it-int4.bin',
    size: '2.8 GB',
    sizeBytes: 2800000000,
    description: 'Best quality. Native vision + text. For flagship phones (iPhone 14+, Pixel 7+).',
    capabilities: ['vision', 'text', 'function_calling'],
    minRAM: 4,
  },
  E2B: {
    name: 'gemma-4-e2b-it-int4',
    displayName: 'Gemma 4 E2B (Lightweight)',
    fileName: 'gemma-4-e2b-it-int4.bin',
    url: 'https://huggingface.co/google/gemma-4-e2b-it-mediapipe/resolve/main/gemma-4-e2b-it-int4.bin',
    size: '1.4 GB',
    sizeBytes: 1400000000,
    description: 'Faster inference. Vision + text. For mid-range devices.',
    capabilities: ['vision', 'text', 'function_calling'],
    minRAM: 3,
  },
} as const;

export type ModelVariant = keyof typeof GEMMA_4_MODELS;
export type ModelConfig = typeof GEMMA_4_MODELS[ModelVariant];

export type DownloadProgress = {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number;
};

const MODEL_DIR = `${FileSystem.documentDirectory}models/`;

class GemmaModelService {
  private selectedModel: ModelVariant = 'E4B';

  /**
   * Get the recommended model for this device.
   * E4B for flagship, E2B for mid-range.
   */
  getRecommendedModel(): ModelVariant {
    // On iOS, devices with A16+ (iPhone 14 Pro and later) can handle E4B well
    // On Android, devices with 8GB+ RAM handle E4B
    // Default to E4B for now; user can switch to E2B if performance is poor
    return 'E4B';
  }

  setSelectedModel(variant: ModelVariant) {
    this.selectedModel = variant;
  }

  getSelectedModel(): ModelConfig {
    return GEMMA_4_MODELS[this.selectedModel];
  }

  getModelConfig(variant: ModelVariant): ModelConfig {
    return GEMMA_4_MODELS[variant];
  }

  /**
   * Get the local file path for the downloaded model.
   */
  getModelPath(): string {
    const model = GEMMA_4_MODELS[this.selectedModel];
    return `${MODEL_DIR}${model.fileName}`;
  }

  /**
   * Check if the selected model is already downloaded.
   */
  async isModelDownloaded(): Promise<boolean> {
    const modelPath = this.getModelPath();
    const info = await FileSystem.getInfoAsync(modelPath);
    return info.exists;
  }

  /**
   * Download the selected Gemma 4 model with progress tracking.
   * The model is downloaded from HuggingFace and stored locally.
   * After first download, all inference is offline.
   */
  async downloadModel(
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<string> {
    const model = GEMMA_4_MODELS[this.selectedModel];
    const modelPath = `${MODEL_DIR}${model.fileName}`;

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(MODEL_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
    }

    // Check if already downloaded
    const fileInfo = await FileSystem.getInfoAsync(modelPath);
    if (fileInfo.exists) {
      return modelPath;
    }

    // Download with progress
    const downloadResumable = FileSystem.createDownloadResumable(
      model.url,
      modelPath,
      {},
      (downloadProgress) => {
        onProgress({
          totalBytesWritten: downloadProgress.totalBytesWritten,
          totalBytesExpectedToWrite: downloadProgress.totalBytesExpectedToWrite,
          progress:
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite,
        });
      },
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) {
      throw new Error('Download failed - no result returned');
    }

    return result.uri;
  }

  /**
   * Delete the downloaded model to free up storage.
   */
  async deleteModel(): Promise<void> {
    const modelPath = this.getModelPath();
    const info = await FileSystem.getInfoAsync(modelPath);
    if (info.exists) {
      await FileSystem.deleteAsync(modelPath);
    }
  }

  /**
   * Get storage info about downloaded models.
   */
  async getStorageInfo(): Promise<{downloaded: boolean; sizeOnDisk: number}> {
    const modelPath = this.getModelPath();
    const info = await FileSystem.getInfoAsync(modelPath, { size: true });
    return {
      downloaded: info.exists,
      sizeOnDisk: info.exists ? (info as any).size || 0 : 0,
    };
  }
}

export default new GemmaModelService();
