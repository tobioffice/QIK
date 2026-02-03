import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { getAttendance, getMidmarks } from "../../services/api";
import { getRollNumber } from "../../services/storage";
import type { Attendance, Midmarks } from "../../types";
import { HomeLoadingSkeleton } from "../../components/HomeLoadingSkeleton";

// Glass Card Component with enhanced styling
function GlassCard({
    children,
    style,
    noPadding = false
}: {
    children: React.ReactNode;
    style?: object;
    noPadding?: boolean;
}) {
    return (
        <View style={[styles.glassCard, style]}>
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={['rgba(30, 30, 45, 0.85)', 'rgba(18, 18, 28, 0.95)']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassBorder} />
            <View style={noPadding ? undefined : styles.glassContent}>{children}</View>
        </View>
    );
}

// Animated Circular Progress
function CircularProgress({
    percentage,
    size = 160,
    strokeWidth = 12
}: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
}) {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: percentage,
            duration: 1500,
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    const getColor = () => {
        if (percentage >= 75) return { start: '#10B981', end: '#059669' };
        if (percentage >= 65) return { start: '#F59E0B', end: '#D97706' };
        return { start: '#EF4444', end: '#DC2626' };
    };

    const colors = getColor();
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <View style={[styles.circularContainer, { width: size, height: size }]}>
            {/* Glow effect */}
            <View style={[styles.progressGlow, {
                backgroundColor: colors.start,
                shadowColor: colors.start,
            }]} />

            <Svg width={size} height={size} style={styles.svgContainer}>
                <Defs>
                    <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.start} />
                        <Stop offset="100%" stopColor={colors.end} />
                    </SvgGradient>
                </Defs>

                {/* Background circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Progress circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>

            {/* Center content */}
            <View style={styles.circularCenter}>
                <Text style={[styles.percentageText, { color: colors.start }]}>
                    {percentage.toFixed(0)}
                </Text>
                <Text style={styles.percentLabel}>percent</Text>
            </View>
        </View>
    );
}

