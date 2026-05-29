import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, saveUser } from '../utils/api';
import { Colors, commonStyles, shadow } from '../utils/theme';

interface Props {
  email: string;
  onVerificationSuccess: (user: any) => void;
  onGoToLogin: () => void;
}

export default function VerificationScreen({ email, onVerificationSuccess, onGoToLogin }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await api.post('/auth/verify/', { email, code });
      setSuccess('Verification successful! Logging you in...');
      await saveUser(res.data);
      setTimeout(() => onVerificationSuccess(res.data), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError('');
      setSuccess('');
      await api.post('/auth/resend-code/', { email });
      setSuccess('A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Feather name="shield" size={32} color={Colors.blue600} />
            </View>

            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We have sent a verification code to{' '}
              <Text style={{ fontWeight: '600', color: Colors.slate800 }}>{email || 'your email'}</Text>.
              {'\n'}Please enter the 6-digit code below.
            </Text>

            {success ? <View style={commonStyles.successBox}><Text style={commonStyles.successText}>{success}</Text></View> : null}
            {error ? <View style={commonStyles.errorBox}><Text style={commonStyles.errorText}>{error}</Text></View> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={Colors.slate400}
                keyboardType="number-pad"
                textAlign="center"
              />
            </View>

            <TouchableOpacity style={[commonStyles.buttonPrimary, { marginTop: 8 }]} onPress={handleSubmit} disabled={loading || resending}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={commonStyles.buttonPrimaryText}>Verify & Log In</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResend} disabled={loading || resending} style={styles.resendBtn}>
              <Text style={styles.resendText}>
                {resending ? 'Resending Code...' : 'Resend Verification Code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onGoToLogin} style={styles.backBtn}>
              <Text style={styles.backText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate50 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  formCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 28, ...shadow, borderWidth: 1, borderColor: Colors.slate100 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.blue50, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.slate900, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.slate500, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: Colors.slate700, marginBottom: 6 },
  codeInput: {
    backgroundColor: Colors.slate50, borderWidth: 1, borderColor: Colors.slate200, borderRadius: 14,
    paddingVertical: 14, fontSize: 24, fontWeight: '800', letterSpacing: 8, color: Colors.slate800,
  },
  resendBtn: { alignItems: 'center', marginTop: 20 },
  resendText: { fontSize: 14, color: Colors.blue600, fontWeight: '500' },
  backBtn: { alignItems: 'center', marginTop: 12 },
  backText: { fontSize: 14, color: Colors.slate500 },
});
