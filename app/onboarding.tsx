import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getUserDetails, isValidRollNumber, syncUser } from "../services/api";
import { getRollNumber, saveRollNumber } from "../services/storage";

export default function Onboarding() {
    const router = useRouter();
    const [rollNumber, setRollNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Simple fade animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const shakeError = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const navigateToHome = async () => {
        // Double-check roll number is saved before navigating
        const savedRoll = await getRollNumber();
        console.log("Navigating to home, saved roll:", savedRoll);

        if (savedRoll) {
            setIsNavigating(true);
            // Use a small delay to ensure state is settled
            setTimeout(() => {
                router.replace("/(tabs)");
            }, 100);
        } else {
            setError("Failed to save roll number. Please try again.");
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        Keyboard.dismiss();

        const trimmed = rollNumber.trim().toUpperCase();

        if (!trimmed) {
            setError("Please enter your roll number");
            shakeError();
            return;
        }

        if (!isValidRollNumber(trimmed)) {
            setError("Invalid format (e.g., 21BQ1A0501)");
            shakeError();
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Validate roll number exists
            await getUserDetails(trimmed);

            // Save roll number locally
            await saveRollNumber(trimmed);
            console.log("Roll number saved successfully:", trimmed);

            // Sync with backend (non-blocking)
            syncUser(trimmed).catch((syncError) => {
                console.error("Failed to sync user:", syncError);
            });

            // Navigate to home
            await navigateToHome();

        } catch (err: any) {
            console.error("Onboarding error:", err);
            setLoading(false);
            shakeError();

            if (err.status === 404) {
                setError("Roll number not found in system");
            } else if (err.message) {
                setError(err.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
        }
    };

    // Show loading screen while navigating
    if (isNavigating) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                    <Text style={styles.loadingText}>Loading your dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardView}
                >
                    {/* Background decorations */}
                    <View style={styles.bgCircle1} />
                    <View style={styles.bgCircle2} />

                    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <LinearGradient
                                colors={['#7C3AED', '#5B21B6']}
                                style={styles.iconBadge}
                            >
                                <Text style={styles.iconEmoji}>🎓</Text>
                            </LinearGradient>

                            <Text style={styles.headerTitle}>Welcome to QIK</Text>
                            <Text style={styles.headerSubtitle}>
                                Enter your roll number to get started
                            </Text>
                        </View>

                        {/* Input Card */}
                        <Animated.View
                            style={[
                                styles.cardContainer,
                                { transform: [{ translateX: shakeAnim }] }
                            ]}
                        >
                            <View style={styles.cardContent}>
                                <View style={styles.labelRow}>
                                    <Ionicons name="school-outline" size={18} color="#A1A1AA" />
                                    <Text style={styles.inputLabel}>Roll Number</Text>
                                </View>

                                <View style={[
                                    styles.inputContainer,
                                    isFocused && styles.inputFocused,
                                    error && styles.inputError
                                ]}>
                                    <TextInput
                                        value={rollNumber}
                                        onChangeText={(text) => {
                                            setRollNumber(text.toUpperCase());
                                            setError("");
                                        }}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        placeholder="21BQ1A0501"
                                        placeholderTextColor="#52525B"
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        style={styles.textInput}
                                        maxLength={12}
                                        editable={!loading}
                                    />
                                </View>

                                {error ? (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.hintText}>
                                        Format: YYBranchRollNo (e.g., 21BQ1A0501)
                                    </Text>
                                )}
                            </View>
                        </Animated.View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.85}
                            style={styles.buttonWrapper}
                        >
                            <LinearGradient
                                colors={loading ? ['#52525B', '#3F3F46'] : ['#7C3AED', '#5B21B6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.button}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <Text style={styles.buttonText}>Continue</Text>
                                        <Ionicons name="arrow-forward" size={20} color="white" />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footerInfo}>
                            <Ionicons name="shield-checkmark-outline" size={16} color="#52525B" />
                            <Text style={styles.footerText}>
                                Your data is securely stored on your device
                            </Text>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A12',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#A1A1AA',
        marginTop: 16,
    },

    // Background decorations
    bgCircle1: {
        position: 'absolute',
        top: 60,
        left: -80,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(124, 58, 237, 0.12)',
    },
    bgCircle2: {
        position: 'absolute',
        bottom: 100,
        right: -60,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
    },

    // Header
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconBadge: {
        width: 80,
        height: 80,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    iconEmoji: {
        fontSize: 40,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: '#A1A1AA',
        textAlign: 'center',
    },

    // Card
    cardContainer: {
        backgroundColor: 'rgba(30, 30, 50, 0.9)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 20,
    },
    cardContent: {
        padding: 24,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    inputLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#A1A1AA',
        marginLeft: 8,
    },
    inputContainer: {
        backgroundColor: 'rgba(15, 15, 26, 0.8)',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    inputFocused: {
        borderColor: 'rgba(124, 58, 237, 0.5)',
    },
    inputError: {
        borderColor: 'rgba(239, 68, 68, 0.5)',
    },
    textInput: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 22,
        color: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 18,
        textAlign: 'center',
        letterSpacing: 3,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#EF4444',
        marginLeft: 6,
    },
    hintText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        textAlign: 'center',
        marginTop: 12,
    },

    // Button
    buttonWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    button: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 17,
        color: '#FFFFFF',
        marginRight: 8,
    },

    // Footer
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        marginLeft: 6,
    },
});
