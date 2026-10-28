import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import { Book } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

interface BookCardProps {
  book: Book;
  compact?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, compact = false }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/book/${book.id}` as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.container, compact && styles.compactContainer]}
    >
      <View style={styles.imageWrapper}>
        {book.cover_url ? (
          <Image source={{ uri: book.cover_url }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderCover}>
            <Ionicons name="book-outline" size={32} color={Colors.primary} />
            <Text style={styles.placeholderText} numberOfLines={2}>
              {book.title}
            </Text>
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={styles.ratingText}>{book.avg_rating > 0 ? book.avg_rating.toFixed(1) : '4.5'}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
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
    backgroundColor: Colors.dark.surface,
    overflow: 'hidden',
    position: 'relative',
    // 3D glow shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
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
    backgroundColor: Colors.dark.secondary,
  },
  placeholderText: {
    color: Colors.dark.textSecondary,
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
  details: {
    marginTop: Spacing.sm,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  author: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
