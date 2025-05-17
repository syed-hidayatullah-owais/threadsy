import * as SecureStore from 'expo-secure-store';

/**
 * Save a value to secure storage
 * @param key Key to store the value under
 * @param value Value to store
 * @returns Promise resolving to true if successful
 */
export const saveToSecureStorage = async (key: string, value: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to secure storage:`, error);
    return false;
  }
};

/**
 * Get a value from secure storage
 * @param key Key to retrieve
 * @returns Promise resolving to the stored value or null if not found
 */
export const getValueFor = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error retrieving ${key} from secure storage:`, error);
    return null;
  }
};

/**
 * Delete a value from secure storage
 * @param key Key to delete
 * @returns Promise resolving to true if successful
 */
export const deleteFromSecureStorage = async (key: string): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error(`Error deleting ${key} from secure storage:`, error);
    return false;
  }
};
