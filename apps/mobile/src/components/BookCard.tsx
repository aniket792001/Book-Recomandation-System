import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import { Book } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../store/useThemeStore';

interface BookCardProps {
  book: Book;
  compact?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, compact = false }) => {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const handlePress = () => {
    router.push(`/book/${book.id}` as any);
  };

  const hasFullNovel = !!book.gutenberg_id || book.format === 'epub';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.container, compact && styles.compactContainer]}
    >
      <View style={[styles.imageWrapper, { backgroundColor: colors.surface, shadowColor: colors.primary }]}>
        {book.cover_url ? (
          <Image source={{ uri: book.cover_url }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="book-outline" size={32} color={Colors.primary} />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]} numberOfLines={2}>
              {book.title}
            </Text>
          </View>
        )}

        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#FBBF24" />
          <Text style={styles.ratingText}>{book.avg_rating > 0 ? book.avg_rating.toFixed(1) : '4.8'}</Text>
        </View>

        {/* Full Text / Global Badge */}
        {hasFullNovel && (
          <View style={styles.formatBadge}>
            <Text style={styles.formatText}>FULL NOVEL</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>
          {book.author}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 150,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
  },
  compactContainer: {
    width: 120,
    marginRight: Spacing.sm,
  },
  imageWrapper: {
    width: '100%',
    height: 210,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  placeholderText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  formatBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.90)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  details: {
    marginTop: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  author: {
    fontSize: 12,
    marginTop: 2,
  },
});
