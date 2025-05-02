import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  deleteDoc, 
  serverTimestamp, 
  orderBy, 
  DocumentData,
  updateDoc
} from 'firebase/firestore';
import { db } from '../constants/Firebase';
import StorageService from './StorageService';

// Interface for meeting data
export interface Meeting {
  id?: string;
  userId: string;
  audioPath: string;
  pdfPath?: string;
  summary?: string;
  transcript?: string;
  title?: string;
  status: 'processing' | 'completed' | 'error';
  createdAt: any;
  updatedAt?: any;
  errorMessage?: string;
}

/**
 * Service for handling Firestore operations related to meetings
 */
class MeetingService {
  private meetingsCollection = collection(db, 'moms');

  /**
   * Create a new meeting record in Firestore
   * @param audioPath - Path to audio file in Storage
   * @param userId - User ID
   * @returns Promise with meeting ID
   */
  async createMeeting(audioPath: string, userId: string): Promise<string> {
    try {
      const meetingData: Meeting = {
        userId,
        audioPath,
        status: 'processing',
        createdAt: serverTimestamp(),
      };
      
      // Validate that required fields are present
      if (!userId || !audioPath) {
        throw new Error('userId and audioPath are required to create a meeting');
      }
      
      const docRef = await addDoc(this.meetingsCollection, meetingData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  /**
   * Get all meetings for a user
   * @param userId - User ID
   * @returns Promise with array of meetings
   */
  async getUserMeetings(userId: string): Promise<Meeting[]> {
    try {
      // Option 1: Query without sorting (will work without composite index)
      // This query doesn't require a composite index
      const simpleQuery = query(
        this.meetingsCollection,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      
      // Option 2: Query with sorting (requires composite index)
      // IMPORTANT: To use this query, you need to create a composite index.
      // Follow the link in the error message to create the index in the Firebase console.
      // After creating the index, comment out Option 1 above and uncomment this block:
      /*
      const meetingsQuery = query(
        this.meetingsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(meetingsQuery);
      */
      
      const meetings: Meeting[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data() as Omit<Meeting, 'id'>;
        
        // Ensure all meeting objects have a status field
        if (!data.status) {
          data.status = 'processing'; // Default to processing if status is missing
        }
        
        meetings.push({
          id: doc.id,
          ...data
        });
      });
      
      // Sort in memory instead of in the query
      return meetings.sort((a, b) => {
        // Handle missing or invalid timestamps
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        
        // Convert Firebase timestamps to milliseconds
        const timeA = a.createdAt.toDate ? a.createdAt.toDate().getTime() : a.createdAt;
        const timeB = b.createdAt.toDate ? b.createdAt.toDate().getTime() : b.createdAt;
        
        return timeB - timeA; // Descending order (newest first)
      });
    } catch (error: any) {
      console.error('Error getting user meetings:', error);
      
      // Check if it's a missing index error
      if (error?.message?.includes('requires an index')) {
        console.error(
          'This query requires a Firestore index. Please follow the link in the error message to create it.'
        );
      }
      
      throw error;
    }
  }

  /**
   * Get a specific meeting by ID
   * @param meetingId - Meeting ID
   * @returns Promise with meeting data
   */
  async getMeeting(meetingId: string): Promise<Meeting | null> {
    try {
      const docRef = doc(this.meetingsCollection, meetingId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data() as Omit<Meeting, 'id'>
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting meeting:', error);
      throw error;
    }
  }

  /**
   * Delete a meeting and its associated storage files
   * @param meetingId - Meeting ID
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      // Get the meeting data first
      const meeting = await this.getMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // Delete storage files
      const filesToDelete = [];
      
      if (meeting.audioPath) {
        filesToDelete.push(meeting.audioPath);
      }
      
      if (meeting.pdfPath) {
        filesToDelete.push(meeting.pdfPath);
      }
      
      // Delete files from storage
      if (filesToDelete.length > 0) {
        await StorageService.cleanUserStorage(meeting.userId, filesToDelete);
      }
      
      // Delete the document
      const docRef = doc(this.meetingsCollection, meetingId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  }

  /**
   * Update a meeting's status
   * @param meetingId - Meeting ID
   * @param status - New status
   */
  async updateMeetingStatus(meetingId: string, status: Meeting['status']): Promise<void> {
    try {
      const docRef = doc(this.meetingsCollection, meetingId);
      await updateDoc(docRef, { status });
    } catch (error) {
      console.error('Error updating meeting status:', error);
      throw error;
    }
  }
  
  /**
   * Fix meetings with inconsistent state (has summary but status still processing)
   * @param meetingId - Meeting ID to fix
   */
  async fixMeetingStatus(meetingId: string): Promise<void> {
    try {
      const meeting = await this.getMeeting(meetingId);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // If meeting has summary but status is still processing, update it to completed
      if (meeting.summary && meeting.status === 'processing') {
        await this.updateMeetingStatus(meetingId, 'completed');
      }
    } catch (error) {
      console.error('Error fixing meeting status:', error);
      throw error;
    }
  }
  
  /**
   * Fix all meetings with inconsistent states
   * @param userId - User ID
   */
  async fixAllMeetingStatuses(userId: string): Promise<void> {
    try {
      const meetings = await this.getUserMeetings(userId);
      
      // Find meetings with inconsistent state
      const inconsistentMeetings = meetings.filter(meeting => 
        meeting.summary && meeting.status === 'processing'
      );
      
      // Update all inconsistent meetings
      for (const meeting of inconsistentMeetings) {
        if (meeting.id) {
          await this.fixMeetingStatus(meeting.id);
        }
      }
    } catch (error) {
      console.error('Error fixing all meeting statuses:', error);
      throw error;
    }
  }

  /**
   * Get all meetings (admin function)
   * @returns Promise with array of all meetings
   */
  async getAllMeetings(): Promise<Meeting[]> {
    try {
      const meetingsQuery = query(
        this.meetingsCollection,
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(meetingsQuery);
      const meetings: Meeting[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data() as Omit<Meeting, 'id'>;
        
        // Ensure all meeting objects have a status field
        if (!data.status) {
          data.status = 'processing';
        }
        
        meetings.push({
          id: doc.id,
          ...data
        });
      });
      
      return meetings;
    } catch (error) {
      console.error('Error getting all meetings:', error);
      throw error;
    }
  }

  /**
   * Delete all meetings for a user (use with caution)
   * @param userId - User ID
   * @returns Promise with count of deleted meetings
   */
  async deleteAllUserMeetings(userId: string): Promise<number> {
    try {
      const meetings = await this.getUserMeetings(userId);
      let deletedCount = 0;
      
      // Collect all file paths to delete
      const allFilesToDelete = meetings.reduce((acc, meeting) => {
        if (meeting.audioPath) acc.push(meeting.audioPath);
        if (meeting.pdfPath) acc.push(meeting.pdfPath);
        return acc;
      }, [] as string[]);
      
      // Delete all files from storage first
      if (allFilesToDelete.length > 0) {
        await StorageService.cleanUserStorage(userId, allFilesToDelete);
      }

      // Then delete each meeting document
      for (const meeting of meetings) {
        if (meeting.id) {
          const docRef = doc(this.meetingsCollection, meeting.id);
          await deleteDoc(docRef);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error deleting all user meetings:', error);
      throw error;
    }
  }
  
  /**
   * Clean up all storage files for a user
   * @param userId - User ID
   * @returns Promise with results of cleanup
   */
  async cleanAllUserStorage(userId: string): Promise<string[]> {
    try {
      const meetings = await this.getUserMeetings(userId);
      
      // Collect all file paths to delete
      const allFilesToDelete = meetings.reduce((acc, meeting) => {
        if (meeting.audioPath) acc.push(meeting.audioPath);
        if (meeting.pdfPath) acc.push(meeting.pdfPath);
        return acc;
      }, [] as string[]);
      
      // Delete all files from storage
      if (allFilesToDelete.length > 0) {
        return await StorageService.cleanUserStorage(userId, allFilesToDelete);
      }
      
      return ['No files found to delete'];
    } catch (error) {
      console.error('Error cleaning user storage:', error);
      throw error;
    }
  }
  
  /**
   * Create a test meeting (for development/testing)
   * @param userId - User ID
   * @returns Promise with meeting ID
   */
  async createTestMeeting(userId: string): Promise<string> {
    try {
      // Placeholder path for testing
      const audioPath = `audios/${userId}/test-recording-${Date.now()}.mp3`;
      
      const meetingData: Meeting = {
        userId,
        audioPath,
        status: 'processing',
        createdAt: serverTimestamp(),
        title: 'Test Meeting ' + new Date().toLocaleString(),
      };
      
      const docRef = await addDoc(this.meetingsCollection, meetingData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating test meeting:', error);
      throw error;
    }
  }
}

export default new MeetingService(); 