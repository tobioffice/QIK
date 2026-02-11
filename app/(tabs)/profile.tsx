import { useClerk, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { BRANCHES } from "../../constants";

import {
    ActivityIndicator,
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../../components/Skeleton";
import { getUserDetails, isValidRollNumber, syncUser } from "../../services/api";
import {
    clearAttendanceCache,
    clearMidmarksCache,
    clearRankCache,
    clearRollNumber,
    getRollNumber,
    saveRollNumber,
} from "../../services/storage";
import type { Student } from "../../types";

// Glass Card Component
function GlassCard({
    children,
    style,
    gradient
}: {
    children: React.ReactNode;
    style?: object;
    gradient?: [string, string];
}) {
    return (
        <View style={[styles.glassCard, style]}>
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={gradient || ['rgba(30, 30, 45, 0.85)', 'rgba(18, 18, 28, 0.95)']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassBorder} />
            <View style={styles.glassContent}>{children}</View>
        </View>
    );
}

// Info Row Component
function InfoRow({
    label,
    value,
    icon,
    iconColors,
    isLast = false
}: {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColors: [string, string];
    isLast?: boolean;
}) {
    return (
        <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
            <LinearGradient
                colors={iconColors}
                style={styles.infoIcon}
            >
                <Ionicons name={icon} size={18} color="#fff" />
            </LinearGradient>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

// Menu Item Component
function MenuItem({
    icon,
    label,
    sublabel,
    onPress,
    iconColors,
    danger = false,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sublabel?: string;
    onPress: () => void;
    iconColors: [string, string];
    danger?: boolean;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
        >
            <Animated.View style={[styles.menuItem, { transform: [{ scale: scaleAnim }] }]}>
                <LinearGradient
                    colors={iconColors}
                    style={styles.menuIcon}
                >
                    <Ionicons name={icon} size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.menuContent}>
                    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
                        {label}
                    </Text>
                    {sublabel && (
                        <Text style={styles.menuSublabel}>{sublabel}</Text>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </Animated.View>
        </TouchableOpacity>
    );
}

export default function ProfileScreen() {
    const { user } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();

    const [rollNumber, setRollNumber] = useState<string | null>(null);
    const [studentInfo, setStudentInfo] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [newRollNumber, setNewRollNumber] = useState("");
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const storedRollNo = await getRollNumber();
            if (storedRollNo) {
                setRollNumber(storedRollNo);
                setNewRollNumber(storedRollNo);
                const info = await getUserDetails(storedRollNo);
                setStudentInfo(info);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveRollNumber = async () => {
        const trimmed = newRollNumber.trim().toUpperCase();

        if (!isValidRollNumber(trimmed)) {
            setEditError("Invalid roll number format");
            return;
        }

        setSaving(true);
        setEditError("");

        try {
            const info = await getUserDetails(trimmed);
            await saveRollNumber(trimmed);

            // Clear all cached data since roll number changed
            await Promise.all([
                clearAttendanceCache(),
                clearMidmarksCache(),
                clearRankCache(),
            ]);

            // Sync with backend
            try {
                await syncUser(trimmed);
            } catch (syncErr) {
                console.error("Sync failed:", syncErr);
                // Continue as local save worked
            }

            setRollNumber(trimmed);
            setStudentInfo(info);
            setIsEditing(false);
        } catch (err: any) {
            if (err.status === 404) {
                setEditError("Roll number not found");
            } else {
                setEditError("Failed to update. Try again.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await clearRollNumber();
                        await signOut();
                        router.replace("/sign-in");
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <LinearGradient
                    colors={['rgba(124, 58, 237, 0.15)', 'transparent']}
                    style={styles.bgGradient}
                />
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Skeleton Header */}
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <Skeleton width={100} height={100} borderRadius={50} />
                        </View>
                        <Skeleton width={180} height={26} borderRadius={8} style={{ marginTop: 20 }} />
                        <Skeleton width={220} height={14} borderRadius={6} style={{ marginTop: 8 }} />

                        {/* Quick Stats Skeleton */}
                        <View style={[styles.quickStats, { marginTop: 24 }]}>
                            <View style={styles.statItem}>
                                <Skeleton width={40} height={18} borderRadius={6} />
                                <Skeleton width={30} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Skeleton width={50} height={18} borderRadius={6} />
                                <Skeleton width={45} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Skeleton width={30} height={18} borderRadius={6} />
                                <Skeleton width={50} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                            </View>
                        </View>
                    </View>

                    {/* Roll Number Card Skeleton */}
                    <View style={styles.skeletonCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <Skeleton width={40} height={40} borderRadius={12} />
                            <Skeleton width={100} height={18} borderRadius={6} style={{ marginLeft: 12 }} />
                        </View>
                        <Skeleton width="100%" height={60} borderRadius={16} />
                    </View>

                    {/* Student Details Card Skeleton */}
                    <View style={styles.skeletonCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <Skeleton width={40} height={40} borderRadius={12} />
                            <Skeleton width={130} height={18} borderRadius={6} style={{ marginLeft: 12 }} />
                        </View>
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} style={styles.skeletonInfoRow}>
                                <Skeleton width={40} height={40} borderRadius={12} />
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <Skeleton width="30%" height={12} borderRadius={4} />
                                    <Skeleton width="60%" height={15} borderRadius={4} style={{ marginTop: 6 }} />
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Background gradient */}
            <LinearGradient
                colors={['rgba(124, 58, 237, 0.15)', 'transparent']}
                style={styles.bgGradient}
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Header */}
                <View style={styles.header}>
                    {/* Avatar with glow */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarGlow} />
                        {user?.imageUrl ? (
                            <View style={styles.avatarWrapper}>
                                <Image
                                    source={{ uri: user.imageUrl }}
                                    style={styles.avatar}
                                />
                            </View>
                        ) : (
                            <LinearGradient
                                colors={['#7C3AED', '#06B6D4']}
                                style={styles.avatarPlaceholder}
                            >
                                <Ionicons name="person" size={40} color="#fff" />
                            </LinearGradient>
                        )}
                        <View style={styles.onlineIndicator} />
                    </View>

                    {/* Name and Email */}
                    <Text style={styles.userName}>
                        {user?.fullName || studentInfo?.name || "Student"}
                    </Text>
                    <Text style={styles.userEmail}>
                        {user?.primaryEmailAddress?.emailAddress}
                    </Text>

                    {/* Quick Stats */}
                    {studentInfo && (
                        <View style={styles.quickStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{studentInfo.year.slice(0, 1)}</Text>
                                <Text style={styles.statLabel}>Year</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{BRANCHES[studentInfo.branch as unknown as keyof typeof BRANCHES]}</Text>
                                <Text style={styles.statLabel}>Branch</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{studentInfo.section}</Text>
                                <Text style={styles.statLabel}>Section</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Roll Number Card */}
                <GlassCard>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <LinearGradient
                                colors={['#7C3AED', '#5B21B6']}
                                style={styles.sectionIcon}
                            >
                                <Ionicons name="id-card" size={18} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.sectionTitle}>Roll Number</Text>
                        </View>
                        {!isEditing && (
                            <TouchableOpacity
                                onPress={() => setIsEditing(true)}
                                style={styles.editButton}
                            >
                                <Ionicons name="pencil" size={14} color="#A78BFA" />
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isEditing ? (
                        <View>
                            <View style={[styles.inputContainer, editError && styles.inputError]}>
                                <TextInput
                                    value={newRollNumber}
                                    onChangeText={(text) => {
                                        setNewRollNumber(text.toUpperCase());
                                        setEditError("");
                                    }}
                                    placeholder="Enter roll number"
                                    placeholderTextColor="#52525B"
                                    autoCapitalize="characters"
                                    style={styles.input}
                                />
                            </View>
                            {editError && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                    <Text style={styles.errorText}>{editError}</Text>
                                </View>
                            )}
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsEditing(false);
                                        setNewRollNumber(rollNumber || "");
                                        setEditError("");
                                    }}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSaveRollNumber}
                                    disabled={saving}
                                    style={styles.saveButtonWrapper}
                                >
                                    <LinearGradient
                                        colors={saving ? ['#52525B', '#52525B'] : ['#7C3AED', '#5B21B6']}
                                        style={styles.saveButton}
                                    >
                                        {saving ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                                <Text style={styles.saveButtonText}>Save</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.rollDisplay}>
                            <LinearGradient
                                colors={['rgba(124, 58, 237, 0.2)', 'rgba(6, 182, 212, 0.1)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.rollBadge}
                            >
                                <Text style={styles.rollNumber}>{rollNumber || "Not set"}</Text>
                            </LinearGradient>
                        </View>
                    )}
                </GlassCard>

                {/* Student Details */}
                {studentInfo && (
                    <GlassCard>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.sectionIcon}
                                >
                                    <Ionicons name="school" size={18} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.sectionTitle}>Student Details</Text>
                            </View>
                        </View>

                        <View style={styles.infoList}>
                            <InfoRow
                                label="Full Name"
                                value={studentInfo.name}
                                icon="person"
                                iconColors={['#7C3AED', '#5B21B6']}
                            />
                            <InfoRow
                                label="Branch"
                                value={BRANCHES[studentInfo.branch as unknown as keyof typeof BRANCHES]}
                                icon="library"
                                iconColors={['#06B6D4', '#0891B2']}
                            />
                            <InfoRow
                                label="Year"
                                value={`Year ${studentInfo.year}`}
                                icon="calendar"
                                iconColors={['#F59E0B', '#D97706']}
                            />
                            <InfoRow
                                label="Section"
                                value={`Section ${studentInfo.section}`}
                                icon="grid"
                                iconColors={['#10B981', '#059669']}
                                isLast
                            />
                        </View>
                    </GlassCard>
                )}

                {/* Actions */}
                <View style={styles.actionsSection}>
                    <MenuItem
                        icon="log-out"
                        label="Sign Out"
                        sublabel="Log out of your account"
                        onPress={handleSignOut}
                        iconColors={['#EF4444', '#DC2626']}
                        danger
                    />
                </View>

                {/* Version */}
                <Text style={styles.version}>QIK v1.0.1</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A12',
    },
    bgGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 400,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0A0A12',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingGradient: {
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: 'Inter_500Medium',
        color: '#A1A1AA',
        marginTop: 16,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    scrollContent: {
        paddingBottom: 120,
    },

    // Header styles
    header: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderRadius: 60,
        backgroundColor: 'rgba(124, 58, 237, 0.3)',
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#7C3AED',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10B981',
        borderWidth: 3,
        borderColor: '#0A0A12',
    },
    userName: {
        fontFamily: 'Inter_700Bold',
        fontSize: 26,
        color: '#FFFFFF',
        marginTop: 20,
    },
    userEmail: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#A1A1AA',
        marginTop: 4,
    },
    quickStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    statValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    statLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },

    // Glass Card styles
    glassCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 16,
    },
    glassBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    glassContent: {
        padding: 20,
    },

    // Section styles
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    editButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#A78BFA',
        marginLeft: 4,
    },

    // Roll Number styles
    rollDisplay: {
        marginTop: 4,
    },
    rollBadge: {
        paddingVertical: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    rollNumber: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: '#FFFFFF',
        letterSpacing: 3,
    },

    // Input styles
    inputContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    input: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        letterSpacing: 2,
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
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: '#A1A1AA',
    },
    saveButtonWrapper: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
    },
    saveButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: '#FFFFFF',
    },

    // Info List styles
    infoList: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    infoRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
    },
    infoValue: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: '#FFFFFF',
        marginTop: 2,
    },

    // Actions styles
    actionsSection: {
        marginTop: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    menuIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    menuContent: {
        flex: 1,
    },
    menuLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    menuLabelDanger: {
        color: '#EF4444',
    },
    menuSublabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        marginTop: 2,
    },

    // Version
    version: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        textAlign: 'center',
        marginTop: 32,
    },

    // Skeleton loading styles
    skeletonCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    skeletonInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
});
