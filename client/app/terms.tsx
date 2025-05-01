import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

export default function TermsOfServiceScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content}>
        <Text style={[styles.heading, { color: theme.text }]}>
          Terms of Service
        </Text>
        
        <Text style={[styles.lastUpdated, { color: theme.text }]}>
          Last Updated: June 15, 2023
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Please read these Terms of Service ("Terms") carefully before using the Memo mobile application operated by Memo Technologies, Inc.
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          1. Use of Service
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Memo provides a platform for recording, transcribing, and analyzing meetings. You agree to use the Service only for lawful purposes and in accordance with these Terms.
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer or mobile device. You agree to accept responsibility for all activities that occur under your account.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          2. User Content
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Our Service allows you to record, transcribe, and store content, including but not limited to audio recordings, transcripts, and meeting notes ("User Content").
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          You retain all rights to your User Content. By uploading or sharing User Content, you grant Memo a worldwide, non-exclusive, royalty-free license to use, process, and store your User Content for the purpose of providing the Service.
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          You are solely responsible for your User Content and the consequences of posting or publishing it. You affirm, represent, and warrant that you own or have the necessary licenses, rights, consents, and permissions to use and authorize Memo to use your User Content.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          3. Recording Consent
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          You acknowledge and agree that you are responsible for obtaining all necessary consents from meeting participants before recording any meeting through the Service. You must comply with all applicable laws regarding the recording of audio conversations.
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Memo is not responsible for any violations of consent or privacy laws resulting from your use of the Service.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          4. Intellectual Property
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of Memo and its licensors. The Service is protected by copyright, trademark, and other laws.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          5. Termination
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          6. Limitation of Liability
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          In no event shall Memo, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          7. Changes
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        </Text>
        
        <Text style={[styles.subheading, { color: theme.text }]}>
          8. Contact Us
        </Text>
        
        <Text style={[styles.paragraph, { color: theme.text, marginBottom: 40 }]}>
          If you have any questions about these Terms, please contact us at terms@memoapp.com.
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
}); 