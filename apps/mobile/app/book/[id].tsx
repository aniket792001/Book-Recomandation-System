import React, { useState } from 'react';
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
import { Colors, BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import { BookService, Book } from '../../src/services/api';
import { useLibraryStore } from '../../src/store/useLibraryStore';
import { Ionicons } from '@expo/vector-icons';
import { AICompanionModal } from '../../src/components/AICompanionModal';
import { SAMPLE_BOOKS } from '../(tabs)/index';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const saveDownloadedBook = useLibraryStore((s) => s.saveDownloadedBook);
  const downloadedBooks = useLibraryStore((s) => s.downloadedBooks);
  const downloadedBookIds = useLibraryStore((s) => s.downloadedBookIds);

  const isDownloaded = id ? downloadedBookIds.includes(id) : false;

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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.status.error} />
        <Text style={[styles.title, { textAlign: 'center', marginTop: 12 }]}>
          Book Not Found
        </Text>
        <Text style={[styles.description, { textAlign: 'center', marginBottom: 20 }]}>
          We couldn't retrieve the details for this title from the library.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[styles.readNowBtn, { backgroundColor: Colors.dark.surface }]}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.dark.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navActions}>
          <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={Colors.dark.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => setAiModalVisible(true)}>
            <Ionicons name="sparkles" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Book Cover Hero */}
        <View style={styles.coverWrapper}>
          {book.cover_url ? (
            <Image source={{ uri: book.cover_url }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="book-outline" size={64} color={Colors.primary} />
            </View>
          )}
        </View>

        {/* Title & Author */}
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>By {book.author}</Text>

        {/* Badges Row */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.badgeText}>
              {book.avg_rating > 0 ? book.avg_rating.toFixed(1) : '4.8'}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>English</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Public Domain</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{(book.format || 'EPUB').toUpperCase()}</Text>
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
            style={[styles.downloadBtn, isDownloaded && styles.downloadedBtn]}
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
                    isDownloaded && { color: Colors.status.success },
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
          <Text style={styles.sectionTitle}>Synopsis</Text>
          <Text style={styles.description}>
            {book.description ||
              'A recognized masterpiece of world literature available in the public domain via Project Gutenberg and PagePulse AI.'}
          </Text>
        </View>

        {/* Ask Companion CTA Card */}
        <TouchableOpacity
          style={styles.aiBanner}
          activeOpacity={0.85}
          onPress={() => setAiModalVisible(true)}
        >
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={18} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiBannerTitle}>Have questions about this book?</Text>
            <Text style={styles.aiBannerSubtitle}>
              Ask the AI Companion for themes, character maps, or historical context.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.secondary} />
        </TouchableOpacity>
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
    backgroundColor: Colors.dark.canvas,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.canvas,
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
  navActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 60,
  },
  coverWrapper: {
    alignSelf: 'center',
    width: 180,
    height: 260,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.dark.surface,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.secondary,
  },
  title: {
    ...Typography.hero,
    fontSize: 22,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
  },
  author: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 4,
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
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  badgeText: {
    color: Colors.dark.textPrimary,
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
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  downloadedBtn: {
    borderColor: Colors.status.success,
  },
  downloadText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.title,
    fontSize: 17,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.secondary,
    gap: Spacing.md,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  aiBannerSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
