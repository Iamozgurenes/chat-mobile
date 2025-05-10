import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  Alert, ActivityIndicator, SafeAreaView, ScrollView 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import pb from '../lib/pocketbase';

type Props = NativeStackScreenProps<any>;

export default function ProfileScreen({ navigation }: Props) {
  const user = pb.authStore.model;
  const [loading, setLoading] = useState(false);
  
  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesaptan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          onPress: () => {
            pb.authStore.clear();
            navigation.replace('Login');
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  // Avatar için yardımcı fonksiyon
  const getAvatarUrl = () => {
    if (user?.avatar) {
      return `${pb.baseUrl}/api/files/users/${user.id}/${user.avatar}`;
    }
    return undefined;
  };
  
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
      '#9b59b6', '#1abc9c', '#d35400', '#34495e'
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color="#3498db" />
        ) : (
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <View style={styles.profileHeader}>
              {getAvatarUrl() ? (
                <Image source={{ uri: getAvatarUrl() }} style={styles.avatar} />
              ) : (
                <View 
                  style={[
                    styles.avatarPlaceholder, 
                    { backgroundColor: stringToColor(user?.fullName || 'User') }
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {getInitials(user?.fullName || 'User')}
                  </Text>
                </View>
              )}
              
              <Text style={styles.userName}>{user?.fullName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
              
              <View style={styles.infoItem}>
                <Icon name="email-outline" size={24} color="#666" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Icon name="account-outline" size={24} color="#666" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Ad Soyad</Text>
                  <Text style={styles.infoValue}>{user?.fullName}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Icon name="logout" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    paddingTop: 55,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  contentContainer: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
