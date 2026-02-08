import type {
    Attendance,
    LeaderboardParams,
    LeaderboardResponse,
    Midmarks,
    Student,
} from '../types';

// Configure your API base URL here
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Token provider for auth - set by the app on initialization
let getAuthToken: (() => Promise<string | null>) | null = null;

/**
 * Set the auth token provider function.
 * This should be called once when the app initializes with a Clerk session.
 */
export function setAuthTokenProvider(provider: () => Promise<string | null>) {
    getAuthToken = provider;
}

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get auth token if provider is set
    let authHeaders: Record<string, string> = {};
    if (getAuthToken) {
        try {
            const token = await getAuthToken();
            console.log('[API] Token retrieval:', token ? 'Success (token present)' : 'Failed (token is null)');
            if (token) {
                authHeaders['Authorization'] = `Bearer ${token}`;
            } else {
                console.warn('[API] Warning: No auth token available for request to', endpoint);
            }
        } catch (e) {
            console.error('[API] Error retrieving token:', e);
        }
    } else {
        console.warn('[API] Warning: Auth token provider not set for request to', endpoint);
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options?.headers,
            },
            ...options,
        });

        const json: ApiResponse<T> = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new ApiError(response.status, json.error || `HTTP error ${response.status}`);
        }

        // Handle wrapped response format: { success: true, data: {...} }
        if (json.success && json.data !== undefined) {
            return json.data;
        }

        // Handle direct response format (backward compatibility)
        return json as unknown as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new Error(`Network error: ${(error as Error).message}`);
    }
}

// For endpoints that return the full response object (not just data field)
async function fetchApiRaw<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get auth token if provider is set
    let authHeaders: Record<string, string> = {};
    if (getAuthToken) {
        const token = await getAuthToken();
        if (token) {
            authHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options?.headers,
            },
            ...options,
        });

        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new ApiError(response.status, json.error || `HTTP error ${response.status}`);
        }

        return json as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new Error(`Network error: ${(error as Error).message}`);
    }
}

// User endpoints
export async function getUserDetails(rollNumber: string): Promise<Student> {
    return fetchApi<Student>(`/user/${rollNumber}`);
}

export async function syncUser(rollNumber: string): Promise<{ email: string; rollNo: string }> {
    return fetchApi<{ email: string; rollNo: string }>('/user/sync', {
        method: 'POST',
        body: JSON.stringify({ rollNumber }),
    });
}

export async function getMyProfile(): Promise<{ email: string; rollNo: string }> {
    return fetchApi<{ email: string; rollNo: string }>('/user/me');
}

// Academic endpoints
export async function getAttendance(rollNumber: string): Promise<Attendance> {
    return fetchApi<Attendance>(`/acadamic/attendace/${rollNumber}`);
}

export async function getMidmarks(rollNumber: string): Promise<Midmarks> {
    return fetchApi<Midmarks>(`/acadamic/marks/${rollNumber}`);
}

// Statistics endpoints
export async function getLeaderboard(params: LeaderboardParams = {}): Promise<LeaderboardResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.year && params.year !== 'all') searchParams.set('year', params.year);
    if (params.branch && params.branch !== 'all') searchParams.set('branch', params.branch);
    if (params.section && params.section !== 'all') searchParams.set('section', params.section);

    const queryString = searchParams.toString();
    const endpoint = `/statistics/leaderboard${queryString ? `?${queryString}` : ''}`;

    return fetchApiRaw<LeaderboardResponse>(endpoint);
}

// Validate roll number format
export function isValidRollNumber(rollNumber: string): boolean {
    // Accept alphanumeric roll numbers between 8-15 characters
    // Common formats: 21BQ1A0501, 22B81A0512, N180001, etc.
    const rollRegex = /^\d{2}[a-zA-Z]{2}[a-zA-Z0-9]{6}$/;
    return rollRegex.test(rollNumber);
}

export interface RankResponse {
    rank: number;
    totalStudents: number;
    attendance: number;
}

export async function getStudentRank(
    rollNumber: string,
    context: 'college' | 'year' | 'branch' | 'section'
): Promise<RankResponse> {
    return fetchApi<RankResponse>(`/statistics/rank/${rollNumber}?context=${context}`);
}
