import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Appbar } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, deleteDoc, doc, DocumentData } from 'firebase/firestore';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import MeetingService from '@/services/MeetingService';
import StorageService from '@/services/StorageService';
import { db } from '@/constants/Firebase';

interface MeetingInfo {
  id: string;
  status: string;
  createdAt: any;
  hasSummary: boolean;
  hasTranscript: boolean;
  hasPdf: boolean;
}

export default function TestScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleDeleteAllMeetings = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'You need to be logged in to perform this action');
      return;
    }

    Alert.alert(
      'Delete All Recordings',
      'Are you sure you want to delete ALL your recordings? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setResults(['Starting cleanup...']);

              const count = await MeetingService.deleteAllUserMeetings(user.uid);
              
              setResults(prev => [...prev, `Deleted ${count} meetings successfully`]);
            } catch (error: any) {
              console.error('Error deleting meetings:', error);
              setResults(prev => [...prev, `Error: ${error.message || 'Unknown error'}`]);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCleanStorage = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'You need to be logged in to perform this action');
      return;
    }

    Alert.alert(
      'Clean Storage Files',
      'Are you sure you want to delete ALL your storage files? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clean Storage',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setResults(['Starting storage cleanup...']);

              const cleanupResults = await MeetingService.cleanAllUserStorage(user.uid);
              
              setResults(prev => [...prev, 'Storage cleanup results:', ...cleanupResults]);
            } catch (error: any) {
              console.error('Error cleaning storage:', error);
              setResults(prev => [...prev, `Error: ${error.message || 'Unknown error'}`]);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCheckForDuplicates = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'You need to be logged in to perform this action');
      return;
    }

    try {
      setLoading(true);
      setResults(['Checking for duplicate meetings...']);
      
      // Get all meetings for this user
      const meetingsCollection = collection(db, 'moms');
      const meetingsQuery = query(
        meetingsCollection,
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(meetingsQuery);
      
      if (querySnapshot.empty) {
        setResults(prev => [...prev, 'No meetings found for this user.']);
        setLoading(false);
        return;
      }
      
      setResults(prev => [...prev, `Found ${querySnapshot.size} total meetings`]);
      
      // Group meetings by audio path to find duplicates
      const meetingsByAudioPath: Record<string, MeetingInfo[]> = {};
      const duplicates: Record<string, MeetingInfo[]> = {};
      let totalDuplicates = 0;
      
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data() as DocumentData;
        const audioPath = data.audioPath as string;
        
        if (!meetingsByAudioPath[audioPath]) {
          meetingsByAudioPath[audioPath] = [];
        }
        
        meetingsByAudioPath[audioPath].push({
          id: docSnap.id,
          status: data.status || 'unknown',
          createdAt: data.createdAt,
          hasSummary: !!data.summary,
          hasTranscript: !!data.transcript,
          hasPdf: !!data.pdfPath
        });
      });
      
      // Find duplicates (more than 1 meeting with same audio path)
      Object.keys(meetingsByAudioPath).forEach(audioPath => {
        const meetings = meetingsByAudioPath[audioPath];
        
        if (meetings.length > 1) {
          duplicates[audioPath] = meetings;
          totalDuplicates += meetings.length - 1; // Count all except the first as duplicates
        }
      });
      
      if (totalDuplicates === 0) {
        setResults(prev => [...prev, '✅ No duplicate meetings found!']);
        setLoading(false);
        return;
      }
      
      setResults(prev => [...prev, `⚠️ Found ${totalDuplicates} duplicate meetings:`]);
      
      // Print details of duplicates
      Object.keys(duplicates).forEach(audioPath => {
        const meetings = duplicates[audioPath];
        
        setResults(prev => [...prev, `\nAudio path: ${audioPath}`]);
        setResults(prev => [...prev, `Has ${meetings.length} records:`]);
        
        meetings.forEach((meeting: MeetingInfo, index: number) => {
          setResults(prev => [...prev, 
            `- ${meeting.id} (${meeting.status}) - Summary: ${meeting.hasSummary ? 'Yes' : 'No'}, Transcript: ${meeting.hasTranscript ? 'Yes' : 'No'}`
          ]);
        });
      });
      
      // Ask if we should fix duplicates
      Alert.alert(
        'Fix Duplicates',
        `Found ${totalDuplicates} duplicate meetings. Do you want to fix them?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Fix Duplicates',
            onPress: async () => {
              setResults(prev => [...prev, '\n🛠️ Fixing duplicates...']);
              
              let deletedCount = 0;
              
              for (const audioPath in duplicates) {
                const meetings = duplicates[audioPath];
                
                // Skip the first one (we'll keep it)
                for (let i = 1; i < meetings.length; i++) {
                  const meetingId = meetings[i].id;
                  setResults(prev => [...prev, `Deleting duplicate meeting: ${meetingId}`]);
                  
                  await deleteDoc(doc(db, 'moms', meetingId));
                  deletedCount++;
                }
              }
              
              setResults(prev => [...prev, `\n✅ Successfully deleted ${deletedCount} duplicate meetings!`]);
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error checking for duplicates:', error);
      setResults(prev => [...prev, `Error: ${error.message || 'Unknown error'}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleListMeetings = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'You need to be logged in to perform this action');
      return;
    }

    try {
      setLoading(true);
      setResults(['Fetching meetings...']);

      const meetings = await MeetingService.getUserMeetings(user.uid);
      
      setResults(prev => [
        ...prev, 
        `Found ${meetings.length} meetings:`, 
        ...meetings.map(m => `- ${m.id}: ${m.title || 'Untitled'} (${m.status})`)
      ]);
    } catch (error: any) {
      console.error('Error listing meetings:', error);
      setResults(prev => [...prev, `Error: ${error.message || 'Unknown error'}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleFixMeetingStatuses = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'You need to be logged in to perform this action');
      return;
    }

    try {
      setLoading(true);
      setResults(['Fixing meeting statuses...']);

      await MeetingService.fixAllMeetingStatuses(user.uid);
      
      setResults(prev => [...prev, 'Fixed meeting statuses successfully']);
      
      // Refresh the list to show updated statuses
      await handleListMeetings();
    } catch (error: any) {
      console.error('Error fixing meeting statuses:', error);
      setResults(prev => [...prev, `Error: ${error.message || 'Unknown error'}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.background }}>
        <Appbar.BackAction onPress={() => router.back()} color={theme.text} />
        <Appbar.Content title="Admin Tools" titleStyle={{ color: theme.text }} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <Text style={[styles.warning, { color: theme.error }]}>
          ⚠️ Warning: These actions are for admin use only.
          Use with caution!
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleListMeetings}
            disabled={loading}
          >
            <MaterialIcons name="list" size={20} color="white" />
            <Text style={styles.buttonText}>List All Recordings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleFixMeetingStatuses}
            disabled={loading}
          >
            <MaterialIcons name="healing" size={20} color="white" />
            <Text style={styles.buttonText}>Fix Meeting Statuses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#ff9800' }]}
            onPress={handleCheckForDuplicates}
            disabled={loading}
          >
            <MaterialIcons name="find-replace" size={20} color="white" />
            <Text style={styles.buttonText}>Check For Duplicates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#ff9800' }]}
            onPress={handleCleanStorage}
            disabled={loading}
          >
            <MaterialIcons name="cleaning-services" size={20} color="white" />
            <Text style={styles.buttonText}>Clean Storage Files</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.error }]}
            onPress={handleDeleteAllMeetings}
            disabled={loading}
          >
            <MaterialIcons name="delete-forever" size={20} color="white" />
            <Text style={styles.buttonText}>Delete ALL Recordings</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        {results.length > 0 && (
          <View style={[styles.resultsContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.resultsTitle, { color: theme.text }]}>Results:</Text>
            {results.map((result, index) => (
              <Text 
                key={index} 
                style={[
                  styles.resultText, 
                  { 
                    color: result.startsWith('Error') ? theme.error : theme.text,
                    fontWeight: result.startsWith('-') ? 'normal' : 'bold'
                  }
                ]}
              >
                {result}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  warning: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'red',
  },
  buttonContainer: {
    marginVertical: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    paddingLeft: 10,
  },
}); 