// Attendance Card Component
function AttendanceCard({ attendance }: { attendance: Attendance | null }) {
    if (!attendance || typeof attendance.percentage !== 'number') return null;

    const percentage = attendance.percentage;
    const getStatusInfo = () => {
        if (percentage >= 75) return { color: '#10B981', status: 'On Track', icon: 'checkmark-circle' };
        if (percentage >= 65) return { color: '#F59E0B', status: 'Warning', icon: 'alert-circle' };
        return { color: '#EF4444', status: 'Critical', icon: 'close-circle' };
    };
    const statusInfo = getStatusInfo();

    return (
        <GlassCard>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                    <LinearGradient
                        colors={[statusInfo.color, statusInfo.color + '80']}
                        style={styles.cardIcon}
                    >
                        <Ionicons name="calendar" size={20} color="#fff" />
                    </LinearGradient>
                    <View>
                        <Text style={styles.cardTitle}>Attendance</Text>
                        <View style={styles.statusBadge}>
                            <Ionicons name={statusInfo.icon as any} size={12} color={statusInfo.color} />
                            <Text style={[styles.statusText, { color: statusInfo.color }]}>
                                {statusInfo.status}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Circular Progress */}
            <View style={styles.progressSection}>
                <CircularProgress percentage={percentage} />
                <Text style={styles.classesInfo}>
                    {attendance.totalClasses.attended} of {attendance.totalClasses.conducted} classes
                </Text>
            </View>

            {/* Subject Breakdown */}
            <View style={styles.subjectsContainer}>
                <Text style={styles.subjectsTitle}>Subject Breakdown</Text>
                {attendance.subjects.slice(0, 5).map((subject, index) => {
                    const subjectPercent = (subject.attended / subject.conducted) * 100 || 0;
                    const barColor =
                        subjectPercent >= 75
                            ? '#10B981'
                            : subjectPercent >= 65
                                ? '#F59E0B'
                                : '#EF4444';

                    return (
                        <View key={index} style={styles.subjectRow}>
                            <View style={styles.subjectInfo}>
                                <Text style={styles.subjectName} numberOfLines={1}>
                                    {subject.subject}
                                </Text>
                                <Text style={styles.subjectClasses}>
                                    {subject.attended}/{subject.conducted}
                                </Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBarBg}>
                                    <LinearGradient
                                        colors={[barColor, barColor + 'CC']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressBarFill, { width: `${Math.min(subjectPercent, 100)}%` }]}
                                    />
                                </View>
                                <Text style={[styles.subjectPercent, { color: barColor }]}>
                                    {subjectPercent.toFixed(0)}%
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        </GlassCard>
    );
}

// Midmarks Card Component
function MidmarksCard({ midmarks }: { midmarks: Midmarks | null }) {
    if (!midmarks) return null;

    return (
        <GlassCard noPadding>
            {/* Header */}
            <View style={[styles.cardHeader, { padding: 20, paddingBottom: 12 }]}>
                <View style={styles.cardTitleRow}>
                    <LinearGradient
                        colors={['#7C3AED', '#5B21B6']}
                        style={styles.cardIcon}
                    >
                        <Ionicons name="school" size={20} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.cardTitle}>Mid Marks</Text>
                </View>
            </View>

            {/* Subject Marks Table */}
            <View style={styles.marksTable}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Subject</Text>
                    <Text style={[styles.tableHeaderText, styles.markColumn]}>M1</Text>
                    <Text style={[styles.tableHeaderText, styles.markColumn]}>M2</Text>
                    <Text style={[styles.tableHeaderText, styles.avgColumn]}>Avg</Text>
                </View>

                {/* Table Rows */}
                {midmarks.subjects.map((subject, index) => {
                    const getMarkColor = (marks: number | null) => {
                        if (marks === null) return '#52525B';
                        if (marks >= 22.5) return '#10B981';
                        if (marks >= 15) return '#F59E0B';
                        return '#EF4444';
                    };

                    const isLast = index === midmarks.subjects.length - 1;

                    return (
                        <View
                            key={index}
                            style={[styles.tableRow, !isLast && styles.tableRowBorder]}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.subjectNameTable} numberOfLines={1}>
                                    {subject.subject}
                                </Text>
                                <Text style={styles.subjectType}>{subject.type}</Text>
                            </View>
                            <Text style={[styles.markValue, { color: getMarkColor(subject.M1) }]}>
                                {subject.M1 ?? "-"}
                            </Text>
                            <Text style={[styles.markValue, { color: getMarkColor(subject.M2) }]}>
                                {subject.M2 ?? "-"}
                            </Text>
                            <View style={styles.avgBadge}>
                                <Text style={styles.avgValue}>
                                    {subject.average?.toFixed(1) ?? "-"}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        </GlassCard>
    );
}

// Error Card Component
function ErrorCard({ icon, message }: { icon: string; message: string }) {
    return (
        <GlassCard>
            <View style={styles.errorContent}>
                <View style={styles.errorIcon}>
                    <Text style={{ fontSize: 24 }}>{icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.errorText}>{message}</Text>
                    <Text style={styles.errorSubtext}>Pull to refresh</Text>
                </View>
                <Ionicons name="refresh" size={20} color="#52525B" />
            </View>
        </GlassCard>
    );
}

export default function HomeScreen() {
    const { user } = useUser();
    const [rollNumber, setRollNumber] = useState<string | null>(null);
    const [attendance, setAttendance] = useState<Attendance | null>(null);
    const [midmarks, setMidmarks] = useState<Midmarks | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [attendanceError, setAttendanceError] = useState("");
    const [midmarksError, setMidmarksError] = useState("");

    const fetchData = useCallback(async () => {
        const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
            const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), ms)
            );
            return Promise.race([promise, timeout]);
        };

        try {
            const storedRollNo = await getRollNumber();
            if (!storedRollNo) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            setRollNumber(storedRollNo);
            setAttendanceError("");
            setMidmarksError("");

            const [attendanceResult, midmarksResult] = await Promise.allSettled([
                withTimeout(getAttendance(storedRollNo), 30000),
                withTimeout(getMidmarks(storedRollNo), 30000),
            ]);

            if (attendanceResult.status === 'fulfilled') {
                const data = attendanceResult.value;
                if (data && typeof data.percentage === 'number' && data.totalClasses && data.subjects) {
                    setAttendance(data);
                } else {
                    setAttendance(null);
                    setAttendanceError("Attendance data unavailable");
                }
            } else {
                setAttendance(null);
                const errorMessage = attendanceResult.reason?.message || "Attendance data unavailable";
                setAttendanceError(errorMessage);
            }

            if (midmarksResult.status === 'fulfilled') {
                const data = midmarksResult.value;
                if (data && data.subjects) {
                    setMidmarks(data);
                } else {
                    setMidmarks(null);
                    setMidmarksError("Midmarks data unavailable");
                }
            } else {
                setMidmarks(null);
                const errorMessage = midmarksResult.reason?.message || "Midmarks data unavailable";
                setMidmarksError(errorMessage);
            }
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <HomeLoadingSkeleton />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Background gradient */}
            <LinearGradient
                colors={['rgba(124, 58, 237, 0.1)', 'transparent']}
                style={styles.bgGradient}
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#7C3AED"
                        colors={["#7C3AED"]}
                    />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>{getGreeting()},</Text>
                    <Text style={styles.userName}>
                        {user?.firstName || "Student"} 👋
                    </Text>
                    {rollNumber && (
                        <View style={styles.rollBadgeContainer}>
                            <LinearGradient
                                colors={['#7C3AED', '#06B6D4']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.rollBadge}
                            >
                                <Ionicons name="id-card" size={14} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.rollText}>{rollNumber}</Text>
                            </LinearGradient>
                        </View>
                    )}
                </View>

                {/* Attendance Card or Error */}
                {attendanceError ? (
                    <ErrorCard icon="📊" message={attendanceError} />
                ) : (
                    <AttendanceCard attendance={attendance} />
                )}

                {/* Midmarks Card or Error */}
                {midmarksError ? (
                    <ErrorCard icon="📝" message={midmarksError} />
                ) : (
                    <MidmarksCard midmarks={midmarks} />
                )}
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
        height: 300,
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
        paddingVertical: 24,
    },
    greeting: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#A1A1AA',
    },
    userName: {
        fontFamily: 'Inter_700Bold',
        fontSize: 32,
        color: '#FFFFFF',
        marginTop: 4,
    },
    rollBadgeContainer: {
        flexDirection: 'row',
        marginTop: 12,
    },
    rollBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    rollText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: '#FFFFFF',
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

    // Card Header styles
    cardHeader: {
        marginBottom: 16,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        marginLeft: 4,
    },

    // Circular Progress styles
    progressSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    circularContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    svgContainer: {
        transform: [{ rotate: '-90deg' }],
    },
    progressGlow: {
        position: 'absolute',
        width: '80%',
        height: '80%',
        borderRadius: 100,
        opacity: 0.15,
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 10,
    },
    circularCenter: {
        position: 'absolute',
        alignItems: 'center',
    },
    percentageText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 44,
    },
    percentLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#A1A1AA',
        marginTop: -4,
    },
    classesInfo: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#A1A1AA',
        marginTop: 16,
    },

    // Subjects styles
    subjectsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
    },
    subjectsTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#A1A1AA',
        marginBottom: 16,
    },
    subjectRow: {
        marginBottom: 14,
    },
    subjectInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    subjectName: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#FFFFFF',
        flex: 1,
    },
    subjectClasses: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 3,
        overflow: 'hidden',
        marginRight: 10,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    subjectPercent: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        width: 42,
        textAlign: 'right',
    },

    // Midmarks Table styles
    marksTable: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    tableHeaderText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: '#52525B',
        textTransform: 'uppercase',
    },
    markColumn: {
        width: 44,
        textAlign: 'center',
    },
    avgColumn: {
        width: 54,
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    tableRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    subjectNameTable: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#FFFFFF',
    },
    subjectType: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        color: '#52525B',
        marginTop: 2,
    },
    markValue: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        width: 44,
        textAlign: 'center',
    },
    avgBadge: {
        width: 54,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        alignItems: 'center',
    },
    avgValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: '#A78BFA',
    },

    // Error Card styles
    errorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#F59E0B',
    },
    errorSubtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        marginTop: 2,
    },
});
