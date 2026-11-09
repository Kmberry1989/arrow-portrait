import type { PuzzleSpec } from '../types';

const DB_NAME = 'arrow-portrait';
const STORE = 'puzzles';
const KEY = 'latest';

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const savePuzzle = async (puzzle: PuzzleSpec): Promise<void> => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(puzzle, KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
};

export const loadPuzzle = async (): Promise<PuzzleSpec | undefined> => {
  const database = await openDatabase();
  const puzzle = await new Promise<PuzzleSpec | undefined>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(request.result as PuzzleSpec | undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return puzzle;
};
