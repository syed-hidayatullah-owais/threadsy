import { api } from './api';

interface RecommendationRequest {
  occasion: string;
  preferences?: {
    style?: string;
    preferredColors?: string[];
    excludedCategories?: string[];
  };
}

interface OutfitRecommendation {
  title: string;
  items: any[];
  overallScore: number;
}

/**
 * Service for interacting with the OpenAI CLIP-based recommendation system
 */
export const clipService = {
  /**
   * Get outfit recommendations based on occasion and preferences
   * @param occasion The occasion for the outfit
   * @param preferences Optional user preferences
   * @returns Array of recommended outfits
   */
  getOutfitRecommendations: async (
    occasion: string,
    preferences?: {
      style?: string;
      preferredColors?: string[];
      excludedCategories?: string[];
    }
  ): Promise<OutfitRecommendation[]> => {
    try {
      const response = await api.post('/recommendations/outfits', {
        occasion,
        preferences
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting outfit recommendations:', error);
      return [];
    }
  },
  
  /**
   * Find items in the user's wardrobe that match a description
   * @param description Text description of the desired items
   * @returns Array of matching items with similarity scores
   */
  findMatchingItems: async (description: string): Promise<any[]> => {
    try {
      const response = await api.post('/recommendations/items', {
        description
      });
      
      return response.data;
    } catch (error) {
      console.error('Error finding matching items:', error);
      return [];
    }
  },
  
  /**
   * Generate embeddings for a new clothing item
   * @param itemId ID of the item to generate embeddings for
   * @returns Success status
   */
  generateItemEmbeddings: async (itemId: string): Promise<boolean> => {
    try {
      await api.post(`/recommendations/generate-embeddings/${itemId}`);
      return true;
    } catch (error) {
      console.error('Error generating item embeddings:', error);
      return false;
    }
  }
};
