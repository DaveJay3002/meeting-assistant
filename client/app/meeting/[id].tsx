import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Appbar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';

// Tabs for the meeting details
const TABS = {
  SUMMARY: 'summary',
  TRANSCRIPT: 'transcript',
  CHAT: 'chat',
};

// Dummy meeting data for testing
const DUMMY_MEETINGS = {
  "meeting1": {
    id: 'meeting1',
    title: 'Project Kickoff Meeting',
    date: '2023-09-15T10:00:00Z',
    duration: '45 minutes',
    summary: 'The team discussed project goals, timeline, and resource allocation for the new mobile app development. Key decisions were made regarding tech stack and team responsibilities.',
    transcript: "John: Welcome everyone to our project kickoff. Let's start by discussing our objectives.\nSarah: I think we need to clarify the timeline first.\nMike: I agree with Sarah. Timeline will impact our technical choices.\nJohn: Good point. We have 3 months to complete the MVP.\nSarah: That's reasonable. I suggest we use React Native for cross-platform compatibility.\nMike: That makes sense. I can lead the backend development using Node.js.\nJohn: Perfect. Let's allocate resources now. Sarah, can you handle the UI/UX?\nSarah: Yes, I'll work with the design team to finalize mockups by next week.",
  },
  "meeting2": {
    id: 'meeting2',
    title: 'Weekly Status Update',
    date: '2023-09-22T14:00:00Z',
    duration: '30 minutes',
    summary: 'The team reviewed progress on individual tasks, identified blockers, and adjusted the sprint timeline. All members committed to completing their assigned tasks by the end of the week.',
    transcript: "Lisa: Let's go around and share our progress updates.\nTom: I've completed the authentication module but ran into issues with the API integration.\nLisa: What kind of issues?\nTom: The endpoints are returning unexpected data formats. I'm working with the backend team to resolve it.\nEmma: I've designed 60% of the UI screens. Should be done by Thursday.\nLisa: That's good progress. Any blockers besides Tom's API issue?\nEmma: Not from my side.\nTom: I might need an extra day for testing once the API issue is resolved.\nLisa: Noted. Let's adjust the timeline accordingly.",
  }
};

