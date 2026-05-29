import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../utils/api';
import { Colors, commonStyles, shadow } from '../utils/theme';

interface Props {
  onSignupComplete: (email: string, code?: string) => void;
  onGoToLogin: () => void;
}

export default function SignupScreen({ onSignupComplete, onGoToLogin }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [cityAddress, setCityAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const mime = result.assets[0].mimeType || 'image/jpeg';
      setProfilePicture(`data:${mime};base64,${result.assets[0].base64}`);
    }
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/signup/', {
        username, email,
        first_name: firstName, middle_name: middleName, last_name: lastName,
        age: age ? parseInt(age) : null,
        occupation, city_address: cityAddress,
        profile_picture: profilePicture,
        password,
      });
      onSignupComplete(email, res.data.verification_code);
    } catch (err: any) {
      if (err.response?.data) {
        setError(Object.values(err.response.data).flat().join(', '));
      } else {
        setError('Signup failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <Text style={styles.title}>Create an account</Text>
            <Text style={styles.subtitle}>Start managing your tasks efficiently.</Text>

            {error ? <View style={commonStyles.errorBox}><Text style={commonStyles.errorText}>{error}</Text></View> : null}

            {/* Profile Picture */}
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Feather name="camera" size={28} color={Colors.slate400} />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Feather name="upload" size={12} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Profile Picture</Text>

            {/* Section: Personal Details */}
            <Text style={styles.sectionTitle}>Personal Details</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput style={commonStyles.input} value={firstName} onChangeText={setFirstName} placeholderTextColor={Colors.slate400} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput style={commonStyles.input} value={lastName} onChangeText={setLastName} placeholderTextColor={Colors.slate400} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Middle Name</Text>
              <TextInput style={commonStyles.input} value={middleName} onChangeText={setMiddleName} placeholderTextColor={Colors.slate400} />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { width: 90, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput style={commonStyles.input} value={age} onChangeText={setAge} keyboardType="number-pad" placeholderTextColor={Colors.slate400} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Occupation</Text>
                <TextInput style={commonStyles.input} value={occupation} onChangeText={setOccupation} placeholderTextColor={Colors.slate400} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City Address</Text>
              <TextInput style={commonStyles.input} value={cityAddress} onChangeText={setCityAddress} placeholderTextColor={Colors.slate400} />
            </View>

            {/* Section: Account Info */}
            <Text style={styles.sectionTitle}>Account Info</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Username *</Text>
                <TextInput style={commonStyles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholderTextColor={Colors.slate400} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput style={commonStyles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.slate400} />
              </View>
            </View>

            {/* Section: Security */}
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={16} color={Colors.slate400} style={{ marginRight: 8 }} />
                <TextInput style={[styles.inputInner, { flex: 1 }]} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholderTextColor={Colors.slate400} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 6 }}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={Colors.slate400} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={16} color={Colors.slate400} style={{ marginRight: 8 }} />
                <TextInput style={[styles.inputInner, { flex: 1 }]} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} placeholderTextColor={Colors.slate400} />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 6 }}>
                  <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={16} color={Colors.slate400} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[commonStyles.buttonPrimary, { marginTop: 16 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={commonStyles.buttonPrimaryText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onGoToLogin}>
                <Text style={styles.footerLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate50 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },
  formCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, ...shadow, borderWidth: 1, borderColor: Colors.slate100 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.slate900, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.slate500, textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: Colors.slate400, textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: Colors.slate100, paddingBottom: 6, marginTop: 20, marginBottom: 12 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: Colors.slate700, marginBottom: 4 },
  row: { flexDirection: 'row' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.slate50, borderWidth: 1, borderColor: Colors.slate200, borderRadius: 14, paddingHorizontal: 12 },
  inputInner: { paddingVertical: 12, fontSize: 14, color: Colors.slate800 },
  avatarContainer: { alignSelf: 'center', marginBottom: 4, position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: Colors.blue500 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.slate100, borderWidth: 1, borderColor: Colors.slate200, alignItems: 'center', justifyContent: 'center' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.blue600, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { fontSize: 11, fontWeight: '500', color: Colors.slate500, textAlign: 'center', marginBottom: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14, color: Colors.slate600 },
  footerLink: { fontSize: 14, color: Colors.blue600, fontWeight: '600' },
});
