import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Animated, Easing} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../../App';
import TryOnService from '../services/TryOnService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Processing'>;
  route: RouteProp<RootStackParamList, 'Processing'>;
};

const PROCESSING_STEPS = [
  'Loading AI models...',
  'Detecting body shape...',
  'Analyzing clothing material...',
  'AI generating clothing fit...',
  'Compositing final image...',
  'Done!',
];

export default function ProcessingScreen({navigation, route}: Props) {
  const {personPhoto, clothingPhoto} = route.params;
  const [currentStep, setCurrentStep] = useState('Initializing...');
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    startSpinAnimation();
    performTryOn();
  }, []);

  const startSpinAnimation = () => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  };

  const performTryOn = async () => {
    try {
      const result = await TryOnService.performTryOn(
        personPhoto,
        clothingPhoto,
        (step: string) => {
          setCurrentStep(step);
          const idx = PROCESSING_STEPS.indexOf(step);
          if (idx >= 0) setStepIndex(idx);
        },
      );

      navigation.replace('Result', {
        resultImage: result.resultImagePath,
        personPhoto,
        clothingPhoto,
      });
    } catch (err: any) {
      setError(err.message || 'Processing failed');
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progress = ((stepIndex + 1) / PROCESSING_STEPS.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Spinner */}
        <Animated.View style={[styles.spinner, {transform: [{rotate: spin}]}]}>
          <View style={styles.spinnerInner} />
        </Animated.View>

        {/* Status */}
        <Text style={styles.title}>Processing Your Try-On</Text>
        <Text style={styles.stepText}>{currentStep}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${progress}%`}]} />
          </View>
          <Text style={styles.progressText}>
            Step {stepIndex + 1} of {PROCESSING_STEPS.length}
          </Text>
        </View>

        {/* Step Indicators */}
        <View style={styles.steps}>
          {PROCESSING_STEPS.map((step, idx) => (
            <View key={step} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  idx < stepIndex && styles.stepDotCompleted,
                  idx === stepIndex && styles.stepDotActive,
                ]}
              />
              <Text
                style={[
                  styles.stepLabel,
                  idx <= stepIndex && styles.stepLabelActive,
                ]}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Try capturing photos with better lighting or a clearer pose.
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <Text style={styles.infoText}>
        AI is analyzing body shape and mapping the fabric texture to create a
        realistic try-on result. This runs entirely on-device.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#533483',
    borderTopColor: '#e94560',
    marginBottom: 32,
  },
  spinnerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e94560',
    position: 'absolute',
    top: -2,
    left: '50%',
    marginLeft: -6,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 16,
    color: '#e94560',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2d2d44',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#a8a8b3',
    textAlign: 'center',
  },
  steps: {
    alignSelf: 'stretch',
    paddingHorizontal: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2d2d44',
    marginRight: 12,
  },
  stepDotCompleted: {
    backgroundColor: '#40916c',
  },
  stepDotActive: {
    backgroundColor: '#e94560',
  },
  stepLabel: {
    fontSize: 14,
    color: '#4a4a5a',
  },
  stepLabelActive: {
    color: '#a8a8b3',
  },
  errorBox: {
    backgroundColor: '#3d1f00',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
  },
  errorText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorHint: {
    color: '#a8a8b3',
    fontSize: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#a8a8b3',
    textAlign: 'center',
    lineHeight: 18,
  },
});
