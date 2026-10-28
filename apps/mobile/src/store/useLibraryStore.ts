import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReaderThemeKey = 'night' | 'day' | 'sepia' | 'rose';

export interface DownloadedBook {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  download_url?: string;
  format: string;
  downloadedAt: string;
}

export interface ReadingHistoryItem {
  bookId: string;
  title: string;
  author: string;
  cover_url?: string;
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  lastReadAt: string;
}

interface LibraryState {
  downloadedBookIds: string[];
  downloadedBooks: DownloadedBook[];
  readingHistory: ReadingHistoryItem[];
  readerFontSize: number;
  readerTheme: ReaderThemeKey;
  setReaderFontSize: (size: number) => void;
  setReaderTheme: (theme: ReaderThemeKey) => void;
  saveDownloadedBook: (book: { id: string; title: string; author: string; cover_url?: string; format?: string; download_url?: string }) => Promise<void>;
  removeDownloadedBook: (bookId: string) => Promise<void>;
  saveReadingProgress: (item: { bookId: string; title: string; author: string; cover_url?: string; currentPage: number; totalPages: number; progressPercentage: number }) => Promise<void>;
  markBookDownloaded: (bookId: string) => Promise<void>;
  loadLibraryPreferences: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  downloadedBookIds: [],
  downloadedBooks: [],
  readingHistory: [],
  readerFontSize: 16,
  readerTheme: 'night',

  setReaderFontSize: (size: number) => {
    set({ readerFontSize: size });
    AsyncStorage.setItem('reader_font_size', size.toString());
  },

  setReaderTheme: (theme: ReaderThemeKey) => {
    set({ readerTheme: theme });
    AsyncStorage.setItem('reader_theme', theme);
  },

  saveDownloadedBook: async (book) => {
    const existing = get().downloadedBooks.filter((b) => b.id !== book.id);
    const newBook: DownloadedBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      cover_url: book.cover_url,
      download_url: book.download_url,
      format: book.format || 'epub',
      downloadedAt: new Date().toISOString(),
    };
    const updatedBooks = [newBook, ...existing];
    const updatedIds = updatedBooks.map((b) => b.id);
    set({ downloadedBooks: updatedBooks, downloadedBookIds: updatedIds });
    await AsyncStorage.setItem('downloaded_books_meta', JSON.stringify(updatedBooks));
    await AsyncStorage.setItem('downloaded_books', JSON.stringify(updatedIds));
  },

  removeDownloadedBook: async (bookId: string) => {
    const updatedBooks = get().downloadedBooks.filter((b) => b.id !== bookId);
    const updatedIds = updatedBooks.map((b) => b.id);
    set({ downloadedBooks: updatedBooks, downloadedBookIds: updatedIds });
    await AsyncStorage.setItem('downloaded_books_meta', JSON.stringify(updatedBooks));
    await AsyncStorage.setItem('downloaded_books', JSON.stringify(updatedIds));
  },

  markBookDownloaded: async (bookId: string) => {
    const updated = [...new Set([...get().downloadedBookIds, bookId])];
    set({ downloadedBookIds: updated });
    await AsyncStorage.setItem('downloaded_books', JSON.stringify(updated));
  },

  saveReadingProgress: async (item) => {
    const existing = get().readingHistory.filter((h) => h.bookId !== item.bookId);
    const historyItem: ReadingHistoryItem = {
      ...item,
      lastReadAt: new Date().toISOString(),
    };
    const updatedHistory = [historyItem, ...existing];
    set({ readingHistory: updatedHistory });
    await AsyncStorage.setItem('reading_history', JSON.stringify(updatedHistory));
  },

  loadLibraryPreferences: async () => {
    try {
      const savedSize = await AsyncStorage.getItem('reader_font_size');
      const savedTheme = (await AsyncStorage.getItem('reader_theme')) as ReaderThemeKey | null;
      const savedBooksMeta = await AsyncStorage.getItem('downloaded_books_meta');
      const savedDownloads = await AsyncStorage.getItem('downloaded_books');
      const savedHistory = await AsyncStorage.getItem('reading_history');

      const booksList: DownloadedBook[] = savedBooksMeta ? JSON.parse(savedBooksMeta) : [];
      const idsList: string[] = booksList.length > 0 ? booksList.map((b) => b.id) : (savedDownloads ? JSON.parse(savedDownloads) : []);
      const historyList: ReadingHistoryItem[] = savedHistory ? JSON.parse(savedHistory) : [];

      set({
        readerFontSize: savedSize ? parseInt(savedSize, 10) : 16,
        readerTheme: savedTheme || 'night',
        downloadedBooks: booksList,
        downloadedBookIds: idsList,
        readingHistory: historyList,
      });
    } catch (e) {
      console.error('Failed to load library preferences:', e);
    }
  },
}));
