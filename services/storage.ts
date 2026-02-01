import * as SecureStore from 'expo-secure-store';

const ROLL_NUMBER_KEY = 'student_roll_no';

export async function saveRollNumber(rollNo: string): Promise<void> {
    await SecureStore.setItemAsync(ROLL_NUMBER_KEY, rollNo);
}

export async function getRollNumber(): Promise<string | null> {
    return await SecureStore.getItemAsync(ROLL_NUMBER_KEY);
}

export async function clearRollNumber(): Promise<void> {
    await SecureStore.deleteItemAsync(ROLL_NUMBER_KEY);
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
