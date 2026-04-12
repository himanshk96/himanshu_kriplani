import {Platform} from 'react-native';
import RNFS from 'react-native-fs';

export type ModelVariant = {
  name: string;
  url: string;
  size: string;
  platform: 'ios' | 'android' | 'both';
  format: string;
};

// Gemma edge model variants optimized for each platform
const MODEL_VARIANTS: ModelVariant[] = [
  {
    name: 'gemma-2b-it-ios',
    url: 'https://storage.googleapis.com/gemma-models/gemma-2b-it-ios.mlpackage.zip',
    size: '1.4 GB',
    platform: 'ios',
    format: 'CoreML (.mlpackage)',
  },
  {
    name: 'gemma-2b-it-android',
    url: 'https://storage.googleapis.com/gemma-models/gemma-2b-it-android.tflite',
    size: '1.3 GB',
    platform: 'android',
    format: 'TensorFlow Lite (.tflite)',
  },
];

// Segmentation model for clothing region detection
const SEGMENTATION_MODEL = {
  ios: {
    name: 'clothing-segmentation-ios',
    url: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass/float16/selfie_multiclass.tflite',
    size: '15 MB',
    format: 'CoreML',
  },
  android: {
    name: 'clothing-segmentation-android',
    url: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass/float16/selfie_multiclass.tflite',
    size: '15 MB',
    format: 'TFLite',
  },
};

export type DownloadProgress = {
  bytesWritten: number;
  contentLength: number;
  progress: number;
};

class ModelService {
  private modelDir: string;
  private downloadJobId: number | null = null;

  constructor() {
    this.modelDir =
      Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/models`
        : `${RNFS.ExternalDirectoryPath}/models`;
  }

  getPlatformModel(): ModelVariant {
    const platform = Platform.OS as 'ios' | 'android';
    const model = MODEL_VARIANTS.find(
      m => m.platform === platform || m.platform === 'both',
    );
    if (!model) {
      throw new Error(`No model available for platform: ${platform}`);
    }
    return model;
  }

  getSegmentationModel() {
    const platform = Platform.OS as 'ios' | 'android';
    return SEGMENTATION_MODEL[platform];
  }

  async isModelDownloaded(): Promise<boolean> {
    const model = this.getPlatformModel();
    const modelPath = `${this.modelDir}/${model.name}`;
    return RNFS.exists(modelPath);
  }

  async isSegmentationModelDownloaded(): Promise<boolean> {
    const model = this.getSegmentationModel();
    const modelPath = `${this.modelDir}/${model.name}`;
    return RNFS.exists(modelPath);
  }

  getModelPath(): string {
    const model = this.getPlatformModel();
    return `${this.modelDir}/${model.name}`;
  }

  getSegmentationModelPath(): string {
    const model = this.getSegmentationModel();
    return `${this.modelDir}/${model.name}`;
  }

  async downloadModel(
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<string> {
    const model = this.getPlatformModel();
    const destPath = `${this.modelDir}/${model.name}`;

    // Ensure model directory exists
    const dirExists = await RNFS.exists(this.modelDir);
    if (!dirExists) {
      await RNFS.mkdir(this.modelDir);
    }

    // Check if already downloaded
    const exists = await RNFS.exists(destPath);
    if (exists) {
      return destPath;
    }

    const download = RNFS.downloadFile({
      fromUrl: model.url,
      toFile: destPath,
      background: true,
      discretionary: true,
      progress: (res) => {
        onProgress({
          bytesWritten: res.bytesWritten,
          contentLength: res.contentLength,
          progress: res.bytesWritten / res.contentLength,
        });
      },
      progressDivider: 1,
    });

    this.downloadJobId = download.jobId;

    const result = await download.promise;
    this.downloadJobId = null;

    if (result.statusCode === 200) {
      return destPath;
    } else {
      throw new Error(
        `Download failed with status code: ${result.statusCode}`,
      );
    }
  }

  async downloadSegmentationModel(
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<string> {
    const model = this.getSegmentationModel();
    const destPath = `${this.modelDir}/${model.name}`;

    const dirExists = await RNFS.exists(this.modelDir);
    if (!dirExists) {
      await RNFS.mkdir(this.modelDir);
    }

    const exists = await RNFS.exists(destPath);
    if (exists) {
      return destPath;
    }

    const download = RNFS.downloadFile({
      fromUrl: model.url,
      toFile: destPath,
      background: true,
      discretionary: true,
      progress: (res) => {
        onProgress({
          bytesWritten: res.bytesWritten,
          contentLength: res.contentLength,
          progress: res.bytesWritten / res.contentLength,
        });
      },
      progressDivider: 1,
    });

    const result = await download.promise;
    if (result.statusCode === 200) {
      return destPath;
    } else {
      throw new Error(
        `Segmentation model download failed: ${result.statusCode}`,
      );
    }
  }

  cancelDownload(): void {
    if (this.downloadJobId !== null) {
      RNFS.stopDownload(this.downloadJobId);
      this.downloadJobId = null;
    }
  }

  async deleteModel(): Promise<void> {
    const model = this.getPlatformModel();
    const modelPath = `${this.modelDir}/${model.name}`;
    const exists = await RNFS.exists(modelPath);
    if (exists) {
      await RNFS.unlink(modelPath);
    }
  }

  getModelInfo(): {gemma: ModelVariant; segmentation: typeof SEGMENTATION_MODEL.ios} {
    return {
      gemma: this.getPlatformModel(),
      segmentation: this.getSegmentationModel(),
    };
  }
}

export default new ModelService();
