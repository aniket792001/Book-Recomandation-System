import React, { useState, useEffect } from 'react';
import {
  Modal,
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
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography } from '../constants/theme';
import { AuthService } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'otp' | 'password' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  initialMode = 'otp',
}) => {
  const [mode, setMode] = useState<'otp' | 'password' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [visible, initialMode]);

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
      const msg = err.response?.data?.detail || 'Failed to send OTP code. Please check your backend connection.';
      setErrorMsg(msg);
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
        onClose();
      }, 500);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid or expired verification code.';
      setErrorMsg(msg);
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
        onClose();
      }, 500);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await AuthService.register(email.trim(), password, fullName.trim() || undefined);
      await setAuth(
        res.access_token,
        {
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.full_name,
        },
        res.refresh_token
      );
      setSuccessMsg('Account created successfully!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Email might already be taken.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setOtpSent(false);
    setOtpCode('');
    setDemoCode(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.brandBadge}>
                <Ionicons name="sparkles" size={14} color="#FFF" />
              </View>
              <Text style={styles.headerTitle}>PagePulse AI</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Mode Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, mode === 'otp' && styles.activeTabItem]}
              onPress={() => {
                setMode('otp');
                resetForm();
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
                resetForm();
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

            <TouchableOpacity
              style={[styles.tabItem, mode === 'register' && styles.activeTabItem]}
              onPress={() => {
                setMode('register');
                resetForm();
              }}
            >
              <Ionicons
                name="person-add-outline"
                size={16}
                color={mode === 'register' ? Colors.primary : Colors.dark.textSecondary}
              />
              <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
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

            {/* TAB 1: EMAIL OTP */}
            {mode === 'otp' && (
              <View style={styles.formSection}>
                <Text style={styles.tagline}>
                  {otpSent
                    ? 'Check your inbox for the 6-digit access code'
                    : 'Sign in password-free with a secure one-time passcode'}
                </Text>

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
                      editable={!otpSent || countdown === 0}
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
                  <View style={styles.actionColumn}>
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
            )}

            {/* TAB 2: PASSWORD LOGIN */}
            {mode === 'password' && (
              <View style={styles.formSection}>
                <Text style={styles.tagline}>Welcome back to your personalized library</Text>

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
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed" size={18} color={Colors.dark.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.dark.textSecondary}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
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

                <TouchableOpacity
                  style={styles.altLink}
                  onPress={() => {
                    setMode('otp');
                    resetForm();
                  }}
                >
                  <Text style={styles.altLinkText}>
                    Prefer password-free? <Text style={styles.altLinkHighlight}>Use Email OTP</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 3: REGISTER */}
            {mode === 'register' && (
              <View style={styles.formSection}>
                <Text style={styles.tagline}>Create your account to sync reading across devices</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person" size={18} color={Colors.dark.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Jane Austen"
                      placeholderTextColor={Colors.dark.textSecondary}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>

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
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed" size={18} color={Colors.dark.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="At least 6 characters"
                      placeholderTextColor={Colors.dark.textSecondary}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Create Account</Text>
                      <Ionicons name="sparkles" size={18} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 18,
    color: Colors.dark.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.dark.canvas,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  activeTabItem: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  body: {
    padding: Spacing.lg,
  },
  tagline: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  formSection: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  actionColumn: {
    gap: Spacing.sm,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  altLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  altLinkText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  altLinkHighlight: {
    color: Colors.primary,
    fontWeight: '700',
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
    marginBottom: Spacing.sm,
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
    marginBottom: Spacing.sm,
  },
  successText: {
    flex: 1,
    color: Colors.status.success,
    fontSize: 13,
    fontWeight: '600',
  },
});
