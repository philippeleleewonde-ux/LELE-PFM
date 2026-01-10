/**
 * User-specific localStorage wrapper for Module 1
 * This ensures data isolation between different users
 */

let currentUserId: string | null = null;

export const UserStorage = {
  /**
   * Set the current user ID for scoped storage
   */
  setUserId(userId: string | null) {
    currentUserId = userId;
  },

  /**
   * Get the storage key scoped to the current user
   */
  getScopedKey(key: string): string {
    if (!currentUserId) {
      // Fallback to non-scoped key if no user is set
      return key;
    }
    return `user_${currentUserId}_${key}`;
  },

  /**
   * Get item from localStorage scoped to current user
   */
  getItem(key: string): string | null {
    const scopedKey = this.getScopedKey(key);
    return window.localStorage.getItem(scopedKey);
  },

  /**
   * Set item in localStorage scoped to current user
   */
  setItem(key: string, value: string): void {
    const scopedKey = this.getScopedKey(key);
    window.localStorage.setItem(scopedKey, value);
  },

  /**
   * Remove item from localStorage scoped to current user
   */
  removeItem(key: string): void {
    const scopedKey = this.getScopedKey(key);
    window.localStorage.removeItem(scopedKey);
  },

  /**
   * Clear all items for current user
   */
  clearUserData(): void {
    if (!currentUserId) return;

    const prefix = `user_${currentUserId}_`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => window.localStorage.removeItem(key));
  }
};
