import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { hydrateStore } from './src/store/store';
import { AuthProvider } from './src/auth/AuthProvider';

export default function App() {
  const [storeReady, setStoreReady] = useState(false);

  // Preload icon fonts so they render correctly on web and native
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    hydrateStore().finally(() => setStoreReady(true));
  }, []);

  if (!fontsLoaded || !storeReady) {
    return <View style={styles.splash} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#08080F',
  },
});
