import React, { useState } from 'react';
import { 
  View, TextInput, StyleSheet, Text, Alert, 
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, 
  Platform, ScrollView, SafeAreaView 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import pb from '../lib/pocketbase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  // Form validation state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [fullNameError, setFullNameError] = useState('');

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
    
    // Full name validation
    if (!fullName.trim()) {
      setFullNameError('Ad Soyad alanı gerekli');
      isValid = false;
    } else {
      setFullNameError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError('Şifre gerekli');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Şifre en az 8 karakter olmalı');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Password confirmation validation
    if (password !== passwordConfirm) {
      setPasswordConfirmError('Şifreler eşleşmiyor');
      isValid = false;
    } else {
      setPasswordConfirmError('');
    }
    
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        fullName,
      });

      Alert.alert(
        'Kayıt Başarılı',
        'Hesabın oluşturuldu. Şimdi giriş yapabilirsin.',
        [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Kayıt Hatası',
        error.data?.message || 'Kayıt sırasında bir hata oluştu.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <Icon name="account-plus" size={40} color="#3498db" />
              <Text style={styles.title}>Yeni Hesap Oluştur</Text>
              <Text style={styles.subtitle}>
                Ücretsiz hesap oluşturarak hemen mesajlaşmaya başlayın
              </Text>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Icon name="account-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="Ad Soyad"
                  style={styles.input}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (fullNameError) setFullNameError('');
                  }}
                />
              </View>
              {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}
              
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
              
              <View style={styles.inputWrapper}>
                <Icon name="lock-check-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="Şifre Tekrar"
                  secureTextEntry={!showPasswordConfirm}
                  style={[styles.input, styles.passwordInput]}
                  value={passwordConfirm}
                  onChangeText={(text) => {
                    setPasswordConfirm(text);
                    if (passwordConfirmError) setPasswordConfirmError('');
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  style={styles.showHideButton}
                >
                  <Icon
                    name={showPasswordConfirm ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {passwordConfirmError ? <Text style={styles.errorText}>{passwordConfirmError}</Text> : null}
              
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                style={styles.loginLink}
              >
                <Text style={styles.loginText}>
                  Zaten hesabın var mı? <Text style={styles.loginTextBold}>Giriş Yap</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
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
  registerButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginTextBold: {
    fontWeight: 'bold',
    color: '#3498db',
  },
});
