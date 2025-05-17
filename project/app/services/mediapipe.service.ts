import { api } from './api';

/**
 * Service for interacting with MediaPipe Selfie Segmentation through our backend
 */
export const mediapipeService = {
  /**
   * Removes the background from a clothing image
   * @param imageUri The local URI of the image to process
   * @returns URL of the processed image with background removed
   */
  removeBackground: async (imageUri: string) => {
    try {
      const formData = new FormData();
      // Create a file from the image URI
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: imageUri,
        name: filename || 'upload.jpg',
        type,
      } as any);

      const response = await api.post('/mediapipe/remove-background', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.imageUrl;
    } catch (error) {
      console.error('Error removing image background:', error);
      throw new Error('Failed to remove background from image');
    }
  }
};
