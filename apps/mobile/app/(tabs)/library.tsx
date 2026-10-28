import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import { useLibraryStore } from '../../src/store/useLibraryStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LibraryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'reading' | 'downloaded'>('reading');

  const downloadedBooks = useLibraryStore((s) => s.downloadedBooks);
  const readingHistory = useLibraryStore((s) => s.readingHistory);
  const removeDownloadedBook = useLibraryStore((s) => s.removeDownloadedBook);
  const loadLibraryPreferences = useLibraryStore((s) => s.loadLibraryPreferences);

  useEffect(() => {
    loadLibraryPreferences();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookshelf</Text>
        <Text style={styles.subtitle}>Your digital library & offline reading vault</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'reading' && styles.activeSegmentBtn]}
          onPress={() => setActiveTab('reading')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'reading' && styles.activeSegmentText]}>
            Active Reading ({readingHistory.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'downloaded' && styles.activeSegmentBtn]}
          onPress={() => setActiveTab('downloaded')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'downloaded' && styles.activeSegmentText]}>
            Downloaded ({downloadedBooks.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'reading' ? (
          readingHistory.length > 0 ? (
            <View style={styles.bookList}>
              {readingHistory.map((item) => (
                <TouchableOpacity
                  key={item.bookId}
                  style={styles.shelfCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/reader/${item.bookId}?page=${item.currentPage}` as any)}
                >
                  {item.cover_url ? (
                    <Image source={{ uri: item.cover_url }} style={styles.coverThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.bookIconContainer}>
                      <Ionicons name="book" size={22} color={Colors.primary} />
                    </View>
                  )}

                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                      {item.author}
                    </Text>
                    <View style={styles.progressRow}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${item.progressPercentage}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{item.progressPercentage}%</Text>
                    </View>
                    <Text style={styles.pageLabel}>
                      Page {item.currentPage} of {item.totalPages}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.readNowBtn}
                    onPress={() => router.push(`/reader/${item.bookId}?page=${item.currentPage}` as any)}
                  >
                    <Text style={styles.readNowText}>Resume</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="book-outline" size={40} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Active Reading</Text>
              <Text style={styles.emptySubtitle}>
                You haven't opened any books yet. Explore the classical catalog and begin your journey!
              </Text>
              <TouchableOpacity
                style={styles.exploreCtaBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)' as any)}
              >
                <Text style={styles.exploreCtaText}>Browse Books</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          downloadedBooks.length > 0 ? (
            <View style={styles.bookList}>
              {downloadedBooks.map((book) => (
                <TouchableOpacity
                  key={book.id}
                  style={styles.shelfCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/reader/${book.id}` as any)}
                >
                  {book.cover_url ? (
                    <Image source={{ uri: book.cover_url }} style={styles.coverThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.bookIconContainer}>
                      <Ionicons name="cloud-done" size={22} color={Colors.status.success} />
                    </View>
                  )}

                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={1}>
                      {book.title}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                      {book.author}
                    </Text>
                    <View style={styles.offlineBadgeRow}>
                      <View style={styles.offlineBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={Colors.status.success} />
                        <Text style={styles.offlineBadgeText}>Offline Ready</Text>
                      </View>
                      <Text style={styles.formatBadgeText}>{book.format.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.actionColumn}>
                    <TouchableOpacity
                      style={styles.readNowBtn}
                      onPress={() => router.push(`/reader/${book.id}` as any)}
                    >
                      <Text style={styles.readNowText}>Read</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeDownloadedBook(book.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.dark.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cloud-download-outline" size={40} color={Colors.secondary} />
              </View>
              <Text style={styles.emptyTitle}>Offline Books Vault is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Save Offline" on any book in the catalog to store full EPUB text directly on your device for zero-data reading.
              </Text>
              <TouchableOpacity
                style={styles.exploreCtaBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)' as any)}
              >
                <Text style={styles.exploreCtaText}>Discover Books to Download</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.canvas,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.title,
    color: Colors.dark.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  activeSegmentBtn: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeSegmentText: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
  },
  bookList: {
    gap: Spacing.sm,
  },
  shelfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.sm,
  },
  coverThumb: {
    width: 48,
    height: 70,
    borderRadius: 6,
    backgroundColor: Colors.dark.secondary,
  },
  bookIconContainer: {
    width: 48,
    height: 70,
    borderRadius: 6,
    backgroundColor: Colors.dark.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  bookAuthor: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    width: 32,
  },
  pageLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  offlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offlineBadgeText: {
    color: Colors.status.success,
    fontSize: 10,
    fontWeight: '600',
  },
  formatBadgeText: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  actionColumn: {
    alignItems: 'center',
    gap: 8,
  },
  readNowBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
  },
  readNowText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  exploreCtaBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  exploreCtaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
