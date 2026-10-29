import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import { AuthService } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: any = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await AuthService.sendOtp(email.trim());
      setOtpSent(true);
      setCountdown(60);
      if (res.demo_code) {
        setDemoCode(res.demo_code);
        setOtpCode(res.demo_code);
      }
      setSuccessMsg(`Verification code sent to ${email.trim()}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await AuthService.verifyOtp(email.trim(), otpCode.trim());
      await setAuth(
        res.access_token,
        {
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.full_name,
        },
        res.refresh_token
      );
      setSuccessMsg('Successfully authenticated!');
      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await AuthService.login(email.trim(), password);
      await setAuth(
        res.access_token,
        {
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.full_name,
        },
        res.refresh_token
      );
      setSuccessMsg('Welcome back!');
      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(tabs)' as any)}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.dark.textPrimary} />
          </TouchableOpacity>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Ionicons name="sparkles" size={14} color="#FFF" />
            </View>
            <Text style={styles.brandText}>PagePulse AI</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Welcome Back</Text>
            <Text style={styles.heroSubtitle}>
              Sign in to sync your library, reading progress, and AI companion conversations.
            </Text>
          </View>

          {/* Mode Switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, mode === 'otp' && styles.activeTabItem]}
              onPress={() => {
                setMode('otp');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={mode === 'otp' ? Colors.primary : Colors.dark.textSecondary}
              />
              <Text style={[styles.tabText, mode === 'otp' && styles.activeTabText]}>
                Email OTP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, mode === 'password' && styles.activeTabItem]}
              onPress={() => {
                setMode('password');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              <Ionicons
                name="key-outline"
                size={16}
                color={mode === 'password' ? Colors.primary : Colors.dark.textSecondary}
              />
              <Text style={[styles.tabText, mode === 'password' && styles.activeTabText]}>
                Password
              </Text>
            </TouchableOpacity>
          </View>

          {/* Feedback Banners */}
          {errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.status.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {successMsg && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          {/* Form */}
          {mode === 'otp' ? (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail" size={18} color={Colors.dark.textSecondary} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.com"
                    placeholderTextColor={Colors.dark.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!otpSent}
                  />
                </View>
              </View>

              {otpSent && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>6-Digit Verification Code</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
                    <TextInput
                      style={[styles.textInput, styles.otpInput]}
                      placeholder="123456"
                      placeholderTextColor={Colors.dark.textSecondary}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otpCode}
                      onChangeText={setOtpCode}
                    />
                  </View>
                  {demoCode && (
                    <View style={styles.demoHelper}>
                      <Ionicons name="information-circle" size={16} color={Colors.secondary} />
                      <Text style={styles.demoHelperText}>
                        Dev Fast-Pass: <Text style={styles.demoCodeBadge}>{demoCode}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {!otpSent ? (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Send Magic Code</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={{ gap: Spacing.sm }}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
                        <Ionicons name="checkmark-done" size={18} color="#FFF" />
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleSendOtp}
                    disabled={countdown > 0 || loading}
                  >
                    <Text
                      style={[
                        styles.resendText,
                        countdown > 0 && { color: Colors.dark.textSecondary },
                      ]}
                    >
                      {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail" size={18} color={Colors.dark.textSecondary} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.com"
                    placeholderTextColor={Colors.dark.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/forgot-password' as any)}
                  >
                    <Text style={styles.forgotLink}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed" size={18} color={Colors.dark.textSecondary} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.dark.textSecondary}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color={Colors.dark.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handlePasswordLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Sign In</Text>
                    <Ionicons name="log-in-outline" size={18} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Footer Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account yet?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={styles.footerHighlight}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.canvas,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    ...Typography.title,
    fontSize: 16,
    color: Colors.dark.textPrimary,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  heroSection: {
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    ...Typography.hero,
    fontSize: 26,
    color: Colors.dark.textPrimary,
  },
  heroSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
  },
  activeTabItem: {
    backgroundColor: Colors.dark.canvas,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  formCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forgotLink: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dark.canvas,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: Colors.dark.textPrimary,
    fontSize: 14,
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  demoHelper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
  },
  demoHelperText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  demoCodeBadge: {
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xl,
  },
  footerText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  footerHighlight: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: Colors.status.error,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    color: Colors.status.error,
    fontSize: 13,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: Colors.status.success,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  successText: {
    flex: 1,
    color: Colors.status.success,
    fontSize: 13,
    fontWeight: '600',
  },
});

