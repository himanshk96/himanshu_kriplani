# Clothing Try-On - React Native App

A mobile application that uses Google's **Gemma edge model** for on-device virtual clothing try-on. Users capture a photo of themselves and a photo of raw clothing material, and the AI generates a realistic image of the person wearing that material as a shirt.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Native UI                        │
│  HomeScreen → CameraScreen → ProcessingScreen → Result   │
├─────────────────────────────────────────────────────────┤
│                   Service Layer                           │
│  ModelService (download/manage) │ TryOnService (pipeline) │
├─────────────────────────────────────────────────────────┤
│                 Native Bridge (TryOnModule)               │
│  ┌──────────────────┐    ┌────────────────────────┐     │
│  │   Android (Java)  │    │     iOS (Swift)         │     │
│  │  TFLite + GPU     │    │  CoreML + Neural Engine │     │
│  │  delegate         │    │  + Vision framework     │     │
│  └──────────────────┘    └────────────────────────┘     │
├─────────────────────────────────────────────────────────┤
│                    On-Device Models                       │
│  1. Gemma 2B-IT (language guidance for drape/fit)        │
│  2. MediaPipe Selfie Segmentation (body region detect)   │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### Pipeline Overview

1. **Model Download** - Downloads platform-optimized models:
   - **iOS**: Gemma `.mlpackage` (CoreML) for Neural Engine acceleration
   - **Android**: Gemma `.tflite` for GPU delegate acceleration
   - **Both**: MediaPipe body segmentation model

2. **Photo Capture** - User takes two photos:
   - A clear upper-body photo of the person
   - A close-up photo of the raw clothing material/fabric

3. **Processing Pipeline**:
   - **Body Segmentation**: Detects the upper body/torso region using MediaPipe
   - **Texture Extraction**: Processes the fabric photo into a mappable texture
   - **Gemma Inference**: Generates clothing fit parameters (drape, fold, taper)
   - **Compositing**: Applies the fabric texture onto the detected clothing region with proper blending and shadows

4. **Result** - Displays the person wearing the new material as a shirt, with before/after comparison

## Project Structure

```
ClothingTryOn/
├── App.tsx                          # Navigation setup
├── index.js                         # Entry point
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Main screen with photo slots
│   │   ├── ModelDownloadScreen.tsx  # Model download with progress
│   │   ├── CameraScreen.tsx        # Photo capture (person/material)
│   │   ├── ProcessingScreen.tsx    # AI processing with step indicators
│   │   └── ResultScreen.tsx        # Final result + share/save
│   ├── services/
│   │   ├── ModelService.ts         # Model download & management
│   │   └── TryOnService.ts        # Try-on pipeline orchestration
│   ├── hooks/
│   │   ├── useModelStatus.ts       # Model readiness hook
│   │   └── usePhotoCapture.ts      # Photo state management
│   └── utils/
│       └── permissions.ts          # Camera/storage permissions
├── android/
│   └── app/src/main/java/com/clothingtryon/
│       ├── TryOnModule.java        # Native Android module (TFLite)
│       └── TryOnPackage.java       # React Native package registration
├── ios/
│   ├── TryOnModule.swift           # Native iOS module (CoreML)
│   └── TryOnModule.m              # Objective-C bridge
└── package.json
```

## Setup & Running

### Prerequisites

- Node.js 18+
- React Native CLI
- For iOS: Xcode 15+, CocoaPods
- For Android: Android Studio, NDK, SDK 24+

### Installation

```bash
cd ClothingTryOn
npm install

# iOS
cd ios && pod install && cd ..

# Android: no extra steps needed
```

### Running

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

### First Launch

On first launch, the app will prompt you to download the AI models:
- **Gemma 2B-IT**: ~1.3-1.4 GB (platform-specific format)
- **Body Segmentation**: ~15 MB

Models are downloaded once and stored on-device. All inference runs locally with no internet required after download.

## Platform-Specific Optimizations

| Feature | iOS | Android |
|---------|-----|---------|
| Model Format | CoreML (.mlpackage) | TensorFlow Lite (.tflite) |
| Acceleration | Neural Engine + GPU | GPU Delegate |
| Segmentation | Vision framework | TFLite Interpreter |
| Threading | GCD async queues | 4 interpreter threads |
| Storage | DocumentDirectory | ExternalDirectory |

## Key Dependencies

- `react-native-image-picker` - Camera and gallery access
- `react-native-fs` - File system for model storage
- `react-native-executorch` - On-device ML inference bridge
- `@react-navigation/native` - Screen navigation
- TensorFlow Lite (Android) / CoreML (iOS) - Native ML inference

## Notes

- All AI processing happens on-device (privacy-preserving)
- Models use quantized weights for reduced memory footprint
- The Gemma model provides intelligent guidance for realistic fabric draping
- Body segmentation ensures the fabric is applied only to the clothing region
- The compositing step blends the texture with proper alpha and shadow depth
