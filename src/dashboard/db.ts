// IndexedDB Helper for VibeQuote Dashboard

const DB_NAME = "vibequote_db";
const DB_VERSION = 1;
const VIDEOS_STORE = "videos";
const SETTINGS_STORE = "settings";

export interface VideoRecord {
  id: string;
  thumbnail: string; // Base64 data URL
  quoteText: string;
  authorText: string;
  templateId: string;
  templateName: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  id: "user_settings";
  defaultTemplateId: string;
  defaultFontFamily: string;
  createdAt: number;
  updatedAt: number;
}

// Open database connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create videos store
      if (!db.objectStoreNames.contains(VIDEOS_STORE)) {
        const videosStore = db.createObjectStore(VIDEOS_STORE, {
          keyPath: "id",
        });
        videosStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
      }
    };
  });
};

// Video operations
export const saveVideo = async (video: VideoRecord): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEOS_STORE, "readwrite");
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.put(video);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to save video"));

    transaction.oncomplete = () => db.close();
  });
};

export const getVideo = async (
  id: string
): Promise<VideoRecord | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEOS_STORE, "readonly");
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Failed to get video"));

    transaction.oncomplete = () => db.close();
  });
};

export const getAllVideos = async (): Promise<VideoRecord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEOS_STORE, "readonly");
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by createdAt descending (newest first)
      const videos = (request.result as VideoRecord[]).sort(
        (a, b) => b.createdAt - a.createdAt
      );
      resolve(videos);
    };
    request.onerror = () => reject(new Error("Failed to get all videos"));

    transaction.oncomplete = () => db.close();
  });
};

export const deleteVideo = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEOS_STORE, "readwrite");
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to delete video"));

    transaction.oncomplete = () => db.close();
  });
};

export const clearAllVideos = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEOS_STORE, "readwrite");
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to clear videos"));

    transaction.oncomplete = () => db.close();
  });
};

// Get videos created today
export const getVideosCreatedToday = async (): Promise<VideoRecord[]> => {
  const videos = await getAllVideos();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  return videos.filter((video) => video.createdAt >= todayTimestamp);
};

// Settings operations
export const getSettings = async (): Promise<UserSettings | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, "readonly");
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get("user_settings");

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Failed to get settings"));

    transaction.oncomplete = () => db.close();
  });
};

export const saveSettings = async (
  settings: Partial<UserSettings>
): Promise<void> => {
  const existing = await getSettings();

  const updatedSettings: UserSettings = {
    id: "user_settings",
    defaultTemplateId:
      settings.defaultTemplateId ||
      existing?.defaultTemplateId ||
      "tpl_gradient_purple",
    defaultFontFamily:
      settings.defaultFontFamily ||
      existing?.defaultFontFamily ||
      "Syne, sans-serif",
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  const db2 = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db2.transaction(SETTINGS_STORE, "readwrite");
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put(updatedSettings);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to save settings"));

    transaction.oncomplete = () => db2.close();
  });
};

// Generate unique ID for videos
export const generateVideoId = (): string => {
  return `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Format date for display
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  // Less than 1 minute
  if (diff < 60000) {
    return "Vừa xong";
  }
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} phút trước`;
  }
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} giờ trước`;
  }
  // Otherwise show date
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
