import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './components/OnboardingScreen';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './lib/i18n';
import { AuthNavigator, AppNavigator } from './app/_navigators';
import ProfileSetupScreen from './app/auth/ProfileSetupScreen';
import SplashScreen from './components/SplashScreen';

function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const { colors, isDark } = useTheme();

  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@onboarding_done').then(val => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  if (loading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }} />
    );
  }

  // Not logged in → Auth flow
  if (!session) return <AuthNavigator />;

  // Logged in but no nickname yet → Profile setup
  if (!profile?.nickname) return <ProfileSetupScreen />;

  // Onboarding not done → Show walkthrough
  if (!onboardingDone) {
    return (
      <OnboardingScreen
        onFinish={async () => {
          await AsyncStorage.setItem('@onboarding_done', 'true');
          setOnboardingDone(true);
        }}
      />
    );
  }

  // Fully onboarded → Main app
  return <AppNavigator />;
}

function StatusBarWrapper() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <NavigationContainer>
              <StatusBarWrapper />
              <RootNavigator />
              {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
            </NavigationContainer>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
