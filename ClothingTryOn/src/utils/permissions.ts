import {Platform, PermissionsAndroid, Alert} from 'react-native';

export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // iOS handles permissions via Info.plist + system prompt
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'This app needs camera access to capture photos for virtual try-on.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    Alert.alert('Permission Error', 'Failed to request camera permission.');
    return false;
  }
}

export async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }

  // Android 13+ uses granular media permissions
  if (Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      {
        title: 'Photo Access',
        message: 'This app needs access to your photos to save try-on results.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    {
      title: 'Storage Permission',
      message: 'This app needs storage access to save try-on results.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}
