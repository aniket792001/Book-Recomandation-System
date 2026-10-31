import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAppTheme } from '../store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title = 'PagePulse AI', showSearch = true }) => {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Ionicons name="sparkles" size={16} color="#FFF" />
        </View>
        <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>

      <View style={styles.actions}>
        {showSearch && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/(tabs)/explore' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={[styles.streakBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="flame" size={16} color="#F97316" />
          <Text style={[styles.streakText, { color: colors.textPrimary }]}>3d</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.canvas,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  brandTitle: {
    ...Typography.title,
    color: Colors.dark.textPrimary,
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  streakText: {
    color: Colors.dark.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
