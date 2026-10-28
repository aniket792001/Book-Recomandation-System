import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../src/components/Header';
import { BookCard } from '../../src/components/BookCard';
import { AICompanionModal } from '../../src/components/AICompanionModal';
import { Colors, BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import { BookService, Book } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Seed sample books for immediate instant rendering
const SAMPLE_BOOKS: Book[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    cover_url: 'https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg',
    download_url: 'https://www.gutenberg.org/ebooks/1342.epub.images',
    format: 'epub',
    avg_rating: 4.8,
    rating_count: 52000,
    description: 'A romantic masterpiece following the spirited Elizabeth Bennet and proud Mr. Darcy.',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    cover_url: 'https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg',
    download_url: 'https://www.gutenberg.org/ebooks/84.epub.images',
    format: 'epub',
    avg_rating: 4.7,
    rating_count: 48000,
    description: 'A scientist creates life with monstrous and haunting consequences.',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    cover_url: 'https://www.gutenberg.org/cache/epub/64317/pg64317.cover.medium.jpg',
    download_url: 'https://www.gutenberg.org/ebooks/64317.epub.images',
    format: 'epub',
    avg_rating: 4.6,
    rating_count: 39000,
    description: 'The tragedy of Jay Gatsby and the disillusionment of the American Dream in the Roaring Twenties.',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Dracula',
    author: 'Bram Stoker',
    cover_url: 'https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg',
    download_url: 'https://www.gutenberg.org/ebooks/345.epub.images',
    format: 'epub',
    avg_rating: 4.7,
    rating_count: 36000,
    description: 'The gothic vampire horror classic set in Transylvania and Victorian England.',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [aiModalVisible, setAiModalVisible] = useState(false);

  // Fetch popular books with fallback
  const { data: popularBooks, isLoading } = useQuery({
    queryKey: ['popular-books'],
    queryFn: () => BookService.getPopular(8),
    initialData: SAMPLE_BOOKS,
  });

  const booksToDisplay = popularBooks && popularBooks.length > 0 ? popularBooks : SAMPLE_BOOKS;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={12} color="#FFF" />
            <Text style={styles.heroBadgeText}>AI-Powered Reading</Text>
          </View>
          <Text style={styles.heroTitle}>Rediscover The Classics</Text>
          <Text style={styles.heroSubtitle}>
            Download verified public-domain EPUBs, read offline, and chat with your AI reading companion.
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => router.push('/(tabs)/explore' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.heroButtonText}>Explore by Mood</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Continue Reading Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue Reading</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/library' as any)}>
            <Text style={styles.seeAllText}>My Shelf</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.activeReadingCard}
          activeOpacity={0.85}
          onPress={() => router.push(`/reader/${SAMPLE_BOOKS[0].id}` as any)}
        >
          <View style={styles.activeBookIcon}>
            <Ionicons name="book" size={24} color={Colors.primary} />
          </View>
          <View style={styles.activeBookInfo}>
            <Text style={styles.activeBookTitle} numberOfLines={1}>
              {SAMPLE_BOOKS[0].title}
            </Text>
            <Text style={styles.activeBookAuthor}>{SAMPLE_BOOKS[0].author}</Text>
            <View style={styles.progressBarWrapper}>
              <View style={[styles.progressBarFill, { width: '42%' }]} />
            </View>
          </View>
          <Text style={styles.percentageText}>42%</Text>
        </TouchableOpacity>

        {/* Trending Classics Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Public Domain</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore' as any)}>
            <Text style={styles.seeAllText}>Browse All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            horizontal
            data={booksToDisplay}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BookCard book={item} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        )}

        {/* Curated Recommendations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Curated by PagePulse AI</Text>
        </View>

        <View style={styles.curatedGrid}>
          {booksToDisplay.slice(0, 4).map((book) => (
            <BookCard key={book.id} book={book} compact />
          ))}
        </View>
      </ScrollView>

      {/* Floating AI Librarian Trigger */}
      <TouchableOpacity
        style={styles.floatingAiButton}
        activeOpacity={0.85}
        onPress={() => setAiModalVisible(true)}
      >
        <Ionicons name="sparkles" size={20} color="#FFF" />
        <Text style={styles.floatingAiText}>Ask AI</Text>
      </TouchableOpacity>

      {/* AI Companion Modal */}
      <AICompanionModal visible={aiModalVisible} onClose={() => setAiModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.canvas,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    ...Typography.hero,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  heroButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.title,
    fontSize: 18,
    color: Colors.dark.textPrimary,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  activeReadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.md,
  },
  activeBookIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.dark.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBookInfo: {
    flex: 1,
  },
  activeBookTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  activeBookAuthor: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  progressBarWrapper: {
    height: 5,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  percentageText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  horizontalList: {
    paddingLeft: Spacing.md,
  },
  curatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  floatingAiButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingAiText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
