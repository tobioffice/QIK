import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    Animated,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Skeleton } from "../../components/Skeleton";
import { BRANCHES } from "../../constants";
import { getLeaderboard } from "../../services/api";
import { getRollNumber } from "../../services/storage";
import type { LeaderboardEntry, LeaderboardParams } from "../../types";

// Filter options
const YEAR_OPTIONS = [
    { label: "All Years", value: "all" },
    { label: "1st Year", value: "12" },
    { label: "2nd Year", value: "22" },
    { label: "3rd Year", value: "32" },
    { label: "4th Year", value: "42" },
];


const BRANCH_OPTIONS = [
    { label: "All Branches", value: "all" },
    ...Object.entries(BRANCHES).map(([id, name]) => ({
        label: name,
        value: id,
    })),
];

const SECTION_OPTIONS = [
    { label: "All Sections", value: "all" },
    { label: "-", value: "-" },
    ...Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i)).map(
        (char) => ({ label: `Section ${char}`, value: char })
    ),
];

// Filter Chip Component
function FilterChip({
    label,
    value,
    isActive,
    onPress,
}: {
    label: string;
    value: string;
    isActive: boolean;
    onPress: () => void;
}) {
    const getDisplayText = () => {
        if (value === "all") return label;
        if (label === "Branch") {
            // For branches, if value is numeric ID, try to find name, else show value
            const branch = BRANCH_OPTIONS.find(b => b.value === value);
            return branch ? branch.label : value;
        }
        if (label === "Year") {
            // Map 12->1st, 22->2nd etc
            if (value === "12") return "1st Yr";
            if (value === "22") return "2nd Yr";
            if (value === "32") return "3rd Yr";
            if (value === "42") return "4th Yr";
            return value;
        }
        return value;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.filterChip}
        >
            {isActive && (
                <LinearGradient
                    colors={['#7C3AED', '#5B21B6']}
                    style={StyleSheet.absoluteFill}
                />
            )}
            <BlurView
                intensity={isActive ? 0 : 20}
                tint="dark"
                style={StyleSheet.absoluteFill}
            />
            <View style={[styles.filterChipBorder, isActive && styles.filterChipBorderActive]} />
            <View style={styles.filterChipContent}>
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {getDisplayText()}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={14}
                    color={isActive ? "#fff" : "#71717A"}
                    style={{ marginLeft: 4 }}
                />
            </View>
        </TouchableOpacity>
    );
}

