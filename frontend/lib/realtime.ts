/**
 * Simple polling-based "real-time" updates as alternative to Supabase Realtime
 * Polls the API at regular intervals to check for new data
 */

type PollingCallback = (data: any) => void;

class PollingManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start polling an endpoint
   * @param key - Unique identifier for this polling instance
   * @param fetchFn - Function that fetches the data
   * @param callback - Function to call with the fetched data
   * @param intervalMs - Polling interval in milliseconds (default: 5000ms)
   */
  startPolling(
    key: string,
    fetchFn: () => Promise<any>,
    callback: PollingCallback,
    intervalMs: number = 5000
  ) {
    // Clear existing interval if any
    this.stopPolling(key);

    // Initial fetch
    fetchFn().then(callback).catch(console.error);

    // Set up interval
    const interval = setInterval(async () => {
      try {
        const data = await fetchFn();
        callback(data);
      } catch (error) {
        console.error(`Polling error for ${key}:`, error);
      }
    }, intervalMs);

    this.intervals.set(key, interval);
  }

  /**
   * Stop polling for a specific key
   */
  stopPolling(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  /**
   * Stop all polling
   */
  stopAll() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }
}

// Export singleton instance
export const pollingManager = new PollingManager();

/**
 * Hook to easily set up polling in React components
 */
export function usePolling(
  key: string,
  fetchFn: () => Promise<any>,
  callback: PollingCallback,
  intervalMs: number = 5000,
  enabled: boolean = true
) {
  if (typeof window === 'undefined') return; // SSR guard

  if (enabled) {
    pollingManager.startPolling(key, fetchFn, callback, intervalMs);

    // Cleanup on unmount
    return () => pollingManager.stopPolling(key);
  }
}
