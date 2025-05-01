import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Card, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

// Dummy data for testing
const DUMMY_MEETINGS = [
  {
    id: 'meeting1',
    title: 'Project Kickoff Meeting',
    date: '2023-09-15T10:00:00Z',
    duration: '45 minutes',
    summary: 'The team discussed project goals, timeline, and resource allocation for the new mobile app development.'
  },
  {
    id: 'meeting2',
    title: 'Weekly Status Update',
    date: '2023-09-22T14:00:00Z',
    duration: '30 minutes',
    summary: 'The team reviewed progress on individual tasks, identified blockers, and adjusted the sprint timeline.'
  }
];

export default function LibraryScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState(DUMMY_MEETINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, we would fetch meetings from Firebase or API
    // For now, just use dummy data
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setMeetings(DUMMY_MEETINGS);
      setLoading(false);
    }, 500);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleMeetingPress = (meetingId: string) => {
    // Navigate to meeting detail view
    router.push(`/meeting/${meetingId}`);
  };

  const renderMeetingCard = ({ item }: { item: typeof DUMMY_MEETINGS[0] }) => (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => handleMeetingPress(item.id)}
    >
      <Card style={[styles.card, { backgroundColor: theme.card }]}>
        <Card.Content>
          <Title style={{ color: theme.text }}>{item.title}</Title>
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <MaterialIcons name="calendar-today" size={16} color={theme.text} />
              <Text style={[styles.metaText, { color: theme.text }]}>
                {formatDate(item.date)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="access-time" size={16} color={theme.text} />
              <Text style={[styles.metaText, { color: theme.text }]}>
                {item.duration}
              </Text>
            </View>
          </View>
          <Paragraph style={{ color: theme.text, marginTop: 8 }} numberOfLines={2}>
            {item.summary}
          </Paragraph>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.headerText, { color: theme.text }]}>Your Recordings</Text>
      
      {meetings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="library-books" size={64} color={theme.primary} />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            No recordings yet. Start by recording a meeting from the Home tab.
          </Text>
        </View>
      ) : (
        <FlatList
          data={meetings}
          renderItem={renderMeetingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    elevation: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    marginTop: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
}); 