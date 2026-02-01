import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
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
import { saveRollNumber } from "../services/storage";

export default function Onboarding() {
    const router = useRouter();
    const [rollNumber, setRollNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Animations
    const headerAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Staggered entrance animation
        Animated.stagger(150, [
            Animated.spring(headerAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }),
            Animated.spring(cardAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }),
            Animated.spring(buttonAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }),
        ]).start();
    }, []);

    const shakeError = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleSubmit = async () => {
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
            await getUserDetails(trimmed);
            await saveRollNumber(trimmed);
            // Sync roll number with backend to persist across devices
            try {
                await syncUser(trimmed);
            } catch (syncError) {
                console.error("Failed to sync user:", syncError);
                // Continue anyway - functionality works locally
            }
            router.replace("/(tabs)");
        } catch (err: any) {
            console.error("Onboarding error:", err);
            shakeError();
            if (err.status === 404) {
                setError("Roll number not found in system");
            } else if (err.message) {
                setError(err.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardView}
                >
                    {/* Background gradient orbs */}
                    <View style={styles.gradientOrb1} />
                    <View style={styles.gradientOrb2} />
                    <View style={styles.gradientOrb3} />

                    <View style={styles.content}>
                        {/* Header */}
                        <Animated.View
                            style={[
                                styles.headerContainer,
                                {
                                    opacity: headerAnim,
                                    transform: [{
                                        translateY: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-30, 0],
                                        })
                                    }]
                                }
                            ]}
                        >
                            {/* Icon with glow */}
                            <View style={styles.iconContainer}>
                                <View style={styles.iconGlow} />
                                <LinearGradient
                                    colors={['#7C3AED', '#5B21B6']}
                                    style={styles.iconBadge}
                                >
                                    <Text style={styles.iconEmoji}>🎓</Text>
                                </LinearGradient>
                            </View>

                            <Text style={styles.headerTitle}>
                                Enter Roll Number
                            </Text>
                            <Text style={styles.headerSubtitle}>
                                We'll fetch your attendance and marks
                            </Text>
                        </Animated.View>

                        {/* Input Card */}
                        <Animated.View
                            style={[
                                styles.cardContainer,
                                {
                                    opacity: cardAnim,
                                    transform: [
                                        {
                                            translateY: cardAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [30, 0],
                                            })
                                        },
                                        { translateX: shakeAnim }
                                    ]
                                }
                            ]}
                        >
                            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={['rgba(30, 30, 50, 0.85)', 'rgba(20, 20, 35, 0.95)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.glassBorder} />

                            <View style={styles.cardContent}>
                                {/* Label */}
                                <View style={styles.labelRow}>
                                    <Ionicons name="school-outline" size={18} color="#A1A1AA" />
                                    <Text style={styles.inputLabel}>Roll Number</Text>
                                </View>

                                {/* Input */}
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
                                    />
                                </View>

                                {/* Error message */}
                                {error ? (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.hintText}>
                                        Format: YYBranchRollNo
                                    </Text>
                                )}
                            </View>
                        </Animated.View>

                        {/* Submit Button */}
                        <Animated.View
                            style={{
                                opacity: buttonAnim,
                                transform: [{
                                    translateY: buttonAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [30, 0],
                                    })
                                }]
                            }}
                        >
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
                                    style={[styles.button, !loading && styles.buttonGlow]}
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
                        </Animated.View>

                        {/* Footer info */}
                        <Animated.View style={{ opacity: buttonAnim }}>
                            <View style={styles.footerInfo}>
                                <Ionicons name="shield-checkmark-outline" size={16} color="#52525B" />
                                <Text style={styles.footerText}>
                                    Your data is securely stored on your device
                                </Text>
                            </View>
                        </Animated.View>
                    </View>
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

    // Background orbs
    gradientOrb1: {
        position: 'absolute',
        top: 80,
        left: -100,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: 'rgba(124, 58, 237, 0.12)',
    },
    gradientOrb2: {
        position: 'absolute',
        bottom: 150,
        right: -100,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
    },
    gradientOrb3: {
        position: 'absolute',
        top: '40%',
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(124, 58, 237, 0.06)',
    },

    // Header
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        position: 'relative',
        marginBottom: 24,
    },
    iconGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderRadius: 50,
        backgroundColor: 'rgba(124, 58, 237, 0.25)',
    },
    iconBadge: {
        width: 80,
        height: 80,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
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
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
    },
    glassBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
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
    buttonGlow: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
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
