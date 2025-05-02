import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
// Using expo-av instead of deprecated expo-audio
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming,
  Easing,
  interpolate,
  runOnJS
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import StorageService from '@/services/StorageService';
import MeetingService from '@/services/MeetingService';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const durationRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const buttonScale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(1);
  const recordingPulse = useSharedValue(1);

  useEffect(() => {
    // Clean up
    return () => {
      stopRecording();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Start duration counter
      durationRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Start pulsing animation
      recordingPulse.value = withRepeat(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      // Clear duration counter
      if (durationRef.current) {
        clearInterval(durationRef.current);
        durationRef.current = null;
      }
      setRecordingDuration(0);
      
      // Reset pulsing animation
      recordingPulse.value = 1;
    }
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const startRecording = async () => {
    try {
      // Check if user is logged in
      if (!user) {
        Alert.alert(
          'Login Required', 
          'You need to be logged in to record meetings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/auth/login') }
          ]
        );
        return;
      }

      // Handle permissions based on platform
      if (Platform.OS === 'web') {
        // For web, we need to check if the browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          Alert.alert('Browser Not Supported', 'Your browser does not support audio recording. Please try a different browser.');
          return;
        }
        
        // Request microphone access using the browser's native API
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
          Alert.alert('Permission Denied', 'Microphone access is required to record audio.');
          return;
        }
      } else {
        // For mobile platforms, use expo-av permissions
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'You need to grant audio recording permissions to use this feature.');
          return;
        }
      }

      // Set up audio recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording using expo-av
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      
      // Trigger haptic feedback (skip on web)
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      // Button press animation
      buttonScale.value = withSpring(0.9, { damping: 10 });
      setTimeout(() => {
        buttonScale.value = withSpring(1, { damping: 10 });
      }, 200);

      // Ripple animation
      rippleScale.value = 0;
      rippleOpacity.value = 1;
      rippleScale.value = withTiming(2, { duration: 500 });
      rippleOpacity.value = withTiming(0, { duration: 500 });

    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const uploadToFirebase = async (fileUri: string) => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'You need to be logged in to upload recordings.');
      return null;
    }

    try {
      setIsUploading(true);
      
      // 1. Upload the audio file to Firebase Storage
      const audioPath = await StorageService.uploadAudio(fileUri, user.uid);
      
      // 2. Create a meeting record in Firestore
      const meetingId = await MeetingService.createMeeting(audioPath, user.uid);
      
      console.log('Recording uploaded and meeting created:', meetingId);
      
      // 3. Navigate to the library tab
      Alert.alert(
        'Recording Uploaded',
        'Your recording has been uploaded and is being processed. You can view it in the Library tab.',
        [{ text: 'OK', onPress: () => router.push('/library') }]
      );
      
      return meetingId;
    } catch (error) {
      console.error('Error uploading recording:', error);
      Alert.alert('Upload Failed', 'Failed to upload your recording. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      // Stop recording
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      
      // Get recording URI
      const uri = recording.getURI();
      setRecording(null);

      // Trigger haptic feedback (skip on web)
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Process the recording
      if (uri) {
        await uploadToFirebase(uri);
      }

      // Button press animation
      buttonScale.value = withSpring(0.9, { damping: 10 });
      setTimeout(() => {
        buttonScale.value = withSpring(1, { damping: 10 });
      }, 200);

    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Button animation style
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Ripple animation style
  const rippleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: rippleScale.value }],
      opacity: rippleOpacity.value,
    };
  });

  // Recording pulse animation style
  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: recordingPulse.value }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topSection}>
        <Text style={[styles.title, { color: theme.text }]}>Record Meeting</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Tap the button below to start recording your meeting.
          We'll transcribe and summarize it for you.
        </Text>
      </View>

      <View style={styles.middleSection}>
        {isRecording && (
          <View style={styles.recordingInfo}>
            <Animated.View style={[styles.recordingIndicator, pulseAnimatedStyle, { backgroundColor: theme.error }]} />
            <Text style={[styles.recordingText, { color: theme.error }]}>Recording</Text>
            <Text style={[styles.durationText, { color: theme.text }]}>{formatDuration(recordingDuration)}</Text>
          </View>
        )}
        
        {isUploading && (
          <View style={styles.uploadingContainer}>
            <Text style={[styles.uploadingText, { color: theme.primary }]}>Uploading...</Text>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Animated.View style={[styles.ripple, rippleAnimatedStyle, { backgroundColor: isRecording ? theme.error : theme.primary }]} />
          <Animated.View style={[styles.buttonOuter, buttonAnimatedStyle, { borderColor: isRecording ? theme.error : theme.primary }]}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: isRecording ? theme.error : theme.primary }]}
              onPress={toggleRecording}
              activeOpacity={0.8}
              disabled={isUploading}
            >
              <MaterialIcons
                name={isRecording ? 'stop' : 'mic'}
                size={36}
                color="white"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <Text style={[styles.helpText, { color: theme.text }]}>
          {isRecording 
            ? 'Tap the button again to stop recording' 
            : isUploading
              ? 'Please wait while your recording is being uploaded'
              : 'Your recordings will appear in the Library tab'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  middleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 16,
  },
  durationText: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  uploadingContainer: {
    marginBottom: 24,
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
