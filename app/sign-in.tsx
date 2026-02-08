import { useOAuth } from "@clerk/clerk-expo";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import * as Linking from "expo-linking";
import { useWarmUpBrowser } from "../hooks/useWarmUpBrowser";

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");

export default function SignIn() {
    useWarmUpBrowser();

    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);

    const onFetchUpdateAsync = async () => {
        try {
            setIsUpdating(true);
            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
            } else {
                Alert.alert("No Updates", "You are already on the latest version.");
            }
        } catch (error) {
            Alert.alert("Error", `Error fetching update: ${error}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const onGoogleSignIn = useCallback(async () => {
        try {
            const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
                redirectUrl: Linking.createURL("oauth-redirect", { scheme: "qik" }),
            });

            if (createdSessionId) {
                // Wait for the session to be set before navigating
                setActive && await setActive({ session: createdSessionId });
                router.replace("/");
            } else {
                // Use signIn or signUp for next steps such as MFA
            }
        } catch (err: any) {
            console.error("OAuth error:", err);

            let title = "Authentication Failed";
            let message = "An unexpected error occurred.";

            if (err?.errors?.[0]?.message) {
                // Handle Clerk API errors
                message = err.errors[0].message;
                if (err.errors[0].longMessage) {
                    message += `\n\n${err.errors[0].longMessage}`;
                }
            } else if (err instanceof Error) {
                message = err.message;
            } else if (typeof err === "string") {
                message = err;
            } else {
                message = JSON.stringify(err, null, 2);
            }

            Alert.alert(title, message, [{ text: "OK" }]);
        }
    }, [startOAuthFlow, router]);

    return (
        <View className="flex-1 bg-background">
            {/* Background gradient orbs */}
            <View style={styles.gradientOrb1} />
            <View style={styles.gradientOrb2} />

            {/* Illustration Container */}
            <View className="flex-1 items-center justify-center px-6 pt-16">
                <Image
                    source={require("../assets/illustration.svg")}
                    style={{
                        width: width * 0.85,
                        height: height * 0.38,
                    }}
                    contentFit="contain"
                />
            </View>

            {/* Bottom Section */}
            <View className="px-6 pb-12">
                {/* Welcome Text */}
                <View className="items-center mb-10">
                    <Text
                        style={{ fontFamily: 'Inter_700Bold' }}
                        className="text-white text-4xl mb-3"
                    >
                        Welcome to QIK
                    </Text>
                    <Text
                        style={{ fontFamily: 'Inter_400Regular' }}
                        className="text-text-secondary text-center text-base leading-6"
                    >
                        Track your attendance, marks, and{'\n'}compete with your peers.
                    </Text>
                </View>

                {/* Google Sign In Button */}
                <TouchableOpacity
                    onPress={onGoogleSignIn}
                    activeOpacity={0.9}
                    className="rounded-2xl overflow-hidden mb-4"
                >
                    <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View
                        className="flex-row items-center justify-center"
                        style={{ paddingVertical: 18, paddingHorizontal: 24 }}
                    >
                        <Image
                            source={{
                                uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
                            }}
                            style={{ width: 24, height: 24, marginRight: 14 }}
                            contentFit="contain"
                        />
                        <Text
                            style={{ fontFamily: 'Inter_600SemiBold' }}
                            className="text-gray-800 text-lg"
                        >
                            Continue with Google
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Manual Update Button */}
                <TouchableOpacity
                    onPress={onFetchUpdateAsync}
                    disabled={isUpdating}
                    className="items-center justify-center py-2"
                >
                    {isUpdating ? (
                        <ActivityIndicator color="#6C63FF" />
                    ) : (
                        <Text className="text-text-muted text-xs">
                            Check for Updates
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Terms */}
                <Text
                    style={{ fontFamily: 'Inter_400Regular' }}
                    className="text-text-muted text-center text-xs mt-4"
                >
                    By continuing, you agree to our Terms of Service{'\n'}and Privacy Policy
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    gradientOrb1: {
        position: 'absolute',
        top: 100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
    },
    gradientOrb2: {
        position: 'absolute',
        top: 200,
        right: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
    },
});
