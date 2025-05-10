import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, 
  Platform, Image, SafeAreaView, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import pb from '../lib/pocketbase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ChatScreen({ route, navigation }: any) {
  const { receiver } = route.params;
  const currentUser = pb.authStore.model;
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Alıcı bilgisinden gezinme başlığını ayarla
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          {receiver.avatar ? (
            <Image 
              source={{ uri: `${pb.baseUrl}/api/files/users/${receiver.id}/${receiver.avatar}` }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: stringToColor(receiver.fullName) }]}>
              <Text style={styles.headerAvatarText}>{getInitials(receiver.fullName)}</Text>
            </View>
          )}
          <Text style={styles.headerName}>{receiver.fullName}</Text>
        </View>
      ),
    });
  }, [navigation, receiver]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const result = await pb.collection('messages').getFullList({
        sort: 'created',
        expand: 'sender,receiver',
        filter: `(sender = "${currentUser?.id}" && receiver = "${receiver.id}") || (sender = "${receiver.id}" && receiver = "${currentUser?.id}")`,
      });

      // Mesajları işleyelim ve tarihlere göre gruplayalım
      const processedMessages = result.map(msg => ({
        ...msg,
        isFromMe: msg.sender === currentUser?.id,
        formattedTime: format(new Date(msg.created), 'HH:mm')
      }));

      setMessages(processedMessages);

      // Mesajları aldıktan sonra otomatik olarak en sona kaydır
      setTimeout(() => {
        if (flatListRef.current && processedMessages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 100);
    } catch (err) {
      console.error('Mesajlar alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  
    const unsubscribe = pb.collection('messages').subscribe('*', (e) => {
      const message = e.record;
      const isRelevant =
        (message.sender === currentUser?.id && message.receiver === receiver.id) ||
        (message.sender === receiver.id && message.receiver === currentUser?.id);
  
      if (isRelevant) {
        fetchMessages();
      }
    });
  
    return () => {
      pb.collection('messages').unsubscribe('*');
    };
  }, []);
  
  const sendMessage = async () => {
    if (newMessage.trim() === '') return;
    
    // Mesajı yerel state'e hemen ekleme işlemi için
    const tempMessage = {
      id: 'temp-' + Date.now(), // Geçici bir ID
      text: newMessage,
      sender: currentUser?.id,
      receiver: receiver?.id,
      created: new Date().toISOString(),
      isFromMe: true,
      formattedTime: format(new Date(), 'HH:mm')
    };
    
    // Önce yerel mesaj listesine ekle - hızlı görünüm güncellemesi için
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // İnput alanını hemen temizle
    const messageToSend = newMessage;
    setNewMessage('');
    
    // Mesaj gönderme işaretini başlat
    setSending(true);
    
    // Görünüm pozisyonunu kaydır
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 50);
    
    try {
      // Gerçek mesajı gönder
      const createdMsg = await pb.collection('messages').create({
        text: messageToSend,
        sender: currentUser?.id,
        receiver: receiver?.id,
      });
      
      // Geçici mesajı gerçek verilerle güncelle
      setMessages(prevMessages => prevMessages.map(msg => 
        msg.id === tempMessage.id ? {
          ...createdMsg,
          isFromMe: true,
          formattedTime: format(new Date(createdMsg.created), 'HH:mm')
        } : msg
      ));
      
      // Bazı durumlarda PocketBase subscribe etmeyebiliyor, bunu garanti etmek için
      // mesaj gönderildikten sonra kısa bir gecikmeden sonra mesajları yenileyebiliriz
      setTimeout(() => {
        fetchMessages();
      }, 500);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      
      // Hata durumunda geçici mesajı kaldır veya hata olarak işaretle
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
      
      Alert.alert(
        'Mesaj Gönderilemedi', 
        'Mesajınızı gönderirken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setSending(false);
    }
  };

  // Mesaj balonunun içerik kısmını render eden yardımcı fonksiyon
  const renderMessageContent = (item: any) => (
    <View>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTime}>
        {item.formattedTime}
      </Text>
    </View>
  );

  // FlatList işlemi için optimizasyonlar
  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showSenderInfo = !previousMessage || previousMessage.sender !== item.sender;
    
    return (
      <View style={[
        styles.messageWrapper,
        item.isFromMe ? styles.rightMessage : styles.leftMessage
      ]}>
        {!item.isFromMe && showSenderInfo && (
          <View style={styles.avatarContainer}>
            {receiver.avatar ? (
              <Image 
                source={{ uri: `${pb.baseUrl}/api/files/users/${receiver.id}/${receiver.avatar}` }}
                style={styles.messageAvatar}
              />
            ) : (
              <View style={[styles.messageAvatarPlaceholder, { backgroundColor: stringToColor(receiver.fullName) }]}>
                <Text style={styles.avatarText}>{getInitials(receiver.fullName)}</Text>
              </View>
            )}
          </View>
        )}
        <View style={[
          styles.messageBubble,
          item.isFromMe ? styles.myMessageBubble : styles.theirMessageBubble,
          !item.isFromMe && !showSenderInfo && styles.subsequentMessage,
          // Geçici mesaj için ek stil
          item.id.toString().startsWith('temp-') && styles.tempMessageBubble
        ]}>
          {renderMessageContent(item)}
          {item.id.toString().startsWith('temp-') && (
            <View style={styles.sendingIndicator}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            renderItem={renderItem}
            onContentSizeChange={() => {
              if (flatListRef.current && messages.length > 0) {
                flatListRef.current.scrollToEnd({ animated: false });
              }
            }}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Mesaj yazın..."
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline={true}
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
    maxWidth: '80%',
  },
  rightMessage: {
    alignSelf: 'flex-end',
  },
  leftMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 5,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '100%',
  },
  myMessageBubble: {
    backgroundColor: '#3498db',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  subsequentMessage: {
    marginLeft: 36,
  },
  messageText: {
    fontSize: 15,
    color: 'black',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.6,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#a0cfff',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  tempMessageBubble: {
    opacity: 0.8,
  },
  sendingIndicator: {
    position: 'absolute',
    right: 5,
    bottom: 5,
  },
});
