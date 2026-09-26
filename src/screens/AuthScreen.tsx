import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthProvider';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';

export const AuthScreen: React.FC = () => {
  const { theme } = useTheme();
  const { configured, signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleEmailAuth = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Details required', 'Enter your email address and password to continue.');
      return;
    }
    if (isSignUp && password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters for your password.');
      return;
    }

    setBusy(true);
    try {
      if (isSignUp) {
        const confirmationRequired = await signUp(normalizedEmail, password);
        if (confirmationRequired) {
          Alert.alert('Check your email', 'Use the confirmation link from Supabase, then sign in.');
          setIsSignUp(false);
        }
      } else {
        await signIn(normalizedEmail, password);
      }
    } catch (error) {
      Alert.alert('Could not continue', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleAuth = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Google sign-in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', marginBottom: 26 }}>
              <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="qr-code" size={30} color="#fff" />
              </View>
              <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginTop: 16 }}>Agon</Text>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                {isSignUp ? 'Create your account to get started' : 'Sign in to continue'}
              </Text>
            </View>

            <GlassCard radius={24}>
              {!configured && (
                <View style={{ padding: 12, borderRadius: 14, backgroundColor: theme.colors.warning + '18', marginBottom: 18 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700', lineHeight: 18 }}>
                    Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart Expo to enable sign-in.
                  </Text>
                </View>
              )}
              <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '800', marginBottom: 6 }}>EMAIL</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textTertiary}
                style={{ backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, color: theme.colors.text, fontSize: 14, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16 }}
              />
              <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '800', marginBottom: 6 }}>PASSWORD</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry
                textContentType={isSignUp ? 'newPassword' : 'password'}
                placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
                placeholderTextColor={theme.colors.textTertiary}
                onSubmitEditing={handleEmailAuth}
                style={{ backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, color: theme.colors.text, fontSize: 14, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20 }}
              />
              <GradientButton
                title={busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
                onPress={handleEmailAuth}
                fullWidth
                disabled={!configured || busy}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 18 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
                <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontWeight: '700', marginHorizontal: 12 }}>OR CONTINUE WITH</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
              </View>
              <GradientButton
                title="Google"
                variant="glass"
                icon={<Ionicons name="logo-google" size={17} color={theme.colors.text} />}
                onPress={handleGoogleAuth}
                fullWidth
                disabled={!configured || busy}
              />
              <Text
                onPress={() => setIsSignUp(current => !current)}
                style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '800', textAlign: 'center', marginTop: 20 }}
              >
                {isSignUp ? 'Already have an account? Sign in' : 'New to Agon? Create an account'}
              </Text>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};
