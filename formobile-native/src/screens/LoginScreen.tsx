import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, saveUser } from '../utils/api';
import { Colors, commonStyles, shadow } from '../utils/theme';

interface Props {
  onLogin: (user: any) => void;
  onGoToSignup: () => void;
  onNeedsVerification: (email: string) => void;
  successMessage?: string;
  setSuccessMessage?: (msg: string) => void;
}

export default function LoginScreen({ onLogin, onGoToSignup, onNeedsVerification, successMessage, setSuccessMessage }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'code'>('email');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/login/', { email, password });
      await saveUser(res.data);
      onLogin(res.data);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.needs_verification) {
        onNeedsVerification(err.response.data.email);
      } else {
        setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSendCode = async () => {
    if (!forgotEmail.trim()) { setForgotError('Please enter your email.'); return; }
    try {
      setForgotLoading(true); setForgotError('');
      await api.post('/auth/forgot-password/', { email: forgotEmail });
      setForgotStep('code');
      setForgotSuccess('A reset code has been sent to your email.');
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Failed to send reset code.');
    } finally { setForgotLoading(false); }
  };

  const handleForgotResetPassword = async () => {
    if (!forgotCode.trim() || !forgotNewPassword.trim()) { setForgotError('Please fill in all fields.'); return; }
    try {
      setForgotLoading(true); setForgotError('');
      await api.post('/auth/reset-password/', { email: forgotEmail, code: forgotCode, new_password: forgotNewPassword });
      setForgotSuccess('Password reset successfully! You can now log in.');
      setTimeout(() => { setShowForgot(false); setForgotStep('email'); setForgotCode(''); setForgotNewPassword(''); setForgotEmail(''); setForgotSuccess(''); }, 2000);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Failed to reset password.');
    } finally { setForgotLoading(false); }
  };

  if (showForgot) {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.formCard}>
              <TouchableOpacity onPress={() => { setShowForgot(false); setForgotError(''); setForgotSuccess(''); }} style={{ marginBottom: 16 }}>
                <Feather name="arrow-left" size={22} color={Colors.slate600} />
              </TouchableOpacity>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                {forgotStep === 'email' ? 'Enter your email to receive a reset code.' : 'Enter the code and your new password.'}
              </Text>

              {forgotError ? <View style={commonStyles.errorBox}><Text style={commonStyles.errorText}>{forgotError}</Text></View> : null}
              {forgotSuccess ? <View style={commonStyles.successBox}><Text style={commonStyles.successText}>{forgotSuccess}</Text></View> : null}

              {forgotStep === 'email' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="mail" size={18} color={Colors.slate400} style={styles.inputIcon} />
                      <TextInput style={styles.inputWithIcon} value={forgotEmail} onChangeText={setForgotEmail} placeholder="you@example.com" placeholderTextColor={Colors.slate400} keyboardType="email-address" autoCapitalize="none" />
                    </View>
                  </View>
                  <TouchableOpacity style={commonStyles.buttonPrimary} onPress={handleForgotSendCode} disabled={forgotLoading}>
                    {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text style={commonStyles.buttonPrimaryText}>Send Reset Code</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>6-Digit Code</Text>
                    <TextInput style={[commonStyles.input, { textAlign: 'center', fontSize: 22, fontWeight: '800', letterSpacing: 6 }]} value={forgotCode} onChangeText={(t) => setForgotCode(t.replace(/\D/g, ''))} maxLength={6} placeholder="000000" placeholderTextColor={Colors.slate400} keyboardType="number-pad" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="lock" size={18} color={Colors.slate400} style={styles.inputIcon} />
                      <TextInput style={styles.inputWithIcon} value={forgotNewPassword} onChangeText={setForgotNewPassword} placeholder="••••••••" placeholderTextColor={Colors.slate400} secureTextEntry />
                    </View>
                  </View>
                  <TouchableOpacity style={commonStyles.buttonPrimary} onPress={handleForgotResetPassword} disabled={forgotLoading}>
                    {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text style={commonStyles.buttonPrimaryText}>Reset Password</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            {/* Logo */}
            <View style={styles.logoRow}>
              <Feather name="check-circle" size={28} color={Colors.blue600} />
              <Text style={styles.logoText}>TaskFlow</Text>
            </View>

            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Enter your details to access your tasks.</Text>

            {successMessage ? (
              <View style={[commonStyles.successBox, { marginTop: 12 }]}>
                <View style={commonStyles.rowBetween}>
                  <Text style={[commonStyles.successText, { flex: 1 }]}>{successMessage}</Text>
                  <TouchableOpacity onPress={() => setSuccessMessage?.('')}>
                    <Feather name="x" size={16} color={Colors.emerald700} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {error ? <View style={[commonStyles.errorBox, { marginTop: 12 }]}><Text style={commonStyles.errorText}>{error}</Text></View> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={18} color={Colors.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.slate400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color={Colors.slate400} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputWithIcon, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.slate400}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.slate400} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => { setShowForgot(true); setForgotEmail(email); }} style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: Colors.blue600, fontWeight: '500' }}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[commonStyles.buttonPrimary, { marginTop: 8 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={commonStyles.buttonPrimaryText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onGoToSignup}>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate50,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    ...shadow,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.blue600,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.slate900,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.slate500,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.slate700,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.slate800,
  },
  eyeBtn: {
    padding: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.slate600,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.blue600,
    fontWeight: '600',
  },
});
