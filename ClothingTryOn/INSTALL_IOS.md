# Install on Your iOS Device

## Prerequisites

- **Mac** with macOS 13+ (Ventura or later)
- **Xcode 15+** (from Mac App Store)
- **CocoaPods**: `sudo gem install cocoapods`
- **Node.js 18+**: `brew install node`
- **Apple Developer Account** (free tier works for personal device)
- **iPhone** connected via USB (or on same Wi-Fi for wireless deploy)

## Step-by-Step Build & Install

### 1. Clone and install dependencies

```bash
git clone https://github.com/himanshk96/himanshu_kriplani.git
cd himanshu_kriplani/ClothingTryOn

npm install
```

### 2. Install iOS pods

```bash
cd ios
pod install
cd ..
```

### 3. Open in Xcode

```bash
open ios/ClothingTryOn.xcworkspace
```

### 4. Configure signing (REQUIRED for device install)

In Xcode:
1. Click on **ClothingTryOn** in the project navigator (left sidebar)
2. Select the **ClothingTryOn** target
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (your Apple ID)
6. Change the **Bundle Identifier** to something unique:
   `com.yourname.clothingtryon`

### 5. Select your device

- Connect your iPhone via USB
- In Xcode toolbar, select your iPhone from the device dropdown
- If prompted on the phone, tap "Trust This Computer"

### 6. Build and run

Either:
- Press **Cmd + R** in Xcode, or
- Click the **Play** button in the toolbar

### 7. Trust the developer on iPhone (first time only)

If you see "Untrusted Developer" on your phone:
1. Go to **Settings → General → VPN & Device Management**
2. Tap your developer profile
3. Tap **Trust**
4. Go back to the app and tap it again

---

## Alternative: Run via CLI

If you prefer the terminal:

```bash
# Make sure your phone is connected and trusted
npx react-native run-ios --device "Your iPhone Name"
```

To find your device name:
```bash
xcrun xctrace list devices
```

---

## Building a Standalone .ipa (no Mac tethering)

For an installable build without needing to be connected to Xcode:

### Using Xcode Archive:

1. In Xcode, set scheme to **Release**: Product → Scheme → Edit Scheme → Run → Build Configuration → Release
2. Product → **Archive**
3. When archive completes, in the Organizer window:
   - Click **Distribute App**
   - Select **Development** (for personal device)
   - Follow the prompts to export an `.ipa`
4. Install the `.ipa` using Apple Configurator 2 or `ios-deploy`:

```bash
brew install ios-deploy
ios-deploy --bundle path/to/ClothingTryOn.ipa
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "No such module 'React'" | Run `cd ios && pod install && cd ..` |
| "Signing requires a development team" | Select your Apple ID team in Xcode |
| "Could not find iPhone" | Trust computer on phone, reconnect USB |
| "App crashes on launch" | Run in Debug mode first to see logs |
| "Camera not working" | Physical device required (simulator has no camera) |

## Minimum iOS Version

iOS 16.0+ (required for CoreML optimizations used by Gemma model)
