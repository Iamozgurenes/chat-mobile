import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import pb from '../lib/pocketbase';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

type Props = NativeStackScreenProps<any>;

export default function HomeScreen({ navigation }: Props) {
  const user = pb.authStore.model;
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

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

  const fetchConversations = async (retry = 0) => {
    if (!user?.id) {
      console.log('Kullanıcı oturumu bulunamadı');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Sorgu başlatılıyor, kullanıcı ID:', user.id);
      
      if (!pb.authStore.isValid) {
        console.log('Oturum geçersiz, yeniden giriş yapılmalı');
        Alert.alert('Oturum Hatası', 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.');
        handleLogout();
        return;
      }
      
      const filter = `sender = "${user.id}" || receiver = "${user.id}"`;
      console.log('Kullanılan filtre:', filter);
      
      const messages = await pb.collection('messages').getFullList({
        sort: '-created',
        expand: 'sender,receiver',
        filter: filter,
        timeout: 10000,
      });
      
      console.log(`${messages.length} mesaj alındı`);
  
      const seen = new Set();
      const convMap: any[] = [];
  
      for (const msg of messages) {
        let otherUser = null;
        let otherUserId = null;
  
        // Hangi kullanıcı bizim değilse onu al
        if (msg.sender === user.id) {
          otherUserId = msg.receiver;
          otherUser = msg?.expand?.receiver;
        } else {
          otherUserId = msg.sender;
          otherUser = msg?.expand?.sender;
        }
  
        // Eğer expand çalışmadıysa ID üzerinden getir
        if (!otherUser && otherUserId) {
          try {
            otherUser = await pb.collection('users').getOne(otherUserId);
          } catch (userErr) {
            console.log(`Kullanıcı bilgisi getirilemedi (ID: ${otherUserId}):`, userErr);
            continue;
          }
        }
  
        if (otherUser && !seen.has(otherUser.id)) {
          seen.add(otherUser.id);
          // Avatarı ve tarih formatlama ekleyelim
          convMap.push({
            user: otherUser,
            lastMessage: msg.text,
            timestamp: msg.created,
            isFromMe: msg.sender === user.id,
            avatar: otherUser.avatar ? `${pb.baseUrl}/api/files/users/${otherUser.id}/${otherUser.avatar}` : null,
            formattedTime: formatDistanceToNow(new Date(msg.created), { addSuffix: true, locale: tr })
          });
        }
      }
  
      setConversations(convMap);
      setRetryCount(0); // Başarılı olunca retry sayısını sıfırla
    } catch (err: any) {
   
      
      // Daha detaylı hata bilgisi
      if (err.status) {
        console.log(`Hata kodu: ${err.status}, Detay: ${err.data?.message || 'Bilinmeyen hata'}`);
      }
      
      // Eğer maksimum tekrar sayısına ulaşılmadıysa otomatik tekrar et
      if (retry < MAX_RETRIES) {
        console.log(`Tekrar deneme: ${retry + 1}/${MAX_RETRIES}`);
        setTimeout(() => fetchConversations(retry + 1), 1500); // 1.5 saniye bekle ve tekrar dene
        return;
      }
      
      setRetryCount(retry);
      
      // Kullanıcıya bir bildirim göster
      Alert.alert(
        'Sohbet Listesi Yüklenemedi',
        'Sohbet listesi alınırken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
        [
          { 
            text: 'Tekrar Dene', 
            onPress: () => fetchConversations(0) 
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };
  

  const openChat = (user: any) => {
    navigation.navigate('Chat', { receiver: user });
  };

  // Navigation olaylarını dinleyerek ekran odaklandığında konuşmaları güncelle
  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
      return () => {};
    }, [])
  );

  useEffect(() => {
    fetchConversations();

    const unsubscribe = pb.collection('messages').subscribe('*', (e) => {
      const msg = e.record;

      // ID'ler string, null değilse eşleştir
      if (
        msg?.sender === user?.id ||
        msg?.receiver === user?.id
      ) {
        fetchConversations();
      }
    });

    return () => {
      pb.collection('messages').unsubscribe('*');
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="chat-processing" size={28} color="#3498db" style={styles.headerLogo} />
        <Text style={styles.headerTitle}>Ana sayfa</Text>
      </View>
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loaderText}>Sohbetler yükleniyor...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="chat-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              {retryCount >= MAX_RETRIES 
                ? "Sohbetler yüklenemedi. Tekrar denemek için aşağı çekin." 
                : "Henüz bir sohbetin yok"}
            </Text>
            <TouchableOpacity
              style={styles.startChatButton}
              onPress={() => navigation.navigate('ChatList')}
            >
              <Text style={styles.startChatText}>Sohbet Başlat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.user.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openChat(item.user)} style={styles.conversationItem}>
                <View style={styles.avatarContainer}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: stringToColor(item.user.fullName) }]}>
                      <Text style={styles.avatarText}>{getInitials(item.user.fullName)}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.userName}>{item.user.fullName}</Text>
                    <Text style={styles.messageTime}>{item.formattedTime}</Text>
                  </View>
                  <View style={styles.messagePreview}>
                    {item.isFromMe && <Text style={styles.sentByMe}>Siz: </Text>}
                    <Text 
                      style={styles.lastMessage} 
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.lastMessage}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            refreshing={loading}
            onRefresh={() => fetchConversations(0)}
          />
        )}
      </View>
{/* 
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="logout" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.newChatButton} 
          onPress={() => navigation.navigate('ChatList')}
        >
          <Icon name="message-plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View> */}
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
    backgroundColor: '#f8f9fa'
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
  headerLogo: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  startChatButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3498db',
    borderRadius: 20,
  },
  startChatText: {
    color: 'white',
    fontWeight: '500',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  avatarContainer: {
    marginRight: 15,
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
  messageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentByMe: {
    fontWeight: '500',
    color: '#666',
    fontSize: 14,
  },
  lastMessage: {
    color: '#666',
    fontSize: 14,
    flex: 1,
  },
  newChatButton: {
    backgroundColor: '#3498db',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buttonIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: '500',
  },
});
