import { api } from './api';

/**
 * Interface for clothing item
 */
export interface ClothingItem {
  _id?: string;
  userId: string;
  name: string;
  category: string;
  color: string;
  imageUrl: string;
  tags: string[];
  seasons: string[];
  occasions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for outfit
 */
export interface Outfit {
  _id?: string;
  userId: string;
  title: string;
  description?: string;
  items: string[]; // Array of clothing item IDs
  imageUrl?: string;
  likes: number;
  season?: string;
  occasion?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Service for interacting with MongoDB through our backend API
 */
export const mongoDBService = {
  // Clothing Items CRUD operations
  items: {
    /**
     * Fetch all clothing items for a user
     * @param userId User ID
     * @returns Array of clothing items
     */
    getAll: async (userId: string): Promise<ClothingItem[]> => {
      try {
        const response = await api.get(`/items/user/${userId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching clothing items:', error);
        return [];
      }
    },
    
    /**
     * Get a specific clothing item by ID
     * @param itemId Item ID
     * @returns Clothing item or null if not found
     */
    getById: async (itemId: string): Promise<ClothingItem | null> => {
      try {
        const response = await api.get(`/items/${itemId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching item ${itemId}:`, error);
        return null;
      }
    },
    
    /**
     * Create a new clothing item
     * @param item Clothing item data
     * @returns Created item with ID
     */
    create: async (item: ClothingItem): Promise<ClothingItem> => {
      try {
        const response = await api.post('/items', item);
        return response.data;
      } catch (error) {
        console.error('Error creating clothing item:', error);
        throw error;
      }
    },
    
    /**
     * Update an existing clothing item
     * @param itemId Item ID
     * @param updates Updates to apply
     * @returns Updated item
     */
    update: async (itemId: string, updates: Partial<ClothingItem>): Promise<ClothingItem> => {
      try {
        const response = await api.put(`/items/${itemId}`, updates);
        return response.data;
      } catch (error) {
        console.error(`Error updating item ${itemId}:`, error);
        throw error;
      }
    },
    
    /**
     * Delete a clothing item
     * @param itemId Item ID
     * @returns Success status
     */
    delete: async (itemId: string): Promise<boolean> => {
      try {
        await api.delete(`/items/${itemId}`);
        return true;
      } catch (error) {
        console.error(`Error deleting item ${itemId}:`, error);
        return false;
      }
    },
    
    /**
     * Search for items by various criteria
     * @param params Search parameters
     * @returns Matching items
     */
    search: async (params: {
      userId: string;
      category?: string;
      color?: string;
      season?: string;
      occasion?: string;
      tags?: string[];
    }): Promise<ClothingItem[]> => {
      try {
        const response = await api.get('/items/search', { params });
        return response.data;
      } catch (error) {
        console.error('Error searching items:', error);
        return [];
      }
    }
  },
  
  // Outfits CRUD operations
  outfits: {
    /**
     * Get all outfits for a user
     * @param userId User ID
     * @returns Array of outfits
     */
    getAll: async (userId: string): Promise<Outfit[]> => {
      try {
        const response = await api.get(`/outfits/user/${userId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching outfits:', error);
        return [];
      }
    },
    
    /**
     * Get a specific outfit by ID
     * @param outfitId Outfit ID
     * @returns Outfit or null if not found
     */
    getById: async (outfitId: string): Promise<Outfit | null> => {
      try {
        const response = await api.get(`/outfits/${outfitId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching outfit ${outfitId}:`, error);
        return null;
      }
    },
    
    /**
     * Create a new outfit
     * @param outfit Outfit data
     * @returns Created outfit with ID
     */
    create: async (outfit: Outfit): Promise<Outfit> => {
      try {
        const response = await api.post('/outfits', outfit);
        return response.data;
      } catch (error) {
        console.error('Error creating outfit:', error);
        throw error;
      }
    },
    
    /**
     * Update an existing outfit
     * @param outfitId Outfit ID
     * @param updates Updates to apply
     * @returns Updated outfit
     */
    update: async (outfitId: string, updates: Partial<Outfit>): Promise<Outfit> => {
      try {
        const response = await api.put(`/outfits/${outfitId}`, updates);
        return response.data;
      } catch (error) {
        console.error(`Error updating outfit ${outfitId}:`, error);
        throw error;
      }
    },
    
    /**
     * Delete an outfit
     * @param outfitId Outfit ID
     * @returns Success status
     */
    delete: async (outfitId: string): Promise<boolean> => {
      try {
        await api.delete(`/outfits/${outfitId}`);
        return true;
      } catch (error) {
        console.error(`Error deleting outfit ${outfitId}:`, error);
        return false;
      }
    },
    
    /**
     * Like an outfit
     * @param outfitId Outfit ID
     * @returns Updated like count
     */
    like: async (outfitId: string): Promise<number> => {
      try {
        const response = await api.post(`/outfits/${outfitId}/like`);
        return response.data.likes;
      } catch (error) {
        console.error(`Error liking outfit ${outfitId}:`, error);
        throw error;
      }
    },
    
    /**
     * Search for outfits by various criteria
     * @param params Search parameters
     * @returns Matching outfits
     */
    search: async (params: {
      userId?: string;
      season?: string;
      occasion?: string;
    }): Promise<Outfit[]> => {
      try {
        const response = await api.get('/outfits/search', { params });
        return response.data;
      } catch (error) {
        console.error('Error searching outfits:', error);
        return [];
      }
    }
  }
};
