import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import { useLibraryStore, ReaderThemeKey } from '../../src/store/useLibraryStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useThemeStore, useAppTheme, AppThemeMode } from '../../src/store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { AuthModal } from '../../src/components/AuthModal';

export default function ProfileScreen() {
  const { readerTheme, readerFontSize, setReaderTheme, setReaderFontSize, readingHistory } = useLibraryStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { colors, isDark } = useAppTheme();
  const { themeMode, setThemeMode } = useThemeStore();
  const [authVisible, setAuthVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'otp' | 'password' | 'register'>('otp');

  // Real-time Reading Analytics & Gamification
  const booksCompleted = readingHistory.filter((h) => h.progressPercentage >= 95).length;
  const activeBooksCount = readingHistory.length;
  const totalPagesTurned = readingHistory.reduce((sum, h) => sum + (h.currentPage || 1), 0);
  const readingStreakDays = activeBooksCount > 0 ? Math.min(Math.max(1, activeBooksCount), 14) : 0;
  const weeklyGoalTarget = 50; // 50 pages reading target
  const weeklyGoalProgress = Math.min(100, Math.round((totalPagesTurned / weeklyGoalTarget) * 100));

  const achievements = [
    { id: 'first_book', icon: 'book', label: 'First Read', unlocked: activeBooksCount >= 1, desc: 'Started your 1st book' },
    { id: 'streak', icon: 'flame', label: 'On Fire', unlocked: readingStreakDays >= 2, desc: 'Active reading streak' },
    { id: 'night_owl', icon: 'moon', label: 'Night Owl', unlocked: readerTheme === 'night', desc: 'Midnight canvas reader' },
    { id: 'century', icon: 'trophy', label: 'Century', unlocked: totalPagesTurned >= 20, desc: 'Turned 20+ pages' },
  ];

  const themes: { key: ReaderThemeKey; label: string; bg: string; text: string }[] = [
    { key: 'night', label: 'Midnight', bg: '#0F172A', text: '#E2E8F0' },
    { key: 'day', label: 'Daylight', bg: '#FFFFFF', text: '#1A1A1A' },
    { key: 'sepia', label: 'Sepia', bg: '#FBF0D9', text: '#433422' },
    { key: 'rose', label: 'Soft Rose', bg: '#FFF5F9', text: '#2A1B24' },
  ];

  const openAuth = (mode: 'otp' | 'password' | 'register') => {
    setAuthMode(mode);
    setAuthVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.canvas }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card / Auth Prompt */}
        {isAuthenticated ? (
          <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#FFF" />
            </View>
            <View style={styles.userStatusBadge}>
              <Ionicons name="cloud-done" size={12} color={Colors.status.success} />
              <Text style={styles.userStatusText}>Cloud Synced</Text>
            </View>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.full_name || 'Avid Reader'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>

            <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{activeBooksCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Books</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{totalPagesTurned}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pages Read</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{readingStreakDays > 0 ? `${readingStreakDays}d` : '1d'}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reading Streak</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.guestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.guestIconRow}>
              <View style={styles.guestBadge}>
                <Ionicons name="sparkles" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guestTitle}>Sign In to PagePulse</Text>
                <Text style={styles.guestSub}>
                  Sync reading progress across all your devices and unlock AI recommendations.
                </Text>
              </View>
            </View>

            <View style={styles.guestBtnRow}>
              <TouchableOpacity
                style={styles.guestPrimaryBtn}
                onPress={() => openAuth('otp')}
                activeOpacity={0.8}
              >
                <Ionicons name="mail" size={16} color="#FFF" />
                <Text style={styles.guestPrimaryBtnText}>Email OTP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.guestSecondaryBtn}
                onPress={() => openAuth('password')}
                activeOpacity={0.8}
              >
                <Ionicons name="key" size={16} color={Colors.dark.textPrimary} />
                <Text style={styles.guestSecondaryBtnText}>Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Weekly Reading Goal & Streaks */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeaderRow}>
            <View style={styles.goalTitleContainer}>
              <Ionicons name="flame" size={20} color={Colors.primary} />
              <Text style={styles.goalTitle}>Weekly Reading Target</Text>
            </View>
            <Text style={styles.goalPercentText}>{weeklyGoalProgress}%</Text>
          </View>

          <View style={styles.goalProgressBarBg}>
            <View
              style={[
                styles.goalProgressBarFill,
                { width: `${weeklyGoalProgress}%` },
              ]}
            />
          </View>

          <View style={styles.goalFooterRow}>
            <Text style={styles.goalSubtitle}>
              {totalPagesTurned} of {weeklyGoalTarget} pages turned this week
            </Text>
            <Text style={styles.goalMotto}>
              {weeklyGoalProgress >= 100 ? 'Goal Crushed! 🎉' : 'Keep reading! 📖'}
            </Text>
          </View>
        </View>

        {/* Badges & Achievements */}
        <Text style={styles.sectionHeader}>Reading Badges & Milestones</Text>
        <View style={styles.badgesRow}>
          {achievements.map((a) => (
            <View
              key={a.id}
              style={[
                styles.badgeCard,
                !a.unlocked && styles.badgeLockedCard,
              ]}
            >
              <View
                style={[
                  styles.badgeIconCircle,
                  a.unlocked && { backgroundColor: 'rgba(226, 133, 195, 0.2)' },
                ]}
              >
                <Ionicons
                  name={a.icon as any}
                  size={20}
                  color={a.unlocked ? Colors.primary : Colors.dark.textSecondary}
                />
              </View>
              <Text style={[styles.badgeLabel, !a.unlocked && { opacity: 0.5 }]}>
                {a.label}
              </Text>
              <Text style={styles.badgeDesc} numberOfLines={1}>
                {a.desc}
              </Text>
            </View>
          ))}
        </View>

        {/* App Theme & Reader Preferences */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Appearance & Theme</Text>
        <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Application Theme</Text>
          <View style={styles.appThemeToggleRow}>
            {(
              [
                { mode: 'dark', label: 'Dark', icon: 'moon' },
                { mode: 'light', label: 'Light', icon: 'sunny' },
                { mode: 'system', label: 'System', icon: 'phone-portrait' },
              ] as const
            ).map((item) => {
              const active = themeMode === item.mode;
              return (
                <TouchableOpacity
                  key={item.mode}
                  style={[
                    styles.appThemeBtn,
                    { backgroundColor: active ? Colors.primary : colors.surfaceElevated, borderColor: colors.border },
                  ]}
                  onPress={() => setThemeMode(item.mode)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={16}
                    color={active ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text style={[styles.appThemeBtnText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Default Reading Canvas</Text>
          <View style={styles.themeRow}>
            {themes.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.themeCircle,
                  { backgroundColor: t.bg },
                  readerTheme === t.key && styles.activeThemeCircle,
                ]}
                onPress={() => setReaderTheme(t.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.themeLabel, { color: t.text }]}>{t.label[0]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Default Font Size ({readerFontSize}pt)</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => setReaderFontSize(Math.max(12, readerFontSize - 1))}
            >
              <Ionicons name="remove" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.stepValue, { color: colors.textPrimary }]}>{readerFontSize}</Text>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => setReaderFontSize(Math.min(28, readerFontSize + 1))}
            >
              <Ionicons name="add" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <Text style={styles.sectionHeader}>About PagePulse AI</Text>
        <View style={styles.settingCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0 (Production Engine)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Catalog Source</Text>
            <Text style={styles.infoValue}>Project Gutenberg & Open Library</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AI Model</Text>
            <Text style={styles.infoValue}>Google Gemini 2.5</Text>
          </View>
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Auth Modal for Email OTP and Password Login */}
      <AuthModal
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
        initialMode={authMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.canvas,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  userName: {
    ...Typography.title,
    color: Colors.dark.textPrimary,
  },
  userEmail: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.dark.border,
  },
  sectionHeader: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  settingCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  settingTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 4,
  },
  themeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThemeCircle: {
    borderColor: Colors.primary,
    transform: [{ scale: 1.1 }],
  },
  themeLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    color: Colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    width: 30,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: Colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.status.error,
  },
  logoutText: {
    color: Colors.status.error,
    fontSize: 14,
    fontWeight: '700',
  },
  userStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
  },
  userStatusText: {
    color: Colors.status.success,
    fontSize: 11,
    fontWeight: '600',
  },
  guestCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  guestIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  guestBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  guestTitle: {
    ...Typography.title,
    fontSize: 17,
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  guestSub: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  guestBtnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 4,
  },
  guestPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  guestPrimaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  guestSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.dark.secondary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  guestSecondaryBtnText: {
    color: Colors.dark.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.textPrimary,
  },
  goalPercentText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  goalProgressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  goalProgressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  goalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalSubtitle: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  goalMotto: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  badgeLockedCard: {
    opacity: 0.5,
  },
  badgeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 9,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  appThemeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  appThemeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  appThemeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
