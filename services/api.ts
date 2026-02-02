import type {
    Attendance,
    LeaderboardParams,
    LeaderboardResponse,
    Midmarks,
    Student,
} from '../types';

// Configure your API base URL here
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_ATTEMPTS = 3; // Total attempts (initial + 2 retries)
const RETRY_DELAY_BASE = 1000; // 1 second

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

interface FetchOptions extends Omit<RequestInit, 'signal'> {
    timeout?: number;
    retries?: number;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * Attempt 0: 1s, Attempt 1: 2s, Attempt 2: 4s
 */
function getBackoffDelay(attempt: number): number {
    return RETRY_DELAY_BASE * Math.pow(2, attempt);
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

/**
 * Core fetch function with retry logic and timeout
 */
async function fetchApi<T>(
    endpoint: string,
    options?: FetchOptions
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const maxAttempts = options?.retries !== undefined ? options.retries + 1 : MAX_ATTEMPTS;
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

    // Extract our custom options before passing to fetch
    const { timeout: _, retries: __, ...fetchOptions } = options || {};

    // Get auth token if provider is set
    let authHeaders: Record<string, string> = {};
    if (getAuthToken) {
        try {
            const token = await getAuthToken();
            if (token) {
                authHeaders['Authorization'] = `Bearer ${token}`;
            }
        } catch (e) {
            // Silently fail - auth is optional for some endpoints
        }
    }

    let lastError: Error | null = null;

    // Retry loop
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await fetchWithTimeout(
                url,
                {
                    ...fetchOptions,
                    headers: {
                        'Content-Type': 'application/json',
                        ...fetchOptions?.headers,
                        ...authHeaders,
                    },
                },
                timeout
            );

            // Try to parse JSON, but handle failure gracefully
            let json: ApiResponse<T>;
            try {
                json = await response.json();
            } catch (parseError) {
                // If JSON parse fails, create a structured error response
                if (!response.ok) {
                    throw new ApiError(
                        response.status,
                        `HTTP error ${response.status} (invalid JSON response)`
                    );
                }
                // If response was OK but JSON invalid, throw parse error
                throw new Error('Invalid JSON response from server');
            }

            if (!response.ok) {
                // Don't retry on client errors (4xx)
                if (response.status >= 400 && response.status < 500) {
                    throw new ApiError(
                        response.status,
                        json.error || `HTTP error ${response.status}`
                    );
                }
                // Retry on server errors (5xx)
                throw new ApiError(
                    response.status,
                    json.error || `HTTP error ${response.status}`
                );
            }

            // Handle wrapped response format: { success: true, data: {...} }
            if (json.success && json.data !== undefined) {
                return json.data;
            }

            // Handle direct response format (backward compatibility)
            return json as unknown as T;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            // Don't retry on client errors
            if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                throw error;
            }

            // If not the last attempt, wait and retry
            if (attempt < maxAttempts - 1) {
                await sleep(getBackoffDelay(attempt));
                continue;
            }

            // Last attempt failed, throw the error
            throw error;
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Request failed after retries');
}

// For endpoints that return the full response object (not just data field)
async function fetchApiRaw<T>(
    endpoint: string,
    options?: FetchOptions
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const maxAttempts = options?.retries !== undefined ? options.retries + 1 : MAX_ATTEMPTS;
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

    // Extract our custom options
    const { timeout: _, retries: __, ...fetchOptions } = options || {};

    // Get auth token if provider is set
    let authHeaders: Record<string, string> = {};
    if (getAuthToken) {
        try {
            const token = await getAuthToken();
            if (token) {
                authHeaders['Authorization'] = `Bearer ${token}`;
            }
        } catch (e) {
            // Silently fail
        }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await fetchWithTimeout(
                url,
                {
                    ...fetchOptions,
                    headers: {
                        'Content-Type': 'application/json',
                        ...fetchOptions?.headers,
                        ...authHeaders,
                    },
                },
                timeout
            );

            let json: any;
            try {
                json = await response.json();
            } catch (parseError) {
                if (!response.ok) {
                    throw new ApiError(
                        response.status,
                        `HTTP error ${response.status} (invalid JSON response)`
                    );
                }
                throw new Error('Invalid JSON response from server');
            }

            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    throw new ApiError(
                        response.status,
                        json.error || `HTTP error ${response.status}`
                    );
                }
                throw new ApiError(
                    response.status,
                    json.error || `HTTP error ${response.status}`
                );
            }

            return json as T;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                throw error;
            }

            if (attempt < maxAttempts - 1) {
                await sleep(getBackoffDelay(attempt));
                continue;
            }

            throw error;
        }
    }

    throw lastError || new Error('Request failed after retries');
}

// User endpoints
export async function getUserDetails(rollNumber: string): Promise<Student> {
    return fetchApi<Student>(`/user/${rollNumber}`);
}

export async function syncUser(rollNumber: string): Promise<{ user_id: string; roll_no: string }> {
    return fetchApi<{ user_id: string; roll_no: string }>('/user/sync', {
        method: 'POST',
        body: JSON.stringify({ rollNumber }),
    });
}

export async function getMyProfile(): Promise<{ user_id: string; roll_no: string }> {
    return fetchApi<{ user_id: string; roll_no: string }>('/user/me');
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