export default function MeetingDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const meetingId = id as string;
  
  const [meeting, setMeeting] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(TABS.SUMMARY);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    content: string;
    fromUser: boolean;
    timestamp: Date;
  }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const chatScrollViewRef = useRef<FlatList>(null);
  
  // Chat modal animation values
  const chatModalHeight = useSharedValue(0);
  const chatVisible = useSharedValue(0);
  
  useEffect(() => {
    // In a real app, fetch meeting data from Firebase or API
    // For now, use dummy data
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const meetingData = DUMMY_MEETINGS[meetingId] || null;
      setMeeting(meetingData);
      setLoading(false);
    }, 500);
    
    // No more WebSocket connection
  }, [meetingId]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };
  
  const handleBackPress = () => {
    // If chat is open, close it first
    if (activeTab === TABS.CHAT && chatVisible.value === 1) {
      closeChat();
      return;
    }
    
    // Otherwise go back to library
    router.back();
  };
  
  const handleTabPress = (tab: string) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setActiveTab(tab);
    
    // If chat tab is selected, open chat modal
    if (tab === TABS.CHAT) {
      openChat();
    }
  };
  
  const openChat = () => {
    chatModalHeight.value = withTiming(400, { duration: 300, easing: Easing.out(Easing.cubic) });
    chatVisible.value = withTiming(1, { duration: 300 });
  };
  
  const closeChat = () => {
    chatModalHeight.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) });
    chatVisible.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setActiveTab)(TABS.SUMMARY);
    });
  };
  
  const handleSendMessage = () => {
    if (!inputMessage.trim() || sendingMessage) return;
    
    // Create new message
    const newMessage = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      fromUser: true,
      timestamp: new Date(),
    };
    
    // Add message to chat
    setChatMessages(prev => [...prev, newMessage]);
    
    // Clear input
    setInputMessage('');
    
    // Set loading
    setSendingMessage(true);
    
    // Simulate AI response (instead of using WebSockets)
    setTimeout(() => {
      const aiMessage = {
        id: `ai-${Date.now()}`,
        content: "This is a simulated response. WebSocket functionality has been removed.",
        fromUser: false,
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
      setSendingMessage(false);
      
      // Scroll to bottom
      setTimeout(() => {
        chatScrollViewRef.current?.scrollToEnd();
      }, 100);
    }, 1000);
    
    // Scroll to bottom
    setTimeout(() => {
      chatScrollViewRef.current?.scrollToEnd();
    }, 100);
  };
  
  // Chat modal animation style
  const chatModalStyle = useAnimatedStyle(() => {
    return {
      height: chatModalHeight.value,
      opacity: chatVisible.value,
    };
  });
  
  // Render message item
  const renderMessageItem = ({ item }: { item: typeof chatMessages[0] }) => (
    <View style={[
      styles.messageContainer, 
      item.fromUser ? styles.userMessage : styles.aiMessage,
      { backgroundColor: item.fromUser ? theme.primary : theme.card }
    ]}>
      <Text style={[styles.messageText, { color: item.fromUser ? 'white' : theme.text }]}>
        {item.content}
      </Text>
    </View>
  );
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading meeting...</Text>
      </View>
    );
  }
  
  if (!meeting) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.text }]}>
          Meeting not found. It may have been deleted or you don't have access.
        </Text>
        <TouchableOpacity 
          style={[styles.errorButton, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <Appbar.Header style={{ backgroundColor: theme.background }}>
        <Appbar.BackAction color={theme.text} onPress={handleBackPress} />
        <Appbar.Content 
          title={meeting.title} 
          titleStyle={{ color: theme.text, fontSize: 18 }}
        />
      </Appbar.Header>
      
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <MaterialIcons name="calendar-today" size={16} color={theme.text} />
          <Text style={[styles.metaText, { color: theme.text }]}>
            {formatDate(meeting.date)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialIcons name="access-time" size={16} color={theme.text} />
          <Text style={[styles.metaText, { color: theme.text }]}>
            {meeting.duration}
          </Text>
        </View>
      </View>
      
      <View style={styles.tabBar}>
        {Object.values(TABS).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
              { borderBottomColor: activeTab === tab ? theme.primary : 'transparent' }
            ]}
            onPress={() => handleTabPress(tab)}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === tab ? theme.primary : theme.text }
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.contentContainer}>
        {activeTab === TABS.SUMMARY && (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.contentTitle, { color: theme.text }]}>Summary</Text>
            <Text style={[styles.contentText, { color: theme.text }]}>
              {meeting.summary}
            </Text>
          </ScrollView>
        )}
        
        {activeTab === TABS.TRANSCRIPT && (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.contentTitle, { color: theme.text }]}>Transcript</Text>
            {meeting.transcript.split('\n').map((line: string, index: number) => {
              // Split by speaker and message
              const parts = line.split(': ');
              if (parts.length > 1) {
                return (
                  <View key={index} style={styles.transcriptLine}>
                    <Text style={[styles.speaker, { color: theme.primary }]}>
                      {parts[0]}:
                    </Text>
                    <Text style={[styles.transcriptText, { color: theme.text }]}>
                      {parts.slice(1).join(': ')}
                    </Text>
                  </View>
                );
              }
              return (
                <Text key={index} style={[styles.transcriptText, { color: theme.text }]}>
                  {line}
                </Text>
              );
            })}
          </ScrollView>
        )}
        
        {activeTab === TABS.CHAT && (
          <View style={styles.chatPromptContainer}>
            <Text style={[styles.chatPromptTitle, { color: theme.text }]}>
              Ask AI about this meeting
            </Text>
            <Text style={[styles.chatPromptText, { color: theme.text }]}>
              You can ask questions about specific details, action items, decisions, or get a more detailed summary.
            </Text>
            <View style={styles.chatPromptExamples}>
              <TouchableOpacity 
                style={[styles.exampleButton, { backgroundColor: theme.card }]}
                onPress={() => setInputMessage("What were the main action items?")}
              >
                <Text style={[styles.exampleButtonText, { color: theme.text }]}>Action items</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exampleButton, { backgroundColor: theme.card }]}
                onPress={() => setInputMessage("Who attended this meeting?")}
              >
                <Text style={[styles.exampleButtonText, { color: theme.text }]}>Attendees</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exampleButton, { backgroundColor: theme.card }]}
                onPress={() => setInputMessage("What key decisions were made?")}
              >
                <Text style={[styles.exampleButtonText, { color: theme.text }]}>Decisions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      
      <Animated.View style={[styles.chatModal, chatModalStyle, { backgroundColor: theme.background }]}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatTitle, { color: theme.text }]}>Ask about this meeting</Text>
          <TouchableOpacity onPress={closeChat}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          ref={chatScrollViewRef}
          data={chatMessages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChatContainer}>
              <Text style={[styles.emptyChatText, { color: theme.text }]}>
                Ask a question about the meeting to get started.
              </Text>
            </View>
          }
        />
        
        <View style={[styles.inputContainer, { borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            placeholder="Ask a question..."
            placeholderTextColor={theme.border}
            value={inputMessage}
            onChangeText={setInputMessage}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  metaContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
  },
  transcriptLine: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  speaker: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  transcriptText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  chatPromptContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatPromptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  chatPromptText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  chatPromptExamples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  exampleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  exampleButtonText: {
    fontSize: 14,
  },
  chatModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatList: {
    padding: 12,
  },
  emptyChatContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyChatText: {
    textAlign: 'center',
    fontSize: 14,
  },
  messageContainer: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 