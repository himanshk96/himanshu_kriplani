import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import ResultScreen from './src/screens/ResultScreen';
import ModelDownloadScreen from './src/screens/ModelDownloadScreen';

export type RootStackParamList = {
  Home: undefined;
  ModelDownload: undefined;
  Camera: {mode: 'person' | 'clothing'};
  Processing: {personPhoto: string; clothingPhoto: string};
  Result: {resultImage: string; personPhoto: string; clothingPhoto: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {backgroundColor: '#1a1a2e'},
            headerTintColor: '#e94560',
            headerTitleStyle: {fontWeight: 'bold'},
            contentStyle: {backgroundColor: '#16213e'},
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'Virtual Try-On'}}
          />
          <Stack.Screen
            name="ModelDownload"
            component={ModelDownloadScreen}
            options={{title: 'Download AI Model'}}
          />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{title: 'Capture Photo'}}
          />
          <Stack.Screen
            name="Processing"
            component={ProcessingScreen}
            options={{title: 'Processing', headerBackVisible: false}}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{title: 'Try-On Result'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
