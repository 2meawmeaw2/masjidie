import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "@masjidie/cache/";

export const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Wraps an async function with exponential backoff retry logic.
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  { maxRetries = 3, baseDelay = 1000 } = {},
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Persists data to AsyncStorage with a timestamp.
 */
export async function persistCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    console.warn("Failed to persist cache:", key, error);
  }
}

/**
 * Loads persisted data from AsyncStorage.
 * Returns { data, timestamp } or null if nothing cached.
 */
export async function loadPersistentCache<T>(
  key: string,
): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch (error) {
    console.warn("Failed to load cache:", key, error);
    return null;
  }
}
