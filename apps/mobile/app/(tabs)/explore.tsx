import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import { Colors, BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import { BookCard } from '../../src/components/BookCard';
import { BookService, Book } from '../../src/services/api';
import { useAppTheme } from '../../src/store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';

type SearchMode = 'global' | 'semantic';

const LANGUAGES = [
  { code: 'all', label: '🌐 All Languages' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'hi', label: '🇮🇳 हिन्दी (Hindi)' },
  { code: 'mr', label: '🚩 मराठी (Marathi)' },
];

const CATEGORY_CHIPS = [
  'All Books',
  'Sci-Fi & Cyberpunk',
  'Victorian Mystery',
  'Gothic Horror',
  'Existential Philosophy',
  'Epic Fantasy',
  'Classic Romance',
  'Adventure & Sea',
  'Psychology & Mind',
];

export default function ExploreScreen() {
  const { colors, isDark } = useAppTheme();
  const { mode: urlMode } = useLocalSearchParams<{ mode?: string }>();
  const [searchMode, setSearchMode] = useState<SearchMode>(
    urlMode === 'semantic' ? 'semantic' : 'global'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState<string>('All Books');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Book[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (urlMode === 'semantic') {
      setSearchMode('semantic');
    } else if (urlMode === 'global') {
      setSearchMode('global');
    }
  }, [urlMode]);

  const handleSearch = async (
    queryText?: string,
    modeOverride?: SearchMode,
    languageOverride?: string
  ) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    const mode = modeOverride || searchMode;
    const lang = languageOverride !== undefined ? languageOverride : selectedLanguage;
    if (!q && lang === 'all') return;

    setLoading(true);
    setHasSearched(true);
    try {
      if (mode === 'global') {
        // Query global multi-provider catalog (DB + Open Library + Google Books API)
        const catalogRes = await BookService.getAll(1, 24, q || undefined, lang);
        setResults(catalogRes?.items || []);
      } else {
        // Semantic AI vector recommendation
        let semanticBooks: Book[] = [];
        try {
          const semRes = await BookService.semanticSearch(q, 14);
          if (semRes && semRes.length > 0) {
            semanticBooks = semRes.map((r: any) => r.book);
          }
        } catch (_) {}

        if (semanticBooks.length > 0) {
          setResults(semanticBooks);
        } else {
          // Fallback to catalog if vector embeddings query is too abstract
          const fallbackRes = await BookService.getAll(1, 14, q || undefined, lang);
          setResults(fallbackRes?.items || []);
        }
      }
    } catch (e) {
      console.log('Search fallback:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLanguage = (langCode: string) => {
    setSelectedLanguage(langCode);
    handleSearch(searchQuery, searchMode, langCode);
  };

  const handleSelectChip = (chip: string) => {
    setSelectedChip(chip);
    if (chip === 'All Books') {
      setSearchQuery('');
      if (selectedLanguage !== 'all') {
        handleSearch('', searchMode, selectedLanguage);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    } else {
      setSearchQuery(chip);
      handleSearch(chip, searchMode, selectedLanguage);
    }
  };

  const handleModeSwitch = (mode: SearchMode) => {
    setSearchMode(mode);
    if (searchQuery.trim() || selectedLanguage !== 'all') {
      handleSearch(searchQuery, mode, selectedLanguage);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedChip('All Books');
    if (selectedLanguage !== 'all') {
      handleSearch('', searchMode, selectedLanguage);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.canvas }]} edges={['top']}>
      {/* Header & Mode Switcher */}
      <View style={styles.searchHeader}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Explore & Search</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {searchMode === 'global'
            ? 'Search any novel, author, or classic across 20+ million books'
            : 'Find books using natural language vibes, emotions, and plot themes'}
        </Text>

        {/* Dual Mode Switcher */}
        <View style={[styles.modeSwitcher, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              searchMode === 'global' && { backgroundColor: Colors.primary },
            ]}
            onPress={() => handleModeSwitch('global')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="globe-outline"
              size={15}
              color={searchMode === 'global' ? '#FFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeTabText,
                searchMode === 'global' ? styles.modeActiveText : { color: colors.textSecondary },
              ]}
            >
              Global Catalog
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              searchMode === 'semantic' && { backgroundColor: Colors.primary },
            ]}
            onPress={() => handleModeSwitch('semantic')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="sparkles"
              size={15}
              color={searchMode === 'semantic' ? '#FFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeTabText,
                searchMode === 'semantic' ? styles.modeActiveText : { color: colors.textSecondary },
              ]}
            >
              AI Semantic Vibe
            </Text>
          </TouchableOpacity>
        </View>

        {/* Language Filter Chips */}
        <View style={styles.languageSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.languageChipsContent}>
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor: isSelected ? 'rgba(226, 133, 195, 0.18)' : colors.surface,
                      borderColor: isSelected ? Colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.langChipText,
                      { color: isSelected ? Colors.primary : colors.textSecondary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Search Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={Colors.primary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={
              searchMode === 'global'
                ? 'Type any book title, author, or novel...'
                : 'e.g. A melancholic story about pride and social classes...'
            }
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category / Mood Chips */}
      <View style={styles.chipsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
          {CATEGORY_CHIPS.map((chip, idx) => {
            const isSelected = selectedChip === chip;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.chip,
                  { backgroundColor: isSelected ? Colors.primary : colors.surface, borderColor: isSelected ? Colors.primary : colors.border },
                ]}
                onPress={() => handleSelectChip(chip)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.textSecondary }]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Result Count Status Bar */}
      {hasSearched && !loading && (
        <View style={styles.resultMetaRow}>
          <Text style={[styles.resultMetaText, { color: colors.textSecondary }]}>
            Found {results.length} books worldwide matching "{searchQuery}"
          </Text>
        </View>
      )}

      {/* Results View */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {searchMode === 'global'
              ? 'Querying global book database & Project Gutenberg...'
              : 'Synthesizing literary embeddings with AI...'}
          </Text>
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
          showsVerticalScrollIndicator={false}
        />
      ) : hasSearched ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={44} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Matches Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Try searching with broader terms or check the spelling of the title/author.
          </Text>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="compass-outline" size={54} color={Colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Explore Any Book or Novel</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Search worldwide titles in Global Catalog mode, or switch to AI Semantic Vibe to discover stories matching your mood.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.caption,
    marginTop: 2,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modeActiveText: {
    color: '#FFF',
    fontWeight: '700',
  },
  languageSection: {
    marginBottom: Spacing.sm,
  },
  languageChipsContent: {
    gap: Spacing.xs,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  langChipText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  chipsSection: {
    maxHeight: 46,
    marginBottom: Spacing.sm,
  },
  chipsContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultMetaRow: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  resultMetaText: {
    fontSize: 11,
    fontWeight: '600',
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
    gap: Spacing.xs,
  },
  loadingText: {
    fontSize: 13,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