// Filter Modal Component
function FilterModal({
    visible,
    title,
    options,
    selectedValue,
    onSelect,
    onClose,
}: {
    visible: boolean;
    title: string;
    options: { label: string; value: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
    onClose: () => void;
}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalBorder} />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <ScrollView style={styles.modalOptions}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.modalOption,
                                        selectedValue === option.value && styles.modalOptionSelected,
                                    ]}
                                    onPress={() => {
                                        onSelect(option.value);
                                        onClose();
                                    }}
                                >
                                    {selectedValue === option.value && (
                                        <LinearGradient
                                            colors={['rgba(124, 58, 237, 0.3)', 'rgba(124, 58, 237, 0.1)']}
                                            style={StyleSheet.absoluteFill}
                                        />
                                    )}
                                    <Text style={[
                                        styles.modalOptionText,
                                        selectedValue === option.value && styles.modalOptionTextSelected,
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {selectedValue === option.value && (
                                        <Ionicons name="checkmark" size={20} color="#7C3AED" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

// Filter Bar Component
function FilterBar({
    year,
    branch,
    section,
    onYearPress,
    onBranchPress,
    onSectionPress,
}: {
    year: string;
    branch: string;
    section: string;
    onYearPress: () => void;
    onBranchPress: () => void;
    onSectionPress: () => void;
}) {
    return (
        <View style={styles.filterBar}>
            <View style={styles.filterBarContent}>
                <View style={{ flex: 1 }}>
                    <FilterChip
                        label="Year"
                        value={year}
                        isActive={year !== "all"}
                        onPress={onYearPress}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <FilterChip
                        label="Branch"
                        value={branch}
                        isActive={branch !== "all"}
                        onPress={onBranchPress}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <FilterChip
                        label="Section"
                        value={section}
                        isActive={section !== "all"}
                        onPress={onSectionPress}
                    />
                </View>
            </View>
        </View>
    );
}

// Enhanced Rank Badge with animations and premium styling
function RankBadge({ rank }: { rank: number }) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (rank <= 3) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.08,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [rank]);

    if (rank === 1) {
        return (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.rankBadgeShadowGold}>
                    <LinearGradient
                        colors={['#FFD700', '#FFA500', '#FF8C00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.rankBadge}
                    >
                        <Text style={styles.crownEmoji}>👑</Text>
                        <Text style={styles.rankNumber}>1</Text>
                    </LinearGradient>
                </View>
            </Animated.View>
        );
    }

    if (rank === 2) {
        return (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.rankBadgeShadowSilver}>
                    <LinearGradient
                        colors={['#E8E8E8', '#C0C0C0', '#A8A8A8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.rankBadge}
                    >
                        <Text style={styles.medalEmoji}>🥈</Text>
                    </LinearGradient>
                </View>
            </Animated.View>
        );
    }

    if (rank === 3) {
        return (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.rankBadgeShadowBronze}>
                    <LinearGradient
                        colors={['#CD7F32', '#B87333', '#A0522D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.rankBadge}
                    >
                        <Text style={styles.medalEmoji}>🥉</Text>
                    </LinearGradient>
                </View>
            </Animated.View>
        );
    }

    // Regular rank badge for positions 4+
    return (
        <View style={styles.regularBadge}>
            <Text style={styles.regularRankText}>{rank}</Text>
        </View>
    );
}

// Enhanced Leaderboard Row
function LeaderboardRow({
    item,
    rank,
    isCurrentUser,
    sortBy,
}: {
    item: LeaderboardEntry;
    rank: number;
    isCurrentUser: boolean;
    sortBy: "attendance" | "midmarks";
}) {
    const value =
        sortBy === "attendance"
            ? item.attendance_percentage
            : item.mid_marks_avg;

    const getValueColor = () => {
        if (value === null) return '#52525B';
        if (sortBy === "attendance") {
            if (value >= 75) return '#10B981';
            if (value >= 65) return '#F59E0B';
            return '#EF4444';
        } else {
            if (value >= 22.5) return '#10B981';
            if (value >= 15) return '#F59E0B';
            return '#EF4444';
        }
    };

    const isTopThree = rank <= 3;

    return (
        <View style={[
            styles.rowContainer,
            isTopThree && styles.topThreeRow,
            isCurrentUser && styles.currentUserRow,
        ]}>
            {/* Background gradient for top 3 */}
            {isTopThree && (
                <LinearGradient
                    colors={
                        rank === 1
                            ? ['rgba(255, 215, 0, 0.15)', 'rgba(255, 140, 0, 0.05)']
                            : rank === 2
                                ? ['rgba(192, 192, 192, 0.12)', 'rgba(168, 168, 168, 0.03)']
                                : ['rgba(205, 127, 50, 0.12)', 'rgba(160, 82, 45, 0.03)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            )}

            {/* Current user gradient overlay */}
            {isCurrentUser && (
                <LinearGradient
                    colors={['rgba(124, 58, 237, 0.25)', 'rgba(6, 182, 212, 0.15)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            )}

            <BlurView intensity={isCurrentUser ? 35 : 18} tint="dark" style={StyleSheet.absoluteFill} />

            {/* Glass border */}
            <View style={[
                styles.glassBorder,
                isCurrentUser && styles.currentUserBorder,
                isTopThree && !isCurrentUser && styles.topThreeBorder,
            ]} />

            {/* Current user indicator */}
            {isCurrentUser && (
                <View style={styles.currentUserIndicator}>
                    <LinearGradient
                        colors={['#7C3AED', '#06B6D4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </View>
            )}

            <View style={styles.rowContent}>
                <RankBadge rank={rank} />

                <View style={styles.nameContainer}>
                    <Text style={styles.nameText} numberOfLines={1}>
                        {item.name || item.roll_no}
                    </Text>
                    <Text style={styles.rollText}>
                        {item.roll_no}
                        {isCurrentUser && (
                            <Text style={styles.youBadge}> • YOU</Text>
                        )}
                    </Text>
                </View>

                <View style={styles.valueContainer}>
                    <Text style={[styles.valueText, { color: getValueColor() }]}>
                        {value?.toFixed(1) ?? "-"}
                        <Text style={styles.valueSuffix}>
                            {sortBy === "attendance" ? "%" : ""}
                        </Text>
                    </Text>
                    <Text style={styles.valueLabel}>
                        {sortBy === "attendance" ? "Attendance" : "Mid Avg"}
                    </Text>
                </View>
            </View>
        </View>
    );
}

// Toggle Button Component
function ToggleButton({
    sortBy,
    onToggle,
}: {
    sortBy: "attendance" | "midmarks";
    onToggle: (value: "attendance" | "midmarks") => void;
}) {
    const slideAnim = useRef(new Animated.Value(sortBy === "attendance" ? 0 : 1)).current;
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: sortBy === "attendance" ? 0 : 1,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
        }).start();
    }, [sortBy]);

    const indicatorWidth = (containerWidth - 8) / 2; // Half width minus padding

    return (
        <View
            style={styles.toggleContainer}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.glassBorder} />

            <View style={styles.toggleInner}>
                {/* Animated sliding indicator */}
                {containerWidth > 0 && (
                    <Animated.View
                        style={[
                            styles.toggleIndicator,
                            {
                                width: indicatorWidth,
                                transform: [{
                                    translateX: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [4, indicatorWidth + 4],
                                    }),
                                }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={['#7C3AED', '#5B21B6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                        />
                        <View style={styles.toggleIndicatorGlow} />
                    </Animated.View>
                )}

                <TouchableOpacity
                    onPress={() => onToggle("attendance")}
                    style={styles.toggleButton}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="calendar"
                        size={18}
                        color={sortBy === "attendance" ? "#fff" : "#71717A"}
                        style={styles.toggleIcon}
                    />
                    <Text style={[
                        styles.toggleText,
                        sortBy === "attendance" ? styles.toggleTextActive : styles.toggleTextInactive
                    ]}>
                        Attendance
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onToggle("midmarks")}
                    style={styles.toggleButton}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="school"
                        size={18}
                        color={sortBy === "midmarks" ? "#fff" : "#71717A"}
                        style={styles.toggleIcon}
                    />
                    <Text style={[
                        styles.toggleText,
                        sortBy === "midmarks" ? styles.toggleTextActive : styles.toggleTextInactive
                    ]}>
                        Mid Marks
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function LeaderboardScreen() {
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userRollNo, setUserRollNo] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"attendance" | "midmarks">("attendance");
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const pageRef = useRef(1);

    // Filter states
    const [year, setYear] = useState("all");
    const [branch, setBranch] = useState("all");
    const [section, setSection] = useState("all");
    const [yearModalVisible, setYearModalVisible] = useState(false);
    const [branchModalVisible, setBranchModalVisible] = useState(false);
    const [sectionModalVisible, setSectionModalVisible] = useState(false);

    const fetchData = useCallback(
        async (reset = false) => {
            // Prevent duplicate requests
            if (loadingMore && !reset) return;

            try {
                const rollNo = await getRollNumber();
                setUserRollNo(rollNo?.toUpperCase() || null);

                if (reset) {
                    pageRef.current = 1;
                    setLoading(true);
                } else {
                    setLoadingMore(true);
                }

                const params: LeaderboardParams = {
                    page: pageRef.current,
                    limit: 50,
                    sort: sortBy,
                    year: year !== "all" ? year : undefined,
                    branch: branch !== "all" ? branch : undefined,
                    section: section !== "all" ? section : undefined,
                };

                const response = await getLeaderboard(params);
                const newData = response.data || [];

                if (reset) {
                    setData(newData);
                } else {
                    // Only append if we have new data and it's not a duplicate
                    setData((prev) => {
                        const existingRolls = new Set(prev.map(item => item.roll_no));
                        const uniqueNew = newData.filter(item => !existingRolls.has(item.roll_no));
                        return [...prev, ...uniqueNew];
                    });
                }

                setHasMore(newData.length === params.limit);
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
            } finally {
                setLoading(false);
                setRefreshing(false);
                setLoadingMore(false);
            }
        },
        [sortBy, loadingMore, year, branch, section]
    );

    useEffect(() => {
        pageRef.current = 1;
        fetchData(true);
    }, [sortBy, year, branch, section]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        pageRef.current = 1;
        fetchData(true);
    }, [fetchData]);

    const loadMore = () => {
        if (!loading && !loadingMore && hasMore) {
            pageRef.current += 1;
            fetchData(false);
        }
    };

    if (loading && data.length === 0) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['rgba(124, 58, 237, 0.15)', 'transparent']}
                    style={styles.bgGradient}
                />
                <SafeAreaView style={styles.safeArea} edges={["top"]}>
                    {/* Skeleton Header */}
                    <View style={styles.headerContainer}>
                        <View style={styles.headerContent}>
                            <Skeleton width={56} height={56} borderRadius={18} />
                            <View style={styles.headerTextContainer}>
                                <Skeleton width={180} height={28} borderRadius={8} />
                                <Skeleton width={140} height={14} borderRadius={6} style={{ marginTop: 8 }} />
                            </View>
                        </View>
                    </View>

                    {/* Skeleton Toggle */}
                    <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                        <Skeleton width="100%" height={52} borderRadius={16} />
                    </View>

                    {/* Skeleton Rows */}
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <View key={i} style={styles.skeletonRow}>
                            <Skeleton width={48} height={48} borderRadius={16} />
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Skeleton width="70%" height={16} borderRadius={6} />
                                <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Skeleton width={60} height={22} borderRadius={6} />
                                <Skeleton width={50} height={10} borderRadius={4} style={{ marginTop: 6 }} />
                            </View>
                        </View>
                    ))}
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Background gradient - outside SafeAreaView to extend behind status bar */}
            <LinearGradient
                colors={['rgba(124, 58, 237, 0.15)', 'transparent']}
                style={styles.bgGradient}
            />
            <SafeAreaView style={styles.safeArea} edges={["top"]}>
                {/* Header content */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerContent}>
                        <View style={styles.trophyContainer}>
                            <LinearGradient
                                colors={['#FFD700', '#FFA500', '#FF8C00']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.trophyBadge}
                            >
                                <Text style={styles.trophyEmoji}>🏆</Text>
                            </LinearGradient>
                            <View style={styles.trophyGlow} />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Leaderboard</Text>
                            <Text style={styles.headerSubtitle}>
                                Compete with {data.length}+ students
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Toggle Button */}
                <ToggleButton sortBy={sortBy} onToggle={setSortBy} />

                {/* Filter Bar */}
                <FilterBar
                    year={year}
                    branch={branch}
                    section={section}
                    onYearPress={() => setYearModalVisible(true)}
                    onBranchPress={() => setBranchModalVisible(true)}
                    onSectionPress={() => setSectionModalVisible(true)}
                />

                {/* Leaderboard List */}
                <FlatList
                    data={data}
                    keyExtractor={(item, index) => `${item.roll_no}-${index}`}
                    renderItem={({ item, index }) => (
                        <LeaderboardRow
                            item={item}
                            rank={index + 1}
                            isCurrentUser={item.roll_no.toUpperCase() === userRollNo}
                            sortBy={sortBy}
                        />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#7C3AED"
                            colors={["#7C3AED"]}
                            progressBackgroundColor="#0A0A12"
                        />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={styles.listContent}
                    ListFooterComponent={
                        loading && data.length > 0 ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator color="#7C3AED" />
                            </View>
                        ) : <View style={{ height: 100 }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <LinearGradient
                                colors={['rgba(124, 58, 237, 0.2)', 'rgba(124, 58, 237, 0.05)']}
                                style={styles.emptyIconContainer}
                            >
                                <Ionicons name="trophy-outline" size={48} color="#7C3AED" />
                            </LinearGradient>
                            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Check back later for leaderboard updates
                            </Text>
                        </View>
                    }
                />

                {/* Filter Modals */}
                <FilterModal
                    visible={yearModalVisible}
                    title="Select Year"
                    options={YEAR_OPTIONS}
                    selectedValue={year}
                    onSelect={setYear}
                    onClose={() => setYearModalVisible(false)}
                />
                <FilterModal
                    visible={branchModalVisible}
                    title="Select Branch"
                    options={BRANCH_OPTIONS}
                    selectedValue={branch}
                    onSelect={setBranch}
                    onClose={() => setBranchModalVisible(false)}
                />
                <FilterModal
                    visible={sectionModalVisible}
                    title="Select Section"
                    options={SECTION_OPTIONS}
                    selectedValue={section}
                    onSelect={setSection}
                    onClose={() => setSectionModalVisible(false)}
                />
            </SafeAreaView>
        </View>
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
        height: 200,
    },
    safeArea: {
        flex: 1,
    },
    loadingContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0A0A12',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingGradient: {
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: 'Inter_500Medium',
        color: '#A1A1AA',
        marginTop: 16,
    },

    // Header styles
    headerContainer: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trophyContainer: {
        position: 'relative',
        marginRight: 16,
    },
    trophyBadge: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trophyGlow: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        zIndex: -1,
    },
    trophyEmoji: {
        fontSize: 28,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#A1A1AA',
        marginTop: 2,
    },

    // Toggle styles
    toggleContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    toggleInner: {
        flexDirection: 'row',
        padding: 4,
    },
    toggleIndicator: {
        position: 'absolute',
        top: 4,
        height: 44,
        borderRadius: 12,
        overflow: 'hidden',
    },
    toggleIndicatorGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        zIndex: 1,
    },
    toggleIcon: {
        marginRight: 8,
    },
    toggleText: {
        fontSize: 14,
    },
    toggleTextActive: {
        fontFamily: 'Inter_600SemiBold',
        color: '#FFFFFF',
    },
    toggleTextInactive: {
        fontFamily: 'Inter_500Medium',
        color: '#71717A',
    },

    // Rank Badge styles
    rankBadge: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankBadgeShadowGold: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    rankBadgeShadowSilver: {
        shadowColor: '#C0C0C0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    rankBadgeShadowBronze: {
        shadowColor: '#CD7F32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    crownEmoji: {
        fontSize: 16,
        position: 'absolute',
        top: -2,
    },
    rankNumber: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: '#0A0A12',
        marginTop: 4,
    },
    medalEmoji: {
        fontSize: 26,
    },
    regularBadge: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    regularRankText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: '#A1A1AA',
    },

    // Row styles
    rowContainer: {
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 18,
        overflow: 'hidden',
    },
    topThreeRow: {
        marginBottom: 12,
    },
    currentUserRow: {
        marginVertical: 4,
    },
    glassBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    currentUserBorder: {
        borderColor: 'rgba(124, 58, 237, 0.5)',
        borderWidth: 1.5,
    },
    topThreeBorder: {
        borderColor: 'rgba(255, 215, 0, 0.15)',
    },
    currentUserIndicator: {
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 3,
        borderRadius: 2,
        overflow: 'hidden',
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    nameContainer: {
        flex: 1,
        marginLeft: 14,
    },
    nameText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: '#FFFFFF',
    },
    rollText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        marginTop: 2,
    },
    youBadge: {
        fontFamily: 'Inter_600SemiBold',
        color: '#7C3AED',
    },
    valueContainer: {
        alignItems: 'flex-end',
    },
    valueText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 22,
    },
    valueSuffix: {
        fontSize: 12,
    },
    valueLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        color: '#52525B',
        marginTop: 1,
    },

    // List styles
    listContent: {
        paddingTop: 4,
    },
    footerLoader: {
        paddingVertical: 20,
    },

    // Empty state styles
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#52525B',
    },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 18,
        padding: 14,
    },

    // Filter styles
    filterBar: {
        marginBottom: 12,
    },
    filterBarContent: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        borderRadius: 12,
        overflow: 'hidden',
        height: 48,
        width: '100%',
    },
    filterChipBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    filterChipBorderActive: {
        borderColor: 'rgba(124, 58, 237, 0.5)',
    },
    filterChipContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        paddingHorizontal: 4,
    },
    filterChipText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        color: '#A1A1AA',
        textAlign: 'center',
    },
    filterChipTextActive: {
        fontFamily: 'Inter_600SemiBold',
        color: '#FFFFFF',
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        maxHeight: '60%',
        borderRadius: 24,
        overflow: 'hidden',
    },
    modalBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalContent: {
        padding: 20,
    },
    modalTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalOptions: {
        maxHeight: 300,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
        overflow: 'hidden',
    },
    modalOptionSelected: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    modalOptionText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#A1A1AA',
    },
    modalOptionTextSelected: {
        fontFamily: 'Inter_600SemiBold',
        color: '#FFFFFF',
    },
});
