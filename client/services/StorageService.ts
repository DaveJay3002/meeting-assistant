import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../constants/Firebase';

/**
 * Service for handling Firebase Storage operations
 */
class StorageService {
  /**
   * Upload audio file to Firebase Storage
   * @param file - File to upload (Blob or File or URI)
   * @param userId - User ID
   * @returns Promise with download URL
   */
  async uploadAudio(fileUri: string, userId: string): Promise<string> {
    try {
      // Create a storage reference with the correct path: /audio/{uid}/{fileName}
      const fileName = `recording_${Date.now()}.m4a`;
      const storagePath = `audio/${userId}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      // Convert URI to blob
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      // Upload the blob
      await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      return storagePath; // Return the storage path, not the download URL
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a file
   * @param path - Storage path
   * @returns Promise with download URL
   */
  async getFileUrl(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   * @param path - Storage path
   * @returns Promise
   */
  async deleteFile(path: string): Promise<void> {
    try {
      if (!path) {
        console.warn('Empty path provided to deleteFile');
        return;
      }
      
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      console.log(`File deleted: ${path}`);
    } catch (error) {
      console.error(`Error deleting file at ${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Clean all user files from storage
   * @param userId - User ID
   * @param filePaths - Array of file paths to delete
   * @returns Promise
   */
  async cleanUserStorage(userId: string, filePaths: string[]): Promise<string[]> {
    const results: string[] = [];
    
    if (!filePaths || filePaths.length === 0) {
      return ['No files to delete'];
    }
    
    for (const path of filePaths) {
      try {
        await this.deleteFile(path);
        results.push(`Deleted: ${path}`);
      } catch (error) {
        results.push(`Failed to delete ${path}: ${error.message}`);
      }
    }
    
    return results;
  }
}

export default new StorageService(); 