import { api } from './api';

/**
 * Service for interacting with Google Cloud Vision API through our backend
 */
export const visionService = {
  /**
   * Analyzes a clothing image using Google Cloud Vision API
   * @param imageUri The local URI of the image to analyze
   * @returns Object containing detected labels, colors, and suggested category
   */
  analyzeClothing: async (imageUri: string) => {
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

      const response = await api.post('/vision/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error analyzing clothing image:', error);
      return {
        error: 'Failed to analyze image',
        labels: [],
        colors: [],
        suggestedCategory: null
      };
    }
  }
};
