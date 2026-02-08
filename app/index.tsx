import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getMyProfile } from "../services/api";
import { getRollNumber, saveRollNumber } from "../services/storage";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    async function checkNavigation() {
      // Wait for Clerk to fully load
      if (!isLoaded) return;

      // Already determined destination, don't check again
      if (destination) return;

      // If not signed in, redirect to sign-in
      if (isSignedIn === false) {
        setDestination("/sign-in");
        return;
      }

      // If signed in, check for local roll number first
      if (isSignedIn === true) {
        let rollNumber = await getRollNumber();

        // If no local roll number, try to fetch from backend
        if (!rollNumber) {
          try {
            const profile = await getMyProfile();
            console.log("Profile:", profile);
            if (profile && profile.rollNo) {
              rollNumber = profile.rollNo;
              await saveRollNumber(rollNumber);
            }
          } catch (e) {
            console.log("No profile found or failed to fetch", e);
          }
        }

        if (!rollNumber) {
          setDestination("/onboarding");
        } else {
          setDestination("/(tabs)");
        }
      }
    }

    checkNavigation();
  }, [isLoaded, isSignedIn, destination]);

  // Use useLayoutEffect for navigation to ensure it happens synchronously
  // before the screen renders, which is more reliable in production builds
  useLayoutEffect(() => {
    if (destination && !hasNavigated.current) {
      hasNavigated.current = true;
      // Use setTimeout to ensure navigation happens after the current render cycle
      const timer = setTimeout(() => {
        router.replace(destination as any);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [destination, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

