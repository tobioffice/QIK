import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";
import { setAuthTokenProvider } from "../services/api";
import { tokenCache } from "../services/storage";

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

// Component to initialize auth token provider for API requests
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Set the token provider for API requests
    setAuthTokenProvider(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
    setIsReady(true);
  }, [getToken]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Map Spotify Mix fonts to the names StyleSheets expect
    'Inter_400Regular': require("../assets/fonts/spotify_mix_ui_regular.otf"),
    'Inter_500Medium': require("../assets/fonts/spotify_mix_ui_regular.otf"),
    'Inter_600SemiBold': require("../assets/fonts/spotify_mix_ui_bold.otf"),
    'Inter_700Bold': require("../assets/fonts/spotify_mix_ui_title_bold.otf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthInitializer>
          <StatusBar style="light" backgroundColor="transparent" translucent />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0F0F1A" },
              animation: "fade",
            }}
          />
        </AuthInitializer>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
