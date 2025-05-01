import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

export default function AboutScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content}>
        <Text style={[styles.heading, { color: theme.text }]}>
          Welcome to Memo
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Memo is an AI-powered note-taking app designed to transform the way you record and interact with meetings. Our mission is to help you capture every important detail without the distraction of manual note-taking.
        </Text>
        
        <Text style={[styles.heading, { color: theme.text }]}>
          Our Story
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Memo was founded in 2023 by a team of professionals who were frustrated with the traditional meeting experience. Too often, valuable insights were lost because people were focused on taking notes rather than fully engaging in the conversation.
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We believe that technology should enhance human connection, not detract from it. That's why we created Memo - to handle the tedious task of recording and organizing information, so you can be fully present in your meetings.
        </Text>
        
        <Text style={[styles.heading, { color: theme.text }]}>
          How It Works
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Memo uses advanced speech recognition technology to transcribe your meetings in real-time. Our AI then analyzes the transcript to generate a concise summary, highlighting key points, action items, and decisions.
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          But we don't stop there. With our integrated AI chat interface, you can ask questions about your meeting and get instant answers. Need to know who was assigned a specific task? Wondering what decision was made about a particular topic? Just ask Memo.
        </Text>
        
        <Text style={[styles.heading, { color: theme.text }]}>
          Our Values
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          • Privacy: Your meeting data belongs to you. We employ end-to-end encryption and never share your information with third parties.
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          • Accessibility: We believe everyone should have access to tools that enhance productivity. That's why we design Memo to be intuitive and accessible to all users.
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          • Innovation: We're constantly exploring new ways to leverage AI to make Memo even more helpful and intuitive.
        </Text>
        
        <Text style={[styles.heading, { color: theme.text }]}>
          Join Us
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We're excited to have you as part of the Memo community. Together, we're redefining what's possible in meeting productivity and collaboration.
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text, marginBottom: 40 }]}>
          Thank you for choosing Memo!
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
}); 