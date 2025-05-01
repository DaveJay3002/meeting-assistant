import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content}>
        <Text style={[styles.heading, { color: theme.text }]}>
          Privacy Policy
        </Text>
        
        <Text style={[styles.lastUpdated, { color: theme.text }]}>
          Last Updated: June 15, 2023
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          At Memo, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          Information We Collect
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We collect information that you provide directly to us when you:
        </Text>
        
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Register for an account
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Record meetings
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Interact with the app's features
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Contact us directly
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          This information may include:
        </Text>
        
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Name and contact information
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Audio recordings of meetings
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Transcripts and summaries of recordings
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Information you provide in messages and communications
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          How We Use Your Information
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We use the information we collect to:
        </Text>
        
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Provide, maintain, and improve our services
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Process and complete transactions
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Send technical notices and support messages
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Respond to your comments and questions
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • Develop new products and services
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          Sharing Your Information
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We do not sell, trade, or otherwise transfer your personally identifiable information to third parties without your consent, except as described below:
        </Text>
        
        <Text style={[styles.listItem, { color: theme.text }]}>
          • With service providers who perform services on our behalf
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • To comply with legal obligations
        </Text>
        <Text style={[styles.listItem, { color: theme.text }]}>
          • To protect our rights and safety
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          Data Security
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or electronic storage is 100% secure.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          Your Choices
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          You can access and update your information through your account settings. You may also delete your account and associated data at any time.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          Changes to This Privacy Policy
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          Contact Us
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text, marginBottom: 40 }]}>
          If you have any questions about this Privacy Policy, please contact us at privacy@memoapp.com.
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 16,
  },
}); 