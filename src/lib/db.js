const DB_NAME = "petal-and-pulse";
const DB_VERSION = 2;
const DOCS = "documents";
const FILES = "files";

function friendly(error) {
  if (error && error.name === "QuotaExceededError") {
    return new Error(
      "Your browser is out of storage space. Remove an older lesson and try again."
    );
  }
  return new Error(
    "Couldn't use this browser's saved storage. Private browsing can block it."
  );
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser can't save documents."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DOCS)) {
        db.createObjectStore(DOCS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FILES)) {
        db.createObjectStore(FILES, { keyPath: "id" });
      }
    };
    request.onblocked = () =>
      reject(new Error("Please close other tabs of this app and try again."));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(friendly(request.error));
  });
}

function run(storeName, mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        let request;
        const tx = db.transaction(storeName, mode);
        tx.oncomplete = () => {
          db.close();
          resolve(request ? request.result : undefined);
        };
        tx.onabort = () => {
          db.close();
          reject(friendly(tx.error));
        };
        request = action(tx.objectStore(storeName));
      })
  );
}

// Lessons (the extracted text)
export const getAllDocs = () => run(DOCS, "readonly", (store) => store.getAll());
export const getDoc = (id) => run(DOCS, "readonly", (store) => store.get(id));
export const saveDoc = (doc) => run(DOCS, "readwrite", (store) => store.put(doc));
export const deleteDoc = (id) => run(DOCS, "readwrite", (store) => store.delete(id));

// Original PDF files
export const saveFile = (id, bytes) =>
  run(FILES, "readwrite", (store) => store.put({ id, bytes, savedAt: new Date().toISOString() }));
export const getFile = (id) => run(FILES, "readonly", (store) => store.get(id));
export const deleteFile = (id) => run(FILES, "readwrite", (store) => store.delete(id));