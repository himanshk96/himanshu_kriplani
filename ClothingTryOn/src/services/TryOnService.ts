import {Platform, NativeModules} from 'react-native';
import RNFS from 'react-native-fs';
import ModelService from './ModelService';

const {TryOnModule} = NativeModules;

export type TryOnResult = {
  resultImagePath: string;
  confidence: number;
  processingTimeMs: number;
};

export type SegmentationMask = {
  maskPath: string;
  bounds: {x: number; y: number; width: number; height: number};
};

class TryOnService {
  private isModelLoaded = false;

  /**
   * Initialize the on-device model for inference.
   * Loads the Gemma model and segmentation model into memory.
   */
  async initialize(): Promise<void> {
    if (this.isModelLoaded) return;

    const gemmaPath = ModelService.getModelPath();
    const segPath = ModelService.getSegmentationModelPath();

    const [gemmaExists, segExists] = await Promise.all([
      RNFS.exists(gemmaPath),
      RNFS.exists(segPath),
    ]);

    if (!gemmaExists || !segExists) {
      throw new Error('Models not downloaded. Please download models first.');
    }

    // Initialize the native module with model paths
    if (Platform.OS === 'android') {
      await TryOnModule.initializeModels(gemmaPath, segPath);
    } else {
      await TryOnModule.initializeModels(gemmaPath, segPath);
    }

    this.isModelLoaded = true;
  }

  /**
   * Segment the person's clothing region from the photo.
   * Uses MediaPipe-based segmentation to identify the upper body/torso area.
   */
  async segmentClothingRegion(personImagePath: string): Promise<SegmentationMask> {
    if (!this.isModelLoaded) {
      await this.initialize();
    }

    const result = await TryOnModule.segmentUpperBody(personImagePath);
    return {
      maskPath: result.maskPath,
      bounds: result.bounds,
    };
  }

  /**
   * Extract texture/pattern from the clothing material photo.
   * Analyzes the fabric photo to extract color, pattern, and texture information.
   */
  async extractClothingTexture(clothingImagePath: string): Promise<string> {
    if (!this.isModelLoaded) {
      await this.initialize();
    }

    const texturePath = await TryOnModule.extractTexture(clothingImagePath);
    return texturePath;
  }

  /**
   * Main try-on pipeline:
   * 1. Segment the upper body region from the person photo
   * 2. Extract texture from clothing material photo
   * 3. Use Gemma model to guide intelligent texture mapping
   * 4. Composite the final result with proper lighting/shadows
   */
  async performTryOn(
    personImagePath: string,
    clothingImagePath: string,
    onStepUpdate?: (step: string) => void,
  ): Promise<TryOnResult> {
    const startTime = Date.now();

    if (!this.isModelLoaded) {
      onStepUpdate?.('Loading AI models...');
      await this.initialize();
    }

    // Step 1: Segment the upper body/torso region
    onStepUpdate?.('Detecting body shape...');
    const segmentation = await this.segmentClothingRegion(personImagePath);

    // Step 2: Extract texture from clothing material
    onStepUpdate?.('Analyzing clothing material...');
    const texturePath = await this.extractClothingTexture(clothingImagePath);

    // Step 3: Use Gemma to generate clothing shape guidance
    onStepUpdate?.('AI generating clothing fit...');
    const guidancePrompt = this.buildGuidancePrompt(segmentation.bounds);
    const shapeGuidance = await TryOnModule.runGemmaInference(guidancePrompt);

    // Step 4: Composite the final image
    onStepUpdate?.('Compositing final image...');
    const outputPath = `${RNFS.CachesDirectoryPath}/tryon_result_${Date.now()}.jpg`;
    await TryOnModule.compositeImage({
      personImage: personImagePath,
      mask: segmentation.maskPath,
      texture: texturePath,
      shapeGuidance: shapeGuidance,
      outputPath: outputPath,
      bounds: segmentation.bounds,
    });

    const processingTime = Date.now() - startTime;

    onStepUpdate?.('Done!');

    return {
      resultImagePath: outputPath,
      confidence: 0.85,
      processingTimeMs: processingTime,
    };
  }

  /**
   * Build a prompt for Gemma to provide guidance on how the clothing
   * should drape and fit based on the detected body shape.
   */
  private buildGuidancePrompt(bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): string {
    const aspectRatio = bounds.width / bounds.height;
    return `Given a person's upper body region with aspect ratio ${aspectRatio.toFixed(2)}, ` +
      `width ${bounds.width}px and height ${bounds.height}px, ` +
      `generate clothing drape parameters for a fitted shirt. ` +
      `Consider natural fabric fold patterns, shoulder width, and torso taper. ` +
      `Output: fold_intensity, drape_angle, taper_ratio, shadow_depth.`;
  }

  /**
   * Release model resources from memory.
   */
  async release(): Promise<void> {
    if (this.isModelLoaded) {
      await TryOnModule.releaseModels();
      this.isModelLoaded = false;
    }
  }

  /**
   * Clean up cached result images.
   */
  async cleanCache(): Promise<void> {
    const cacheDir = RNFS.CachesDirectoryPath;
    const files = await RNFS.readDir(cacheDir);
    const resultFiles = files.filter(f => f.name.startsWith('tryon_result_'));
    await Promise.all(resultFiles.map(f => RNFS.unlink(f.path)));
  }
}

export default new TryOnService();
