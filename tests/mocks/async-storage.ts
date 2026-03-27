const storage = new Map<string, string>();

const AsyncStorage = {
  async clear() {
    storage.clear();
  },
  async getItem(key: string) {
    return storage.get(key) ?? null;
  },
  async removeItem(key: string) {
    storage.delete(key);
  },
  async setItem(key: string, value: string) {
    storage.set(key, value);
  },
};

export const __resetAsyncStorage = () => {
  storage.clear();
};

export default AsyncStorage;
