import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import { BookCard } from '../../src/components/BookCard';
import { BookService, Book } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

const MOOD_FILTERS = [
  'Victorian Mystery',
  'Gothic Horror',
  'Romantic Classic',
  'Existential Philosophy',
  'Adventure & Sea',
  'Dystopian Future',
];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Book[]>([]);

  const handleSearch = async (queryText?: string) => {
    const q = queryText || searchQuery;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const response = await BookService.semanticSearch(q, 12);
      if (response && response.length > 0) {
        setResults(response.map((r: any) => r.book));
      } else {
        setResults([]);
      }
    } catch (e) {
      console.log('Semantic search fallback:', e);
      // Fallback sample results
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMood = (mood: string) => {
    if (selectedMood === mood) {
      setSelectedMood(null);
      setSearchQuery('');
    } else {
      setSelectedMood(mood);
      setSearchQuery(mood);
      handleSearch(mood);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Search Bar */}
      <View style={styles.searchHeader}>
        <Text style={styles.headerTitle}>Semantic Exploration</Text>
        <Text style={styles.headerSubtitle}>
          Describe a vibe, emotion, or theme in natural language
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color={Colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. A melancholic story about pride and social classes..."
            placeholderTextColor={Colors.dark.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mood Chips */}
      <View style={styles.chipsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
          {MOOD_FILTERS.map((mood, idx) => {
            const isSelected = selectedMood === mood;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => handleSelectMood(mood)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isSelected && styles.activeChipText]}>{mood}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results View */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching library via vector embeddings...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <BookCard book={item} compact />
            </View>
          )}
          contentContainerStyle={styles.resultsGrid}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="compass-outline" size={48} color={Colors.dark.secondary} />
          <Text style={styles.emptyTitle}>Find Your Next Great Read</Text>
          <Text style={styles.emptySubtitle}>
            Type a book concept or pick a mood chip above to start semantic vector search.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.canvas,
  },
  searchHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.title,
    color: Colors.dark.textPrimary,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.textPrimary,
    fontSize: 14,
  },
  chipsSection: {
    maxHeight: 46,
    marginBottom: Spacing.md,
  },
  chipsContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  activeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFF',
  },
  resultsGrid: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
  },
  gridItem: {
    flex: 0.5,
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
