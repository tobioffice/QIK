import * as SecureStore from 'expo-secure-store';

const ROLL_NUMBER_KEY = 'student_roll_no';
const RANK_CACHE_KEY = 'student_rank_cache';
const ATTENDANCE_CACHE_KEY = 'attendance_cache';
const MIDMARKS_CACHE_KEY = 'midmarks_cache';

// Cache expiry durations
const RANK_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const ACADEMIC_CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface CachedRankData {
    rank: number;
    totalStudents: number;
    attendance: number;
    context: 'college' | 'year' | 'branch' | 'section';
    timestamp: number;
}

export async function saveRollNumber(rollNo: string): Promise<void> {
    await SecureStore.setItemAsync(ROLL_NUMBER_KEY, rollNo);
}

export async function getRollNumber(): Promise<string | null> {
    return await SecureStore.getItemAsync(ROLL_NUMBER_KEY);
}

export async function clearRollNumber(): Promise<void> {
    await SecureStore.deleteItemAsync(ROLL_NUMBER_KEY);
}

// Rank caching functions
export async function getCachedRank(context: 'college' | 'year' | 'branch' | 'section'): Promise<{ rank: number; totalStudents: number; attendance: number } | null> {
    try {
        const cached = await SecureStore.getItemAsync(RANK_CACHE_KEY);
        if (!cached) return null;

        const parsedCache: Record<string, CachedRankData> = JSON.parse(cached);
        const cachedForContext = parsedCache[context];

        if (!cachedForContext) return null;

        // Check if cache has expired (older than 24 hours)
        const now = Date.now();
        if (now - cachedForContext.timestamp > RANK_CACHE_EXPIRY_MS) {
            // Remove expired cache for this context
            delete parsedCache[context];
            await SecureStore.setItemAsync(RANK_CACHE_KEY, JSON.stringify(parsedCache));
            return null;
        }

        return {
            rank: cachedForContext.rank,
            totalStudents: cachedForContext.totalStudents,
            attendance: cachedForContext.attendance
        };
    } catch (error) {
        console.error('Error getting cached rank:', error);
        return null;
    }
}

export async function saveRankToCache(
    context: 'college' | 'year' | 'branch' | 'section',
    rank: number,
    totalStudents: number,
    attendance: number
): Promise<void> {
    try {
        const existingCache = await SecureStore.getItemAsync(RANK_CACHE_KEY);
        const parsedCache: Record<string, CachedRankData> = existingCache ? JSON.parse(existingCache) : {};

        parsedCache[context] = {
            rank,
            totalStudents,
            attendance,
            context,
            timestamp: Date.now(),
        };

        await SecureStore.setItemAsync(RANK_CACHE_KEY, JSON.stringify(parsedCache));
    } catch (error) {
        console.error('Error saving rank to cache:', error);
    }
}

export async function clearRankCache(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(RANK_CACHE_KEY);
    } catch (error) {
        console.error('Error clearing rank cache:', error);
    }
}

// Attendance caching functions (1-hour expiry)
interface CachedData<T> {
    data: T;
    timestamp: number;
}

export async function getCachedAttendance(): Promise<any | null> {
    try {
        const cached = await SecureStore.getItemAsync(ATTENDANCE_CACHE_KEY);
        if (!cached) return null;

        const parsedCache: CachedData<any> = JSON.parse(cached);

        // Check if cache has expired (older than 1 hour)
        const now = Date.now();
        if (now - parsedCache.timestamp > ACADEMIC_CACHE_EXPIRY_MS) {
            await SecureStore.deleteItemAsync(ATTENDANCE_CACHE_KEY);
            return null;
        }

        return parsedCache.data;
    } catch (error) {
        console.error('Error getting cached attendance:', error);
        return null;
    }
}

export async function saveAttendanceToCache(attendance: any): Promise<void> {
    try {
        const cacheData: CachedData<any> = {
            data: attendance,
            timestamp: Date.now(),
        };
        await SecureStore.setItemAsync(ATTENDANCE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error saving attendance to cache:', error);
    }
}

export async function clearAttendanceCache(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(ATTENDANCE_CACHE_KEY);
    } catch (error) {
        console.error('Error clearing attendance cache:', error);
    }
}

// Midmarks caching functions (1-hour expiry)
export async function getCachedMidmarks(): Promise<any | null> {
    try {
        const cached = await SecureStore.getItemAsync(MIDMARKS_CACHE_KEY);
        if (!cached) return null;

        const parsedCache: CachedData<any> = JSON.parse(cached);

        // Check if cache has expired (older than 1 hour)
        const now = Date.now();
        if (now - parsedCache.timestamp > ACADEMIC_CACHE_EXPIRY_MS) {
            await SecureStore.deleteItemAsync(MIDMARKS_CACHE_KEY);
            return null;
        }

        return parsedCache.data;
    } catch (error) {
        console.error('Error getting cached midmarks:', error);
        return null;
    }
}

export async function saveMidmarksToCache(midmarks: any): Promise<void> {
    try {
        const cacheData: CachedData<any> = {
            data: midmarks,
            timestamp: Date.now(),
        };
        await SecureStore.setItemAsync(MIDMARKS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error saving midmarks to cache:', error);
    }
}

export async function clearMidmarksCache(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(MIDMARKS_CACHE_KEY);
    } catch (error) {
        console.error('Error clearing midmarks cache:', error);
    }
}

// Token cache for Clerk
export const tokenCache = {
    async getToken(key: string): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            console.error('Error getting token from secure store:', error);
            return null;
        }
    },
    async saveToken(key: string, value: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error('Error saving token to secure store:', error);
        }
    },
};
