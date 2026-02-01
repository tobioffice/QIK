import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getMyProfile } from "../services/api";
import { getRollNumber, saveRollNumber } from "../services/storage";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const hasNavigated = useRef(false);

  useEffect(() => {
    async function checkNavigation() {
      // Wait for Clerk to fully load
      if (!isLoaded) return;

      // Prevent multiple navigations
      if (hasNavigated.current) return;

      // If not signed in, redirect to sign-in
      if (isSignedIn === false) {
        hasNavigated.current = true;
        router.replace("/sign-in");
        return;
      }

      // If signed in, check for local roll number first
      if (isSignedIn === true) {
        let rollNumber = await getRollNumber();

        // If no local roll number, try to fetch from backend
        if (!rollNumber) {
          try {
            const profile = await getMyProfile();
            if (profile && profile.roll_no) {
              rollNumber = profile.roll_no;
              await saveRollNumber(rollNumber);
            }
          } catch (e) {
            console.log("No profile found or failed to fetch", e);
          }
        }

        hasNavigated.current = true;
        if (!rollNumber) {
          router.replace("/onboarding");
        } else {
          router.replace("/(tabs)");
        }
      }

      setChecking(false);
    }

    checkNavigation();
  }, [isLoaded, isSignedIn]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}
