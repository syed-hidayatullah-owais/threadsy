import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Hugging Face API connection
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const CLIP_MODEL_ENDPOINT = 'https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32';
const EMBEDDING_SIZE = 512; // CLIP embedding size

/**
 * Service for using Hugging Face's CLIP model to provide clothing recommendations
 * CLIP (Contrastive Language-Image Pre-training) can be used to find 
 * semantic similarity between images and text descriptions
 */

/**
 * Check if Hugging Face API key is configured
 * @returns {boolean} - Whether API key is available
 */
const isHuggingFaceConfigured = () => {
  return HUGGINGFACE_API_KEY && HUGGINGFACE_API_KEY !== 'your_huggingface_api_key_here';
};

/**
 * Generate embeddings for clothing items using Hugging Face's CLIP model
 * @param {string} imageUrl - URL of the clothing image or local path
 * @returns {Promise<Array>} - Vector embeddings
 */
export const generateImageEmbeddings = async (imageUrl) => {
  try {
    if (!isHuggingFaceConfigured()) {
      console.log('Hugging Face API key not configured. Using mock embeddings.');
      // Return a mock embedding (random vector) for testing without an API key
      return Array(EMBEDDING_SIZE).fill(0).map(() => Math.random() - 0.5);
    }

    // Check if imageUrl is a local path or a URL
    let imageData;
    if (imageUrl.startsWith('http')) {
      // If it's a URL, fetch the image
      const response = await fetch(imageUrl);
      imageData = await response.buffer();
    } else {
      // If it's a local path, read the file directly
      // Assumes imageUrl is an absolute path when not a URL
      imageData = fs.readFileSync(imageUrl);
    }

    // Call the Hugging Face API with the image data
    const response = await fetch(CLIP_MODEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          image: Buffer.from(imageData).toString('base64')
        },
        options: {
          wait_for_model: true,
          use_cache: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.image_embeds || result.embeddings || [];

  } catch (error) {
    console.error('Error generating image embeddings:', error);
    // Return mock embeddings as fallback
    return Array(EMBEDDING_SIZE).fill(0).map(() => Math.random() - 0.5);
  }
};

/**
 * Generate text embeddings for clothing descriptions
 * @param {string} description - Text description of clothing
 * @returns {Promise<Array>} - Vector embeddings
 */
export const generateTextEmbeddings = async (description) => {
  try {
    if (!isHuggingFaceConfigured()) {
      console.log('Hugging Face API key not configured. Using mock embeddings.');
      // Return a mock embedding for testing without an API key
      return Array(EMBEDDING_SIZE).fill(0).map(() => Math.random() - 0.5);
    }
    
    // Call the Hugging Face API with text
    const response = await fetch(CLIP_MODEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: description,
        options: {
          wait_for_model: true,
          use_cache: true
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.text_embeds || result.embeddings || [];
    
  } catch (error) {
    console.error('Error generating text embeddings:', error);
    // Return mock embeddings as fallback
    return Array(EMBEDDING_SIZE).fill(0).map(() => Math.random() - 0.5);
  }
};

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {number} - Similarity score between -1 and 1
 */
export const calculateSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Invalid vectors for similarity calculation');
  }
  
  // Calculate dot product
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += Math.pow(vecA[i], 2);
    normB += Math.pow(vecB[i], 2);
  }
  
  // Prevent division by zero
  if (normA === 0 || normB === 0) return 0;
  
  // Calculate cosine similarity
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Find items in user's wardrobe that match a given description or vibe
 * @param {Array} userItems - Array of user's clothing items with embeddings
 * @param {string} description - Text description of desired style or outfit
 * @returns {Promise<Array>} - Sorted array of items by relevance to description
 */
export const findMatchingItems = async (userItems, description) => {
  try {
    // Generate embeddings for the description
    const descriptionEmbedding = await generateTextEmbeddings(description);
    
    // Calculate similarity for each item
    const scoredItems = userItems.map(item => {
      // Skip items without embeddings
      if (!item.embedding) return { ...item, similarityScore: 0 };
      
      const similarityScore = calculateSimilarity(
        descriptionEmbedding,
        item.embedding
      );
      
      return { ...item, similarityScore };
    });
    
    // Sort by similarity score (highest first)
    return scoredItems.sort((a, b) => b.similarityScore - a.similarityScore);
  } catch (error) {
    console.error('Error finding matching items:', error);
    throw error;
  }
};

/**
 * Generate outfit recommendations based on items and occasion
 * @param {Array} userItems - User's wardrobe items with embeddings
 * @param {string} occasion - Occasion for the outfit
 * @param {Object} preferences - User preferences (style, colors, etc.)
 * @returns {Promise<Array>} - Array of recommended outfits
 */
export const recommendOutfits = async (userItems, occasion, preferences = {}) => {
  try {
    // Create a prompt for the desired outfit
    const prompt = `Create a stylish outfit for ${occasion}`;
    const additionalContext = preferences.style ? 
      `in a ${preferences.style} style` : '';
    const colorPreference = preferences.preferredColors ? 
      `including ${preferences.preferredColors.join(' or ')} colors` : '';
    
    const fullPrompt = [prompt, additionalContext, colorPreference]
      .filter(Boolean)
      .join(' ');
    
    // Get embeddings for the prompt
    const promptEmbedding = await generateTextEmbeddings(fullPrompt);
    
    // Group items by category
    const itemsByCategory = userItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push({
        ...item,
        similarityScore: calculateSimilarity(
          promptEmbedding,
          item.embedding || [] // Skip if no embedding
        )
      });
      return acc;
    }, {});
    
    // Sort each category by similarity score
    Object.keys(itemsByCategory).forEach(category => {
      itemsByCategory[category].sort((a, b) => b.similarityScore - a.similarityScore);
    });
    
    // Create outfit recommendations
    const outfits = [];
    const requiredCategories = {
      'casual': ['Tops', 'Bottoms', 'Shoes'],
      'formal': ['Tops', 'Bottoms', 'Outerwear', 'Shoes'],
      'business': ['Tops', 'Bottoms', 'Shoes'],
      'athletic': ['Tops', 'Bottoms', 'Shoes']
    };
    
    // Select categories based on occasion or default to casual
    const targetCategories = requiredCategories[occasion.toLowerCase()] || 
      requiredCategories.casual;
    
    // Generate up to 3 outfit recommendations
    for (let i = 0; i < 3; i++) {
      const outfit = {
        title: `${occasion} Outfit ${i + 1}`,
        items: []
      };
      
      // Add top items from each required category
      let validOutfit = true;
      
      targetCategories.forEach(category => {
        const items = itemsByCategory[category] || [];
        
        // If we don't have any items in a required category, this outfit isn't valid
        if (items.length === 0) {
          validOutfit = false;
          return;
        }
        
        // Pick next best item in this category (avoiding duplicates between outfits)
        const itemIndex = Math.min(i, items.length - 1);
        outfit.items.push(items[itemIndex]);
      });
      
      // Only add valid outfits
      if (validOutfit) {
        // Calculate overall outfit score as average of item scores
        outfit.overallScore = outfit.items.reduce(
          (sum, item) => sum + item.similarityScore, 0
        ) / outfit.items.length;
        
        outfits.push(outfit);
      }
    }
    
    return outfits.sort((a, b) => b.overallScore - a.overallScore);
  } catch (error) {
    console.error('Error recommending outfits:', error);
    throw error;
  }
};

/**
 * =============================
 * Hugging Face CLIP API USAGE
 * =============================
 *
 * 1. Get a free Hugging Face account at https://huggingface.co/join
 * 2. Go to https://huggingface.co/settings/tokens and create a new Access Token (read access is enough)
 * 3. Copy your token and set it in your backend/.env file as:
 *    HUGGINGFACE_API_KEY=your_token_here
 * 4. The backend will now use the Hugging Face Inference API for CLIP embeddings.
 *    No OpenAI API key is needed.
 *
 * Note: Free tier has rate limits. For higher usage, see Hugging Face paid plans.
 */
