import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TryOnService, { TryOnStep } from '../src/services/TryOnService';

const STEP_CONFIG: Record<TryOnStep, { label: string; icon: string }> = {
  initializing: { label: 'Loading Gemma 4 model...', icon: 'hardware-chip-outline' },
  analyzing_person: { label: 'Analyzing person (body shape, pose)...', icon: 'person-outline' },
  analyzing_fabric: { label: 'Analyzing fabric (texture, color, pattern)...', icon: 'shirt-outline' },
  generating_tryon: { label: 'AI generating clothing fit...', icon: 'sparkles-outline' },
  compositing: { label: 'Creating final image...', icon: 'image-outline' },
  complete: { label: 'Done!', icon: 'checkmark-circle-outline' },
  error: { label: 'Error occurred', icon: 'alert-circle-outline' },
};

const STEP_ORDER: TryOnStep[] = [
  'initializing',
  'analyzing_person',
  'analyzing_fabric',
  'generating_tryon',
  'compositing',
  'complete',
];

export default function ProcessingScreen() {
  const { personPhoto, clothingPhoto } = useLocalSearchParams<{
    personPhoto: string;
    clothingPhoto: string;
  }>();

  const [currentStep, setCurrentStep] = useState<TryOnStep>('initializing');
  const [stepMessage, setStepMessage] = useState('Starting...');
  const [error, setError] = useState<string | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startSpin();
    runPipeline();
  }, []);

  const startSpin = () => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  };

  const runPipeline = async () => {
    if (!personPhoto || !clothingPhoto) {
      setError('Missing photos');
      return;
    }

    try {
      const result = await TryOnService.performTryOn(
        personPhoto,
        clothingPhoto,
        (step: TryOnStep, message: string) => {
          setCurrentStep(step);
          setStepMessage(message);
        },
      );

      router.replace({
        pathname: '/result',
        params: {
          resultImage: result.resultImageUri,
          personPhoto,
          clothingPhoto,
          processingTime: result.processingTimeMs.toString(),
          description: result.description,
        },
      });
    } catch (err: any) {
      setCurrentStep('error');
      setError(err.message || 'Processing failed');
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progress = Math.max(0, (currentStepIndex + 1) / STEP_ORDER.length);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animated Spinner */}
        {currentStep !== 'complete' && currentStep !== 'error' && (
          <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
            <View style={styles.spinnerArc} />
          </Animated.View>
        )}

        {currentStep === 'complete' && (
          <Ionicons name="checkmark-circle" size={72} color="#40916c" />
        )}
        {currentStep === 'error' && (
          <Ionicons name="alert-circle" size={72} color="#e94560" />
        )}

        <Text style={styles.title}>
          {currentStep === 'error' ? 'Something Went Wrong' : 'Creating Your Try-On'}
        </Text>
        <Text style={styles.stepMessage}>{stepMessage}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* Step List */}
        <View style={styles.stepList}>
          {STEP_ORDER.map((step, idx) => {
            const config = STEP_CONFIG[step];
            const isComplete = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIcon,
                    isComplete && styles.stepIconComplete,
                    isCurrent && styles.stepIconCurrent,
                  ]}>
                  <Ionicons
                    name={isComplete ? 'checkmark' : (config.icon as any)}
                    size={14}
                    color={isComplete ? '#fff' : isCurrent ? '#e94560' : '#4a4a5a'}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isComplete && styles.stepLabelComplete,
                    isCurrent && styles.stepLabelCurrent,
                  ]}>
                  {config.label}
                </Text>
              </View>
            );
          })}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Try with better lighting or a clearer pose. Ensure the model is fully
              downloaded.
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.footerText}>
        Gemma 4 is processing on-device. No data leaves your phone.
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
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#2d2d44',
    borderTopColor: '#e94560',
    marginBottom: 28,
  },
  spinnerArc: {},
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  stepMessage: {
    fontSize: 15,
    color: '#e94560',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 28,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2d2d44',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 3,
  },
  stepList: {
    alignSelf: 'stretch',
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIconComplete: {
    backgroundColor: '#40916c',
  },
  stepIconCurrent: {
    backgroundColor: 'rgba(233,69,96,0.15)',
    borderWidth: 2,
    borderColor: '#e94560',
  },
  stepLabel: {
    fontSize: 14,
    color: '#4a4a5a',
    flex: 1,
  },
  stepLabelComplete: {
    color: '#40916c',
  },
  stepLabelCurrent: {
    color: '#fff',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: 'rgba(233,69,96,0.1)',
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    width: '100%',
  },
  errorText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  errorHint: {
    color: '#a8a8b3',
    fontSize: 12,
    lineHeight: 17,
  },
  footerText: {
    fontSize: 12,
    color: '#4a4a5a',
    textAlign: 'center',
  },
});
