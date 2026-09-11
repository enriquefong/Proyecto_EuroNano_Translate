/**
 * EuroNano Translate — Main Application Entry Point
 *
 * Traductor de voz y texto 100% local para Android
 * Usando @qvac/sdk con TranslatePsy-EuroNano
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_700Bold } from '@expo-google-fonts/outfit';
import { TranslationEngineProvider } from './src/engine/TranslationEngineProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { DisclaimerModal } from './src/components/DisclaimerModal';
import { colors, typography, spacing } from './src/theme/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Outfit_700Bold,
  });
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDisclaimerAccept = useCallback(() => {
    setShowDisclaimer(false);
  }, []);

  if (!isReady || !fontsLoaded) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <Text style={styles.splashIcon}>🌍</Text>
        <Text style={styles.splashTitle}>EuroNano</Text>
        <Text style={styles.splashSubtitle}>Translate</Text>
        <ActivityIndicator
          size="large"
          color={colors.accent.primary}
          style={styles.splashLoader}
        />
        <Text style={styles.splashDescription}>
          Traducción offline con IA local
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <TranslationEngineProvider>
        <StatusBar style="light" />
        <DisclaimerModal
          visible={showDisclaimer}
          onAccept={handleDisclaimerAccept}
        />
        <AppNavigator />
      </TranslationEngineProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  splashIcon: {
    fontSize: 72,
    marginBottom: spacing.base,
  },
  splashTitle: {
    fontSize: 42,
    color: colors.text.primary,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  splashSubtitle: {
    fontSize: 20,
    color: colors.accent.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  splashLoader: {
    marginTop: spacing.xl,
  },
  splashDescription: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
});
