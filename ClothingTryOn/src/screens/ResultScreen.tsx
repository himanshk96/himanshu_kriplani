import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../../App';
import RNFS from 'react-native-fs';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Result'>;
  route: RouteProp<RootStackParamList, 'Result'>;
};

export default function ResultScreen({navigation, route}: Props) {
  const {resultImage, personPhoto, clothingPhoto} = route.params;
  const [viewMode, setViewMode] = useState<'result' | 'comparison'>('result');

  const handleShare = async () => {
    try {
      await Share.share({
        url: resultImage,
        message: 'Check out my virtual clothing try-on!',
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleSave = async () => {
    try {
      const destPath = `${RNFS.PicturesDirectoryPath}/TryOn_${Date.now()}.jpg`;
      await RNFS.copyFile(resultImage, destPath);
      Alert.alert('Saved!', 'Image saved to your photo gallery.');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const handleTryAgain = () => {
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'result' && styles.toggleActive]}
          onPress={() => setViewMode('result')}>
          <Text
            style={[
              styles.toggleText,
              viewMode === 'result' && styles.toggleTextActive,
            ]}>
            Result
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'comparison' && styles.toggleActive]}
          onPress={() => setViewMode('comparison')}>
          <Text
            style={[
              styles.toggleText,
              viewMode === 'comparison' && styles.toggleTextActive,
            ]}>
            Compare
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Display */}
      <View style={styles.imageContainer}>
        {viewMode === 'result' ? (
          <Image source={{uri: resultImage}} style={styles.resultImage} />
        ) : (
          <View style={styles.comparisonView}>
            <View style={styles.comparisonCol}>
              <Image source={{uri: personPhoto}} style={styles.comparisonImage} />
              <Text style={styles.comparisonLabel}>Original</Text>
            </View>
            <View style={styles.comparisonCol}>
              <Image source={{uri: resultImage}} style={styles.comparisonImage} />
              <Text style={styles.comparisonLabel}>Try-On</Text>
            </View>
          </View>
        )}
      </View>

      {/* Clothing Material Used */}
      <View style={styles.materialRow}>
        <Image source={{uri: clothingPhoto}} style={styles.materialThumb} />
        <View style={styles.materialInfo}>
          <Text style={styles.materialLabel}>Material Used</Text>
          <Text style={styles.materialDesc}>
            Applied as a fitted shirt using AI texture mapping
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.tryAgainBtn} onPress={handleTryAgain}>
        <Text style={styles.tryAgainText}>Try Another Outfit</Text>
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
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
  imageContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    marginBottom: 16,
  },
  resultImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  comparisonView: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  comparisonCol: {
    flex: 1,
  },
  comparisonImage: {
    flex: 1,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  comparisonLabel: {
    textAlign: 'center',
    color: '#a8a8b3',
    fontSize: 12,
    marginTop: 4,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  materialThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  materialDesc: {
    fontSize: 12,
    color: '#a8a8b3',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  shareBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#533483',
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#40916c',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  tryAgainBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  tryAgainText: {
    color: '#e94560',
    fontSize: 15,
    fontWeight: '600',
  },
});
