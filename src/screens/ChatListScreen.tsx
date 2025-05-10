import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import pb from '../lib/pocketbase';

type Props = NativeStackScreenProps<any>;

const MEILI_URL = 'https://getmeilimeilisearchv190-production-bb62.up.railway.app';
const MEILI_API_KEY = '6z1f4znnpkarxhgogh4k1ak8s447rwi2';

export default function ChatListScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const searchUsers = async (text: string) => {
    if (text.trim() === '') {
      setResults([]);
      setNoResults(false);
      return;
    }
  
    setIsSearching(true);
    setNoResults(false);

    try {
      const response = await axios.post(
        `${MEILI_URL}/indexes/users/search`,
        { q: text },
        {
          headers: {
            Authorization: `Bearer ${MEILI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      // Giriş yapan kullanıcıyı filtrele
      const currentUserId = pb.authStore.model?.id;
      const filteredResults = response.data.hits.filter(
        (user: any) => user.id !== currentUserId
      );
  
      setResults(filteredResults);
      setNoResults(filteredResults.length === 0);
    } catch (err: any) {
      console.error('❌ Arama hatası:', err.message || err);
      setResults([]);
      setNoResults(true);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleChatOpen = (user: any) => {
    navigation.navigate('Chat', { receiver: user });
  };

  return (
    <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Sohbet Başlat</Text>
              </View>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          placeholder="Kullanıcı ara..."
          style={styles.input}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            searchUsers(text);
          }}
        />
        {query.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              setQuery('');
              setResults([]);
              setNoResults(false);
            }}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={16} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {isSearching ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : noResults ? (
        <View style={styles.centerContent}>
          <Icon name="account-search-outline" size={60} color="#ccc" />
          <Text style={styles.noResultsText}>"{query}" için sonuç bulunamadı</Text>
        </View>
      ) : query.trim() === '' ? (
        <View style={styles.centerContent}>
          <Icon name="account-search" size={60} color="#ccc" />
          <Text style={styles.instructionText}>Sohbet başlatmak için kullanıcı arayın</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => handleChatOpen(item)} 
              style={styles.userItem}
            >
              <View style={styles.avatarContainer}>
                {item.avatar ? (
                  <Image 
                    source={{ uri: `${pb.baseUrl}/api/files/users/${item.id}/${item.avatar}` }} 
                    style={styles.avatar} 
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: stringToColor(item.fullName) }]}>
                    <Text style={styles.avatarText}>{getInitials(item.fullName)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.fullName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <View style={styles.chatIconContainer}>
                <Icon name="chat-outline" size={22} color="#3498db" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// Yardımcı fonksiyonlar
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function stringToColor(str: string): string {
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
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: { 
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  instructionText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  chatIconContainer: {
    padding: 8,
  },
});
