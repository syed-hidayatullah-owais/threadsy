import WardrobeItem from '../models/WardrobeItem.model.js';
import { generateImageEmbeddings, findMatchingItems } from '../services/clip.service.js';

/**
 * Add a new item to the wardrobe
 * @route POST /api/wardrobe
 */
export const addItem = async (req, res) => {
  try {
    const { name, category, color, season, public: isPublic, image } = req.body;
    
    const item = new WardrobeItem({
      user: req.user._id,
      name,
      category,
      color,
      season,
      public: isPublic !== undefined ? isPublic : true,
      image: req.imageUrl || image // Use uploaded image URL from middleware if available
    });
    
    await item.save();
    
    // Generate embeddings in the background
    generateItemEmbeddingsBackground(item._id, item.image);
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all wardrobe items for the current user
 * @route GET /api/wardrobe
 */
export const getItems = async (req, res) => {
  try {
    // Apply any filters
    const { category, color, season } = req.query;
    const query = { user: req.user._id };
    
    if (category) query.category = category;
    if (color) query.color = color;
    if (season) query.season = season;
    
    const items = await WardrobeItem.find(query)
      .sort({ dateAdded: -1 });
    
    res.json(items);
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a specific wardrobe item by ID
 * @route GET /api/wardrobe/:id
 */
export const getItemById = async (req, res) => {
  try {
    const item = await WardrobeItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if the item belongs to the user or is public
    if (item.user.toString() !== req.user._id.toString() && !item.public) {
      return res.status(403).json({ message: 'Not authorized to view this item' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error getting item:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update a wardrobe item
 * @route PUT /api/wardrobe/:id
 */
export const updateItem = async (req, res) => {
  try {
    const item = await WardrobeItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if the item belongs to the user
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }
    
    const { name, category, color, season, public: isPublic } = req.body;
    
    // Update fields
    if (name) item.name = name;
    if (category) item.category = category;
    if (color) item.color = color;
    if (season) item.season = season;
    if (isPublic !== undefined) item.public = isPublic;
    
    // Update image if a new one was uploaded
    if (req.imageUrl) {
      item.image = req.imageUrl;
    }
    
    await item.save();
    
    // If image changed, regenerate embeddings
    if (req.imageUrl) {
      generateItemEmbeddingsBackground(item._id, item.image);
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a wardrobe item
 * @route DELETE /api/wardrobe/:id
 */
export const deleteItem = async (req, res) => {
  try {
    const item = await WardrobeItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if the item belongs to the user
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }
    
    await item.remove();
    
    // In a production environment, we would also delete the image from storage
    
    res.json({ message: 'Item removed' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Like a wardrobe item
 * @route POST /api/wardrobe/:id/like
 */
export const likeItem = async (req, res) => {
  try {
    const item = await WardrobeItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if the item is public or belongs to the user
    if (!item.public && item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to like this item' });
    }
    
    // Check if already liked
    if (item.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Item already liked' });
    }
    
    item.likes.push(req.user._id);
    await item.save();
    
    res.json(item);
  } catch (error) {
    console.error('Error liking item:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Unlike a wardrobe item
 * @route DELETE /api/wardrobe/:id/like
 */
export const unlikeItem = async (req, res) => {
  try {
    const item = await WardrobeItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    item.likes = item.likes.filter(
      (like) => like.toString() !== req.user._id.toString()
    );
    await item.save();
    
    res.json(item);
  } catch (error) {
    console.error('Error unliking item:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Find similar items based on text description using CLIP
 * @route POST /api/wardrobe/similar
 */
export const findSimilarItems = async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }
    
    // Get all user's items with embeddings
    const items = await WardrobeItem.find({ user: req.user._id }).select('+embedding');
    
    // Find items that match the description
    const matchingItems = await findMatchingItems(items, description);
    
    res.json(matchingItems);
  } catch (error) {
    console.error('Error finding similar items:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Generate CLIP embeddings for a specific item
 * @route POST /api/wardrobe/generate-embeddings/:id
 */
export const generateItemEmbeddings = async (req, res) => {
  try {
    const item = await WardrobeItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if the item belongs to the user
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }
    
    // Generate embeddings
    const embeddings = await generateImageEmbeddings(item.image);
    
    // Update item with embeddings
    item.embedding = embeddings;
    await item.save();
    
    res.json({ message: 'Embeddings generated successfully' });
  } catch (error) {
    console.error('Error generating embeddings:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Helper function to generate embeddings in the background
 */
async function generateItemEmbeddingsBackground(itemId, imageUrl) {
  try {
    const embeddings = await generateImageEmbeddings(imageUrl);
    
    await WardrobeItem.findByIdAndUpdate(itemId, {
      embedding: embeddings
    });
    
    console.log(`Generated embeddings for item ${itemId}`);
  } catch (error) {
    console.error(`Error generating embeddings for item ${itemId}:`, error);
  }
}