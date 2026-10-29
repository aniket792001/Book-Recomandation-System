import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, BorderRadius, Spacing } from '../../src/constants/theme';
import { useLibraryStore, ReaderThemeKey } from '../../src/store/useLibraryStore';
import { BookService, LibraryService, Book, BookContentResponse } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { AICompanionModal } from '../../src/components/AICompanionModal';
import { getBookPages } from '../../src/services/readerContent';
import { SAMPLE_BOOKS } from '../(tabs)/index';

export default function ReaderScreen() {
  const { bookId, page } = useLocalSearchParams<{ bookId: string; page?: string }>();
  const router = useRouter();
  const scrollRef = useRef<any>(null);

  const {
    readerTheme,
    readerFontSize,
    setReaderTheme,
    setReaderFontSize,
    downloadedBooks,
    saveReadingProgress,
    readingHistory,
  } = useLibraryStore();

  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (page) {
      const parsed = parseInt(page, 10);
      return isNaN(parsed) ? 1 : parsed;
    }
    // Check if user previously read this book
    const existing = readingHistory.find((h) => h.bookId === bookId);
    return existing?.currentPage || 1;
  });

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Check offline book first, then sample books, then query API
  const offlineBook = downloadedBooks.find((b) => b.id === bookId);
  const sampleFallback = SAMPLE_BOOKS.find((b) => b.id === bookId);

  const { data: remoteBook, isLoading } = useQuery<Book>({
    queryKey: ['book-reader', bookId],
    queryFn: () => BookService.getDetail(bookId as string),
    enabled: !!bookId && !offlineBook,
    initialData: sampleFallback,
  });

  // Query authentic unabridged novel text and chapters from backend / Gutenberg
  const {
    data: bookContent,
    isLoading: isContentLoading,
    isError: isContentError,
    refetch: refetchContent,
  } = useQuery<BookContentResponse>({
    queryKey: ['book-content', bookId],
    queryFn: () => BookService.getContent(bookId as string),
    enabled: !!bookId,
    retry: 1,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const currentBook = offlineBook || remoteBook || sampleFallback;
  const bookTitle = bookContent?.title || currentBook?.title || 'Classical Masterpiece';
  const bookAuthor = bookContent?.author || currentBook?.author || 'Project Gutenberg';
  const bookCover = currentBook?.cover_url;

  // Fallback excerpt pages if offline or before full text finishes downloading
  const fallbackPages = useMemo(() => {
    return getBookPages({
      title: currentBook?.title,
      author: currentBook?.author,
      description: (currentBook as any)?.description,
    });
  }, [currentBook?.title, currentBook?.author, (currentBook as any)?.description]);

  // Dynamic pages: use full chapters from API/cache if available, otherwise fallback preview
  const pages: { title: string; content: string }[] = useMemo(() => {
    if (bookContent?.pages && bookContent.pages.length > 0) {
      return bookContent.pages.map((p) => ({
        title: p.title || `Chapter ${p.page}`,
        content: p.content,
      }));
    }
    return fallbackPages.map((text, idx) => ({
      title: `Page ${idx + 1}`,
      content: text,
    }));
  }, [bookContent?.pages, fallbackPages]);

  const totalPages = Math.max(1, pages.length);
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const currentPageData = pages[activePage - 1] || { title: `Page ${activePage}`, content: '' };
  const currentChapterTitle = currentPageData.title;
  const pageText = currentPageData.content;
  const progressPercentage = Math.round((activePage / totalPages) * 100);

  const themeConfig = Colors.reader[readerTheme as ReaderThemeKey] || Colors.reader.night;

  // Persist reading history whenever active page changes
  useEffect(() => {
    if (bookId) {
      saveReadingProgress({
        bookId: bookId as string,
        title: bookTitle,
        author: bookAuthor,
        cover_url: bookCover,
        currentPage: activePage,
        totalPages,
        progressPercentage,
      });

      // Background cloud sync
      LibraryService.syncProgress(
        bookId as string,
        `page-${activePage}`,
        progressPercentage
      ).catch(() => {});
    }
  }, [activePage, bookId, bookTitle, bookAuthor, bookCover]);

  // Navigate to next page with scroll-to-top
  const handleNextPage = () => {
    if (activePage < totalPages) {
      setCurrentPage(activePage + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Navigate to previous page with scroll-to-top
  const handlePrevPage = () => {
    if (activePage > 1) {
      setCurrentPage(activePage - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const themes: { key: ReaderThemeKey; bg: string; text: string }[] = [
    { key: 'night', bg: '#0F172A', text: '#E2E8F0' },
    { key: 'day', bg: '#FFFFFF', text: '#1A1A1A' },
    { key: 'sepia', bg: '#FBF0D9', text: '#433422' },
    { key: 'rose', bg: '#FFF5F9', text: '#2A1B24' },
  ];

  return (
    <View style={[styles.canvas, { backgroundColor: themeConfig.background }]}>
      <StatusBar hidden={!controlsVisible} barStyle={readerTheme === 'day' ? 'dark-content' : 'light-content'} />

      {/* Top Floating App Bar */}
      {controlsVisible && (
        <SafeAreaView edges={['top']} style={[styles.topBar, { backgroundColor: themeConfig.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.topBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={themeConfig.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.chapterTitle, { color: themeConfig.text }]} numberOfLines={1}>
              {currentChapterTitle}
            </Text>
            <Text style={[styles.pageSubtitle, { color: themeConfig.text }]} numberOfLines={1}>
              {bookTitle} • Page {activePage} of {totalPages}
            </Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity onPress={() => setBookmarked(!bookmarked)} style={styles.topBtn}>
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={bookmarked ? Colors.primary : themeConfig.text}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAiModalVisible(true)} style={styles.topBtn}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Native Scrollable Reader Body (No TouchBlocker parent!) */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.textScroll}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {isContentLoading && !bookContent && pages.length === 0 ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: themeConfig.text }]}>
              Downloading unabridged novel from Project Gutenberg...
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setControlsVisible(!controlsVisible)}
              style={styles.togglePromptBar}
            >
              <Text style={[styles.togglePromptText, { color: themeConfig.text }]}>
                {controlsVisible ? 'Tap to hide menu' : 'Tap to show menu'}
              </Text>
            </TouchableOpacity>

            {isContentLoading && !bookContent && (
              <View style={styles.loadingBanner}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={[styles.loadingBannerText, { color: themeConfig.text }]}>
                  Fetching unabridged text...
                </Text>
              </View>
            )}

            {isContentError && !bookContent && (
              <View style={styles.offlineNoticeBanner}>
                <Ionicons name="cloud-offline-outline" size={16} color={Colors.primary} />
                <Text style={[styles.offlineNoticeText, { color: themeConfig.text }]}>
                  Showing offline preview.
                </Text>
                <TouchableOpacity onPress={() => refetchContent()} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>Retry Full Novel</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text
              style={[
                styles.passageText,
                {
                  color: themeConfig.text,
                  fontSize: readerFontSize,
                  lineHeight: readerFontSize * 1.72,
                },
              ]}
            >
              {pageText}
            </Text>

            {/* Bottom Page Navigation Controls */}
            <View style={styles.pageNavRow}>
              <TouchableOpacity
                onPress={handlePrevPage}
                disabled={activePage === 1}
                style={[styles.pageNavBtn, activePage === 1 && styles.pageNavBtnDisabled]}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={activePage === 1 ? 'rgba(150, 150, 150, 0.4)' : themeConfig.text}
                />
                <Text
                  style={[
                    styles.pageNavBtnText,
                    { color: activePage === 1 ? 'rgba(150, 150, 150, 0.4)' : themeConfig.text },
                  ]}
                >
                  Previous Page
                </Text>
              </TouchableOpacity>

              <Text style={[styles.pageIndicatorCenter, { color: themeConfig.text }]}>
                {activePage} / {totalPages}
              </Text>

              <TouchableOpacity
                onPress={handleNextPage}
                disabled={activePage === totalPages}
                style={[styles.pageNavBtn, activePage === totalPages && styles.pageNavBtnDisabled]}
              >
                <Text
                  style={[
                    styles.pageNavBtnText,
                    { color: activePage === totalPages ? 'rgba(150, 150, 150, 0.4)' : themeConfig.text },
                  ]}
                >
                  Next Page
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={activePage === totalPages ? 'rgba(150, 150, 150, 0.4)' : themeConfig.text}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Reading Toolbar */}
      {controlsVisible && (
        <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { backgroundColor: themeConfig.background }]}>
          {/* Theme & Font Size Controls */}
          <View style={styles.settingsRow}>
            {/* Font size stepper */}
            <View style={styles.fontSizeControls}>
              <TouchableOpacity
                onPress={() => setReaderFontSize(Math.max(12, readerFontSize - 1))}
                style={styles.fontBtn}
              >
                <Text style={[styles.fontBtnText, { color: themeConfig.text }]}>A-</Text>
              </TouchableOpacity>
              <Text style={[styles.fontSizeLabel, { color: themeConfig.text }]}>{readerFontSize}pt</Text>
              <TouchableOpacity
                onPress={() => setReaderFontSize(Math.min(28, readerFontSize + 1))}
                style={styles.fontBtn}
              >
                <Text style={[styles.fontBtnText, { color: themeConfig.text }]}>A+</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Themes */}
            <View style={styles.themesWrapper}>
              {themes.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.themeMiniCircle,
                    { backgroundColor: t.bg },
                    readerTheme === t.key && { borderColor: Colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => setReaderTheme(t.key)}
                />
              ))}
            </View>
          </View>

          {/* Progress Bar & Quick Page Turner */}
          <View style={styles.progressRow}>
            <TouchableOpacity onPress={handlePrevPage} disabled={activePage === 1} style={styles.stepBtn}>
              <Ionicons
                name="chevron-back"
                size={18}
                color={activePage === 1 ? 'rgba(150, 150, 150, 0.4)' : themeConfig.text}
              />
            </TouchableOpacity>

            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercentage}%`, backgroundColor: Colors.primary },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: themeConfig.text }]}>
                {progressPercentage}% • Page {activePage} of {totalPages}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleNextPage}
              disabled={activePage === totalPages}
              style={styles.stepBtn}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={activePage === totalPages ? 'rgba(150, 150, 150, 0.4)' : themeConfig.text}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* AI Companion Modal */}
      <AICompanionModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        bookId={bookId as string}
        bookTitle={bookTitle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
    zIndex: 10,
  },
  topBtn: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    alignItems: 'center',
    maxWidth: '60%',
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pageSubtitle: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  textScroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  loaderCenter: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(226, 133, 195, 0.1)',
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  loadingBannerText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  offlineNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  offlineNoticeText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  retryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  togglePromptBar: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
    marginBottom: Spacing.md,
  },
  togglePromptText: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
  },
  passageText: {
    fontFamily: 'serif',
    letterSpacing: 0.3,
  },
  pageNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.25)',
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
  },
  pageNavBtnDisabled: {
    opacity: 0.4,
  },
  pageNavBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pageIndicatorCenter: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    zIndex: 10,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fontBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
  },
  fontBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fontSizeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  themesWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  themeMiniCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepBtn: {
    padding: 6,
  },
  progressBarWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  progressBar: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
