import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import MeetingService, { Meeting } from '@/services/MeetingService';

// Auto-refresh interval in milliseconds (2 minutes)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

export default function LibraryScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  
  // Store refresh timer in ref to avoid issues with cleanup
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMeetings = async () => {
    if (!user || !user.uid) return;
    
    try {
      setLoading(true);
      // Attempt to fix any inconsistent meeting statuses
      await MeetingService.fixAllMeetingStatuses(user.uid);
      const userMeetings = await MeetingService.getUserMeetings(user.uid);
      setMeetings(userMeetings);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMeetings();
    setRefreshing(false);
  };

  // Function to check if any meetings are in processing state
  const hasProcessingMeetings = () => {
    return meetings.some(meeting => meeting.status === 'processing' || !meeting.status);
  };

  // Setup auto-refresh effect
  useEffect(() => {
    // Initial fetch
    fetchMeetings();
    
    // Set up auto-refresh timer
    const setupRefreshTimer = () => {
      // Clear any existing timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      
      // Setup a new timer
      refreshTimerRef.current = setInterval(() => {
        // Only auto-refresh if there are processing meetings
        if (hasProcessingMeetings()) {
          console.log('Auto-refreshing meeting list...');
          fetchMeetings();
        }
      }, AUTO_REFRESH_INTERVAL);
    };
    
    setupRefreshTimer();
    
    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [user]);
  
  // Reset refresh timer whenever meetings list changes
  useEffect(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    // Only set up a new timer if there are processing meetings
    if (hasProcessingMeetings()) {
      refreshTimerRef.current = setInterval(() => {
        console.log('Auto-refreshing meeting list...');
        fetchMeetings();
      }, AUTO_REFRESH_INTERVAL);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [meetings]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Processing...';
    
    // Convert Firebase timestamp to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const handleMeetingPress = (meetingId: string) => {
    // Navigate to meeting detail view
    router.push(`/meeting/${meetingId}`);
  };

  const getMeetingStatusIcon = (status: string | undefined) => {
    if (!status) {
      return <MaterialIcons name="pending" size={16} color={theme.primary} />;
    }
    
    switch (status) {
      case 'processing':
        return <MaterialIcons name="pending" size={16} color={theme.primary} />;
      case 'completed':
        return <MaterialIcons name="check-circle" size={16} color="green" />;
      case 'error':
        return <MaterialIcons name="error" size={16} color={theme.error} />;
      default:
        return <MaterialIcons name="pending" size={16} color={theme.primary} />;
    }
  };

  const isProcessingTooLong = (timestamp: any): boolean => {
    if (!timestamp) return false;
    
    // Convert Firebase timestamp to JS Date
    const createdDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    
    // Calculate difference in minutes
    const diffMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);
    
    // If processing for more than 5 minutes, consider it too long
    return diffMinutes > 5;
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      Alert.alert(
        'Delete Recording',
        'Are you sure you want to delete this recording? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              await MeetingService.deleteMeeting(meetingId);
              // Refresh the list after deletion
              await fetchMeetings();
              setLoading(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting meeting:', error);
      Alert.alert('Error', 'Failed to delete the recording.');
      setLoading(false);
    }
  };

  const handleFixMeetingStatus = async (meetingId: string) => {
    try {
      setLoading(true);
      await MeetingService.fixMeetingStatus(meetingId);
      await fetchMeetings();
    } catch (error) {
      console.error('Error fixing meeting status:', error);
      Alert.alert('Error', 'Failed to fix the meeting status.');
    } finally {
      setLoading(false);
    }
  };

  const renderMeetingCard = ({ item }: { item: Meeting }) => {
    // Generate a title if none exists
    const title = item.title || `Meeting ${formatDate(item.createdAt)}`;
    const processingTooLong = isProcessingTooLong(item.createdAt) && 
                             (item.status === 'processing' || !item.status);
    
    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={() => handleMeetingPress(item.id!)}
      >
        <Card style={[
          styles.card, 
          { 
            backgroundColor: theme.card,
            opacity: item.status === 'processing' ? 0.8 : 1,
            borderLeftColor: processingTooLong ? theme.error : undefined,
            borderLeftWidth: processingTooLong ? 4 : 0
          }
        ]}>
          <Card.Content>
            <View style={styles.titleContainer}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {title}
              </Text>
              <View style={styles.statusContainer}>
                {getMeetingStatusIcon(item.status)}
                <Text style={[
                  styles.statusText, 
                  { 
                    color: item.status === 'error' ? theme.error : 
                           item.status === 'completed' ? 'green' : 
                           theme.primary 
                  }
                ]}>
                  {(item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Processing')}
                </Text>
              </View>
            </View>
            
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <MaterialIcons name="calendar-today" size={16} color={theme.text} />
                <Text style={[styles.metaText, { color: theme.text }]}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteMeeting(item.id!)}
              >
                <MaterialIcons name="delete-outline" size={20} color={theme.error} />
              </TouchableOpacity>
            </View>
            
            {item.summary ? (
              <Text style={[styles.summaryText, { color: theme.text }]} numberOfLines={2}>
                {item.summary}
              </Text>
            ) : (
              <View style={styles.processingContainer}>
                {item.status === 'processing' || !item.status ? (
                  <>
                    <ActivityIndicator size="small" color={theme.primary} style={styles.processingIndicator} />
                    <Text style={[styles.processingText, { color: processingTooLong ? theme.error : theme.text }]}>
                      {processingTooLong 
                        ? "Processing taking longer than expected..." 
                        : "Processing your recording..."}
                    </Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => {
                        // Show alert with options
                        Alert.alert(
                          'Processing Options',
                          'What would you like to do?',
                          [
                            {
                              text: 'View Details Anyway',
                              onPress: () => handleMeetingPress(item.id!)
                            },
                            {
                              text: 'Retry Processing',
                              onPress: () => {
                                // This would ideally trigger reprocessing on the backend
                                Alert.alert('Feature Coming Soon', 'Retry functionality will be available in a future update.');
                                handleRefresh();
                              }
                            },
                            {
                              text: 'Fix Status',
                              onPress: () => handleFixMeetingStatus(item.id!)
                            },
                            {
                              text: 'Cancel',
                              style: 'cancel'
                            }
                          ]
                        );
                      }}
                    >
                      <MaterialIcons name="more-horiz" size={20} color={theme.primary} />
                    </TouchableOpacity>
                  </>
                ) : item.status === 'error' ? (
                  <Text style={[styles.processingText, { color: theme.error }]}>
                    Error processing this recording
                  </Text>
                ) : (
                  <Text style={[styles.processingText, { color: theme.text }]}>
                    Summary not available
                  </Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading your recordings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Your Recordings</Text>
        
        {/* Last updated time */}
        <Text style={[styles.lastRefreshText, { color: theme.border }]}>
          Last updated: {lastRefreshTime.toLocaleTimeString()}
        </Text>
      </View>
      
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
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
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
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lastRefreshText: {
    fontSize: 12,
    opacity: 0.7,
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
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  metaContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
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
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  processingIndicator: {
    marginRight: 8,
  },
  processingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  retryButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
  },
}); 