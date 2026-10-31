import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import { BookService, Book } from '../../src/services/api';
import { useLibraryStore } from '../../src/store/useLibraryStore';
import { useAppTheme } from '../../src/store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { AICompanionModal } from '../../src/components/AICompanionModal';
import { SAMPLE_BOOKS } from '../(tabs)/index';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [downloading, setDownloading] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const saveDownloadedBook = useLibraryStore((s) => s.saveDownloadedBook);
  const downloadedBooks = useLibraryStore((s) => s.downloadedBooks);
  const downloadedBookIds = useLibraryStore((s) => s.downloadedBookIds);

  const isDownloaded = id ? downloadedBookIds.includes(id) : false;

  useEffect(() => {
    if (id) {
      AsyncStorage.getItem(`bookmarked_${id}`).then((val) => {
        setIsBookmarked(val === 'true');
      });
    }
  }, [id]);

  const handleToggleBookmark = async () => {
    if (!id) return;
    const next = !isBookmarked;
    setIsBookmarked(next);
    await AsyncStorage.setItem(`bookmarked_${id}`, next ? 'true' : 'false');
  };

  const foundOffline = downloadedBooks.find((b) => b.id === id);
  const fallbackBook: Book | undefined = foundOffline
    ? {
        id: foundOffline.id,
        title: foundOffline.title,
        author: foundOffline.author,
        cover_url: foundOffline.cover_url,
        format: foundOffline.format || 'epub',
        avg_rating: 4.8,
        rating_count: 1000,
        download_url: foundOffline.download_url,
        gutenberg_id: foundOffline.gutenberg_id,
      }
    : SAMPLE_BOOKS.find((b) => b.id === id);

  const { data: remoteBook, isLoading, isError, refetch } = useQuery<Book>({
    queryKey: ['book-detail', id],
    queryFn: () => BookService.getDetail(id as string),
    enabled: !!id,
    retry: 1,
  });

  const book = remoteBook || fallbackBook;

  const handleDownload = async () => {
    if (!book || isDownloaded) return;
    setDownloading(true);
    try {
      await saveDownloadedBook({
        id: book.id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
        format: book.format,
        download_url: book.download_url,
        gutenberg_id: book.gutenberg_id,
      });
      alert(`"${book.title}" saved successfully for offline reading!`);
    } catch (e) {
      alert('Could not download book. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!book) return;
    try {
      await Share.share({
        message: `I'm reading "${book.title}" by ${book.author} on PagePulse AI!`,
      });
    } catch (e) {}
  };

  if (isLoading && !book) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.canvas }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.canvas }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.status.error} />
        <Text style={[styles.title, { textAlign: 'center', marginTop: 12, color: colors.textPrimary }]}>
          Book Not Found
        </Text>
        <Text style={[styles.description, { textAlign: 'center', marginBottom: 20, color: colors.textSecondary }]}>
          We couldn't retrieve the details for this title from the library.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[styles.readNowBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <Text style={styles.readNowText}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.readNowBtn} onPress={() => refetch()}>
            <Text style={styles.readNowText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.canvas }]} edges={['top']}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navActions}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surface }]}
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surface }]}
            onPress={handleToggleBookmark}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? Colors.primary : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Book Cover Hero */}
        <View style={[styles.coverWrapper, { shadowColor: Colors.primary }]}>
          {book.cover_url ? (
            <Image source={{ uri: book.cover_url }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="book-outline" size={64} color={Colors.primary} />
            </View>
          )}
        </View>

        {/* Title & Author */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>{book.title}</Text>
        <Text style={[styles.author, { color: colors.textSecondary }]}>By {book.author}</Text>

        {/* Badges Row */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
              {book.avg_rating > 0 ? book.avg_rating.toFixed(1) : '4.8'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.badgeText, { color: colors.textPrimary }]}>English</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.badgeText, { color: colors.textPrimary }]}>Public Domain</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
              {(book.format || 'EPUB').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.readNowBtn}
            activeOpacity={0.85}
            onPress={() => router.push(`/reader/${book.id}` as any)}
          >
            <Ionicons name="book-outline" size={18} color="#FFF" />
            <Text style={styles.readNowText}>Read In-App</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.downloadBtn,
              { backgroundColor: colors.surface, borderColor: isDownloaded ? Colors.status.success : Colors.primary },
            ]}
            activeOpacity={0.85}
            onPress={handleDownload}
            disabled={downloading || isDownloaded}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={isDownloaded ? 'checkmark-circle' : 'cloud-download-outline'}
                  size={18}
                  color={isDownloaded ? Colors.status.success : Colors.primary}
                />
                <Text
                  style={[
                    styles.downloadText,
                    { color: isDownloaded ? Colors.status.success : Colors.primary },
                  ]}
                >
                  {isDownloaded ? 'Downloaded' : 'Save Offline'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Synopsis / Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Synopsis</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {book.description ||
              'A recognized masterpiece of world literature available in the public domain via Project Gutenberg and PagePulse AI.'}
          </Text>
        </View>

        {/* AI Literary Studio Card (Consolidated Multi-Action Feature) */}
        <View style={[styles.aiStudioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.aiStudioHeader}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={16} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiStudioTitle, { color: colors.textPrimary }]}>AI Literary Studio</Text>
              <Text style={[styles.aiStudioSubtitle, { color: colors.textSecondary }]}>
                Deep-dive into this book with your Gemini companion
              </Text>
            </View>
          </View>

          <View style={styles.aiChipRow}>
            <TouchableOpacity
              style={[styles.aiActionChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={() => setAiModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.aiActionChipText, { color: colors.textPrimary }]}>⚡ 3-Min Summary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.aiActionChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={() => setAiModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.aiActionChipText, { color: colors.textPrimary }]}>💡 Core Themes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.aiActionChipPrimary, { backgroundColor: Colors.primary }]}
              onPress={() => setAiModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#FFF" />
              <Text style={styles.aiActionChipPrimaryText}>Ask AI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* AI Companion Modal */}
      <AICompanionModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        bookId={book.id}
        bookTitle={book.title}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  coverWrapper: {
    width: 170,
    height: 250,
    borderRadius: BorderRadius.lg,
    alignSelf: 'center',
    marginVertical: Spacing.md,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  author: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  readNowBtn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  readNowText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  downloadBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.title,
    fontSize: 17,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    lineHeight: 22,
  },
  aiStudioCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  aiStudioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiStudioTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiStudioSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  aiChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  aiActionChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiActionChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  aiActionChipPrimary: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiActionChipPrimaryText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
