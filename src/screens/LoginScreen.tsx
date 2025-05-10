import React, { useState } from 'react';
import { 
  View, TextInput, StyleSheet, Text, Alert, 
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, 
  Platform, Image, SafeAreaView 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import pb from '../lib/pocketbase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    
    // Email validation
    if (!email.trim()) {
      setEmailError('Email adresi gerekli');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Geçerli bir email adresi girin');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError('Şifre gerekli');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await pb.collection('users').authWithPassword(email, password);
      navigation.replace('HomeTabs');
    } catch (error: any) {
      Alert.alert(
        'Giriş Hatası',
        error.data?.message || 'Giriş yapılamadı. Email ve şifrenizi kontrol edin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Icon name="chat" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>ModernChat</Text>
          <Text style={styles.tagline}>Güvenli ve Hızlı Mesajlaşma</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Giriş Yap</Text>
          
          <View style={styles.inputWrapper}>
            <Icon name="email-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="Email adresi"
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          
          <View style={styles.inputWrapper}>
            <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="Şifre"
              secureTextEntry={!showPassword}
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.showHideButton}
            >
              <Icon
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              Hesabın yok mu? <Text style={styles.registerTextBold}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: 40,
  },
  showHideButton: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    color: '#e74c3c',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 12,
  },
  loginButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerTextBold: {
    fontWeight: 'bold',
    color: '#3498db',
  },
});
