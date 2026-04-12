# Clothing Try-On — Expo + Gemma 4 E4B

A React Native (Expo) app that uses **Google's Gemma 4 E4B** edge model to perform
virtual clothing try-on entirely on-device. No server, no cloud — full privacy.

## What It Does

1. **Download Gemma 4 E4B** (one-time, ~2.8 GB over WiFi)
2. **Take a photo** of yourself (upper body)
3. **Take a photo** of any fabric/clothing material
4. **AI generates** you wearing that material as a shirt — all on your phone

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Expo (React Native) |
| AI Model | Gemma 4 E4B (4B params, multimodal vision+text) |
| Inference | expo-llm-mediapipe (MediaPipe LLM Inference API) |
| Build | EAS Build (cloud build → installable .ipa/.apk) |
| Camera | expo-camera |
| Platform | iOS 16+ / Android 10+ |

## Offline Capability

**YES — the app works fully offline after model download.**

- Model download: Requires internet (one-time, ~2.8 GB)
- After download: 100% offline. No API calls, no cloud, no data leaves your phone
- Photos stay on-device, inference is local

## Install on Your iPhone (No Mac Required!)

### Prerequisites
- An Expo account (free): https://expo.dev/signup
- Node.js 18+ installed
- EAS CLI: `npm install -g eas-cli`

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/himanshk96/himanshu_kriplani.git
cd himanshu_kriplani/ClothingTryOnExpo

# 2. Install dependencies
npm install

# 3. Login to Expo
eas login

# 4. Configure your project (first time only)
eas build:configure

# 5. Register your iPhone for ad-hoc distribution
eas device:create
# → Scan the QR code with your iPhone to register it

# 6. Build for iOS
eas build --platform ios --profile preview
# → This builds in the cloud (takes ~15-20 min)
# → No Mac needed! EAS has macOS build servers

# 7. Install on your iPhone
# → When build completes, you get a QR code
# → Scan it with your iPhone camera to install directly
```

### Alternative: Android APK
```bash
eas build --platform android --profile preview
# → Downloads an .apk file you can install directly
```

## Project Structure

```
ClothingTryOnExpo/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout + navigation
│   ├── index.tsx                 # Home screen
│   ├── model-download.tsx        # Gemma 4 model download
│   ├── camera.tsx                # Photo capture (person/fabric)
│   ├── processing.tsx            # AI processing pipeline
│   └── result.tsx                # Final result + share/save
├── src/
│   └── services/
│       ├── GemmaModelService.ts  # Model download & management
│       └── TryOnService.ts       # Try-on pipeline (vision inference)
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build profiles
└── package.json
```

## How the AI Pipeline Works

```
Person Photo ──┐
               ├──→ Gemma 4 E4B (on-device) ──→ Composite Result
Fabric Photo ──┘        │
                        │
              ┌─────────┴──────────┐
              │  Vision Analysis:    │
              │  • Body detection    │
              │  • Pose estimation   │
              │  • Fabric texture    │
              │  • Color/pattern     │
              │  • Drape parameters  │
              └────────────────────┘
```

The Gemma 4 E4B model:
- **Sees** both images via native vision encoder
- **Understands** body proportions, pose, and fabric properties
- **Generates** structured compositing parameters (JSON)
- **Guides** the native image compositor for realistic output

## Model Options

| Model | Size | Quality | Target Device |
|-------|------|---------|---------------|
| **Gemma 4 E4B** (default) | 2.8 GB | Best | iPhone 14+, Pixel 7+ |
| Gemma 4 E2B | 1.4 GB | Good | iPhone 12+, mid-range Android |

Switch models in the download screen based on your device.

## Development

```bash
# Start dev server
npx expo start

# Run on iOS simulator (requires Mac)
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## Privacy

- All AI inference runs on-device (Neural Engine on iOS, GPU on Android)
- No photos are uploaded anywhere
- No analytics or telemetry
- Model weights are stored locally and never transmitted
