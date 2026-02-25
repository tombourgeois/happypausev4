import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { AuthProvider } from '../contexts/AuthContext';
import { TimerProvider } from '../contexts/TimerContext';
import { LocaleProvider } from '../contexts/LocaleContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <LocaleProvider>
    <AuthProvider>
      <TimerProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="happypause" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="create-happypause" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
      </TimerProvider>
    </AuthProvider>
    </LocaleProvider>
  );
}
