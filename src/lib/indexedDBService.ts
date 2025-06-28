
// src/lib/indexedDBService.ts
'use client';

const DB_NAME = "LahemirPOS_DB";
const STORE_NAME = "productImages";
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

const getDbInstance = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error("IndexedDB can only be used in the browser."));
      return;
    }
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBRequest).error);
      reject(new Error("IndexedDB error: " + (event.target as IDBRequest).error?.message));
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBRequest).result as IDBDatabase;
      resolve(dbInstance!);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // The keyPath is 'id', which will store the productId. The actual image blob will be part of the value.
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const initDB = async (): Promise<IDBDatabase> => {
  if (!dbInstance) {
    dbInstance = await getDbInstance();
  }
  return dbInstance;
};

export const saveImage = async (productId: string, imageBlob: Blob): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      // Store an object { id: productId, blob: imageBlob }
      const request = store.put({ id: productId, blob: imageBlob });

      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error("Error saving image to IndexedDB:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    } catch (error) {
        console.error("Transaction error while saving image:", error);
        reject(error);
    }
  });
};

export const getImage = async (productId: string): Promise<Blob | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(productId);

        request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result ? result.blob : undefined);
        };
        request.onerror = (event) => {
        console.error("Error getting image from IndexedDB:", (event.target as IDBRequest).error);
        // Don't reject here, resolve with undefined if image not found or error.
        resolve(undefined); 
        };
    } catch (error) {
        console.error("Transaction error while getting image:", error);
        resolve(undefined);
    }
  });
};

export const deleteImage = async (productId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(productId);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
        console.error("Error deleting image from IndexedDB:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
        };
    } catch (error) {
        console.error("Transaction error while deleting image:", error);
        reject(error);
    }
  });
};

export const clearImages = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
        console.error("Error clearing images from IndexedDB:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
        };
    } catch (error) {
        console.error("Transaction error while clearing images:", error);
        reject(error);
    }
  });
};

// Helper to convert Data URI to Blob
export const dataUriToBlob = (dataURI: string): Blob | null => {
    if (!dataURI || !dataURI.includes(',')) return null;
    try {
        const [header, base64Data] = dataURI.split(',');
        if (!header || !base64Data) return null;

        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        
        const byteString = atob(base64Data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mime });
    } catch (e) {
        console.error("Error converting Data URI to Blob:", e);
        return null;
    }
};

// Helper to convert Blob to Data URI
export const blobToDataUri = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert Blob to Data URI: result is not a string.'));
            }
        };
        reader.onerror = (error) => {
            console.error('FileReader error in blobToDataUri:', error);
            reject(new Error('FileReader error in blobToDataUri: ' + error.toString()));
        };
        reader.readAsDataURL(blob);
    });
};
