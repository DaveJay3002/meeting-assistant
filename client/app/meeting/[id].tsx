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
  FlatList,
  Linking,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Appbar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import MeetingService, { Meeting } from '@/services/MeetingService';
import StorageService from '@/services/StorageService';
import OpenAIService from '@/services/OpenAIService';
import SuggestedQuestion from '@/components/ui/SuggestedQuestion';

// Tabs for the meeting details
const TABS = {
  SUMMARY: 'summary',
  TRANSCRIPT: 'transcript',
  PDF: 'pdf',
};

export default function MeetingDetailScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const meetingId = id as string;
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState(TABS.SUMMARY);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    content: string;
    fromUser: boolean;
    timestamp: Date;
  }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  
  // Add suggested questions
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "What were the key decisions made?",
    "Who attended this meeting?",
    "What action items were assigned?",
    "Summarize this meeting briefly.",
    "What are the main points discussed?"
  ]);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const chatScrollViewRef = useRef<FlatList>(null);
  
  // Chat modal animation values
  const chatModalHeight = useSharedValue(0);
  const chatVisible = useSharedValue(0);
  
  const fetchMeetingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const meetingData = await MeetingService.getMeeting(meetingId);
      
      if (!meetingData) {
        setError('Meeting not found');
        setLoading(false);
        return;
      }
      
      setMeeting(meetingData);
      
      // If meeting has PDF, download it
      if (meetingData.pdfPath && meetingData.status === 'completed') {
        await downloadPdf(meetingData.pdfPath);
      }
      
    } catch (error) {
      console.error('Error fetching meeting:', error);
      setError('Failed to load meeting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const downloadPdf = async (pdfPath: string) => {
    try {
      setLoadingPdf(true);
      
      // Get download URL from Firebase Storage
      const downloadUrl = await StorageService.getFileUrl(pdfPath);
      
      // Create local file name
      const fileName = pdfPath.split('/').pop() || 'meeting-summary.pdf';
      
      // Platform specific handling
      if (Platform.OS === 'web') {
        // For web platform, we'll just open the PDF in a new tab
        setPdfUri(downloadUrl);
        setLoadingPdf(false);
        return downloadUrl;
      } else {
        // For native platforms, download the file
        const localUri = `${FileSystem.documentDirectory}${fileName}`;
        
        try {
          // Download the file
          const { uri } = await FileSystem.downloadAsync(downloadUrl, localUri);
          
          setPdfUri(uri);
          setLoadingPdf(false);
          
          return uri;
        } catch (downloadError) {
          console.error('Error downloading PDF file:', downloadError);
          // Fallback to just returning the URL
          setPdfUri(downloadUrl);
          setLoadingPdf(false);
          return downloadUrl;
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setLoadingPdf(false);
      return null;
    }
  };
  
  const openPdf = async () => {
    try {
      if (!pdfUri) {
        if (meeting?.pdfPath) {
          const uri = await downloadPdf(meeting.pdfPath);
          if (!uri) throw new Error('Failed to download PDF');
        } else {
          throw new Error('PDF not available');
        }
      }
      
      // Open PDF based on platform
      if (Platform.OS === 'web') {
        // For web, open in a new tab
        window.open(pdfUri, '_blank');
      } else if (Platform.OS === 'ios') {
        await Sharing.shareAsync(pdfUri);
      } else {
        try {
          const contentUri = await FileSystem.getContentUriAsync(pdfUri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: 'application/pdf',
          });
        } catch (error) {
          console.error('Error opening PDF with native viewer:', error);
          // Fallback to opening in browser
          Linking.openURL(pdfUri);
        }
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open PDF. Please try again.');
    }
  };
  
  const handleFixMeetingStatus = async () => {
    try {
      setLoading(true);
      
      // If the meeting has a summary but no PDF or is stuck in processing
      if (meeting && meeting.id) {
        await MeetingService.fixMeetingStatus(meeting.id);
        await fetchMeetingData();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fixing meeting:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to fix meeting status. Please try again.');
    }
  };
  
  useEffect(() => {
    fetchMeetingData();
    
    // Remove interval-based update to improve performance
    // Users can manually refresh with the refresh button
  }, [meetingId]);
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Processing...';
    
    // Convert Firebase timestamp to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };
  
  const handleBackPress = () => {
    // If chat is expanded, collapse it first
    if (isChatExpanded) {
      closeChat();
      return;
    }
    
    // Otherwise go back to library
    router.back();
  };
  
  const handleTabPress = (tab: string) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // If PDF tab and PDF not available yet, don't switch
    if (tab === TABS.PDF && !pdfUri && meeting?.status !== 'completed') {
      Alert.alert('PDF Not Available', 'The PDF is not available yet. Please wait for processing to complete.');
      return;
    }
    
    setActiveTab(tab);
    
    // If chat tab is selected, open chat modal
    if (tab === TABS.CHAT) {
      openChat();
    }
    
    // If PDF tab is selected, open PDF
    if (tab === TABS.PDF) {
      openPdf();
    }
  };
  
  const openChat = () => {
    setIsChatExpanded(true);
    chatModalHeight.value = withTiming(400, { duration: 300, easing: Easing.out(Easing.cubic) });
    chatVisible.value = withTiming(1, { duration: 300 });
  };
  
  const closeChat = () => {
    chatModalHeight.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) });
    chatVisible.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setIsChatExpanded)(false);
    });
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage) return;
    if (!meeting?.transcript) {
      Alert.alert('Error', 'Cannot answer questions without a transcript.');
      return;
    }
    
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
    
    // Prepare a placeholder for the AI response
    const aiMessage = {
      id: `ai-${Date.now()}`,
      content: "",
      fromUser: false,
      timestamp: new Date(),
    };
    
    setChatMessages(prev => [...prev, aiMessage]);
    
    try {
      // Call your OpenAI API here using the transcript as context
      // This is a placeholder for the real implementation
      setStreamingResponse("");
      await streamOpenAIResponse(inputMessage, meeting.transcript, aiMessage.id);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      
      // Update the AI message with error content
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? {...msg, content: "Sorry, I encountered an error. Please try again."} 
            : msg
        )
      );
    } finally {
      setSendingMessage(false);
      setStreamingResponse("");
      
      // Scroll to bottom
      setTimeout(() => {
        chatScrollViewRef.current?.scrollToEnd();
      }, 100);
    }
  };
  
  // Function to stream OpenAI response
  const streamOpenAIResponse = async (question: string, transcript: string, messageId: string) => {
    try {
      // Check if transcript is available and has sufficient content
      if (!transcript || transcript.trim().length < 10) {
        // Update the message with an error response
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? {...msg, content: "I don't have enough transcript data to answer your question. Please ensure the meeting has been fully processed."} 
              : msg
          )
        );
        return;
      }
      
      // Set up a callback function that updates the chat message in real-time
      const onTokenReceived = (token: string) => {
        setStreamingResponse(prev => prev + token);
        
        // Update the message in real-time as tokens arrive
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? {...msg, content: (msg.content || '') + token} 
              : msg
          )
        );
        
        // Scroll to the bottom as new content arrives
        setTimeout(() => {
          chatScrollViewRef.current?.scrollToEnd({ animated: false });
        }, 100);
      };
      
      // Call the OpenAI service with streaming
      await OpenAIService.streamChatCompletion(question, transcript, onTokenReceived);
      
      // The full response will be built up in the chatMessages state through the callback
    } catch (error) {
      console.error('Error in OpenAI streaming response:', error);
      
      // Update the message with a user-friendly error
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? {...msg, content: "I'm having trouble connecting to the AI service. Please check your connection and try again in a moment."} 
            : msg
        )
      );
      
      // Optionally show an alert for critical errors
      if (error instanceof Error && error.message.includes('API key')) {
        Alert.alert(
          'Configuration Error', 
          'The AI service is not properly configured. Please contact support.',
          [{ text: 'OK' }]
        );
      }
    }
  };
  
  // Handle selecting a suggested question
  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
    // Optional: Uncomment if you want to auto-send the question
    // setTimeout(() => {
    //   handleSendMessage();
    // }, 100);
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
      <Text style={[styles.messageTime, { color: item.fromUser ? 'rgba(255,255,255,0.7)' : theme.border }]}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading meeting data...</Text>
      </View>
    );
  }
  
  if (error || !meeting) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <MaterialIcons name="error-outline" size={64} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.text }]}>
          {error || 'Meeting not found'}
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
  
  // Meeting is still processing
  if (meeting.status === 'processing') {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Appbar.Header style={{ backgroundColor: theme.background }}>
          <Appbar.BackAction onPress={handleBackPress} color={theme.text} />
          <Appbar.Content title="Meeting Details" titleStyle={{ color: theme.text }} />
        </Appbar.Header>
        
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.processingTitle, { color: theme.text }]}>
            Processing Your Recording
          </Text>
          <Text style={[styles.processingText, { color: theme.text }]}>
            We're transcribing and summarizing your meeting. This may take a few minutes.
          </Text>
          <Text style={[styles.processingDate, { color: theme.text }]}>
            Recording uploaded: {formatDate(meeting.createdAt)}
          </Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: theme.primary }]}
            onPress={fetchMeetingData}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
          {meeting?.status === 'processing' && (
            <TouchableOpacity 
              style={styles.fixButton}
              onPress={handleFixMeetingStatus}
            >
              <MaterialIcons name="refresh" size={16} color={theme.primary} />
              <Text style={[styles.fixButtonText, { color: theme.primary }]}>
                Fix Status
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }
  
  // Meeting had an error
  if (meeting.status === 'error') {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Appbar.Header style={{ backgroundColor: theme.background }}>
          <Appbar.BackAction onPress={handleBackPress} color={theme.text} />
          <Appbar.Content title="Meeting Details" titleStyle={{ color: theme.text }} />
        </Appbar.Header>
        
        <View style={styles.processingContainer}>
          <MaterialIcons name="error-outline" size={64} color={theme.error} />
          <Text style={[styles.processingTitle, { color: theme.error }]}>
            Processing Error
          </Text>
          <Text style={[styles.processingText, { color: theme.text }]}>
            There was an error processing your recording. Please try again later or contact support.
          </Text>
          <Text style={[styles.processingDate, { color: theme.text }]}>
            Recording uploaded: {formatDate(meeting.createdAt)}
          </Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.refreshButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }
  
  // Main return for complete meeting screen
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Appbar.Header style={{ backgroundColor: theme.background }}>
        <Appbar.BackAction onPress={handleBackPress} color={theme.text} />
        <Appbar.Content 
          title={meeting.title || `Meeting ${formatDate(meeting.createdAt)}`} 
          titleStyle={{ color: theme.text }} 
        />
      </Appbar.Header>
      
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <MaterialIcons name="calendar-today" size={16} color={theme.text} />
          <Text style={[styles.metaText, { color: theme.text }]}>
            {formatDate(meeting.createdAt)}
          </Text>
        </View>
      </View>
      
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === TABS.SUMMARY && [styles.activeTab, { borderBottomColor: theme.primary }]
          ]}
          onPress={() => handleTabPress(TABS.SUMMARY)}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === TABS.SUMMARY ? theme.primary : theme.text }
          ]}>
            Summary
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === TABS.TRANSCRIPT && [styles.activeTab, { borderBottomColor: theme.primary }]
          ]}
          onPress={() => handleTabPress(TABS.TRANSCRIPT)}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === TABS.TRANSCRIPT ? theme.primary : theme.text }
          ]}>
            Transcript
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === TABS.PDF && [styles.activeTab, { borderBottomColor: theme.primary }]
          ]}
          onPress={() => handleTabPress(TABS.PDF)}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === TABS.PDF ? theme.primary : theme.text }
          ]}>
            PDF
          </Text>
          {loadingPdf && (
            <ActivityIndicator size="small" color={theme.primary} style={styles.pdfLoadingIndicator} />
          )}
        </TouchableOpacity>
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
              {meeting.summary || 'Summary not available.'}
            </Text>
          </ScrollView>
        )}
        
        {activeTab === TABS.TRANSCRIPT && (
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.contentTitle, { color: theme.text }]}>Transcript</Text>
            <Text style={[styles.transcriptText, { color: theme.text }]}>
              {meeting.transcript || 'Transcript not available.'}
            </Text>
          </ScrollView>
        )}
      </View>
      
      {/* Fixed Chat Button */}
      {!isChatExpanded && (
        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: theme.primary }]}
          onPress={openChat}
        >
          <MaterialIcons name="chat" size={24} color="white" />
          <Text style={styles.chatButtonText}>Ask AI about this meeting</Text>
        </TouchableOpacity>
      )}
      
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
              {/* Suggested questions */}
              <View style={styles.suggestedQuestionsContainer}>
                {suggestedQuestions.map((question, index) => (
                  <SuggestedQuestion 
                    key={index} 
                    text={question} 
                    onPress={() => handleSuggestedQuestion(question)} 
                  />
                ))}
              </View>
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
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  processingDate: {
    fontSize: 14,
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
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
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontWeight: '500',
  },
  pdfLoadingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
  },
  chatModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 12,
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
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  emptyChatContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyChatText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
  },
  suggestedQuestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixButtonText: {
    fontSize: 14,
    marginLeft: 8,
  },
  chatButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chatButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
}); 