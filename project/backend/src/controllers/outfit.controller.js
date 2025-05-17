import Outfit from '../models/Outfit.model.js';
import WardrobeItem from '../models/WardrobeItem.model.js';

export const createOutfit = async (req, res) => {
  try {
    const { title, items, occasion, public: isPublic } = req.body;

    const outfit = await Outfit.create({
      user: req.user._id,
      title,
      items,
      occasion,
      public: isPublic
    });

    await outfit.populate('items');

    res.status(201).json(outfit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOutfits = async (req, res) => {
  try {
    const { occasion, public: isPublic } = req.query;
    
    const query = { user: req.user._id };
    
    if (occasion) query.occasion = occasion;
    if (isPublic !== undefined) query.public = isPublic;

    const outfits = await Outfit.find(query)
      .sort({ createdAt: -1 })
      .populate('items')
      .populate('likes', 'displayName photoURL');

    res.json(outfits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOutfitById = async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id)
      .populate('items')
      .populate('user', 'displayName photoURL')
      .populate('likes', 'displayName photoURL');

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    // Check if the outfit is public or belongs to the user
    if (!outfit.public && outfit.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this outfit' });
    }

    res.json(outfit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOutfit = async (req, res) => {
  try {
    const { title, items, occasion, public: isPublic } = req.body;

    const outfit = await Outfit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, items, occasion, public: isPublic },
      { new: true }
    ).populate('items');

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    res.json(outfit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOutfit = async (req, res) => {
  try {
    const outfit = await Outfit.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    res.json({ message: 'Outfit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const likeOutfit = async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id);

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    if (!outfit.likes.includes(req.user._id)) {
      outfit.likes.push(req.user._id);
      await outfit.save();
    }

    res.json(outfit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unlikeOutfit = async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id);

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    outfit.likes = outfit.likes.filter(
      (like) => like.toString() !== req.user._id.toString()
    );
    await outfit.save();

    res.json(outfit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateOutfit = async (req, res) => {
  try {
    // Get all user's wardrobe items
    const items = await WardrobeItem.find({ user: req.user._id });
    
    if (items.length < 3) {
      return res.status(400).json({ 
        message: 'You need at least 3 wardrobe items to generate an outfit' 
      });
    }
    
    // Group items by category
    const categorized = items.reduce((acc, item) => {
      if (!acc[item.category.toLowerCase()]) {
        acc[item.category.toLowerCase()] = [];
      }
      acc[item.category.toLowerCase()].push(item);
      return acc;
    }, {});
    
    // Try to create a balanced outfit with different categories
    const outfitItems = [];
    const seasons = ['spring', 'summer', 'fall', 'winter'];
    const randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
    
    // Prioritize items from the selected season, but fall back to others if needed
    const seasonalItems = items.filter(item => 
      item.season.toLowerCase() === randomSeason.toLowerCase()
    );
    
    // Generate outfit based on categories we want to include
    const categoriesToInclude = ['tops', 'bottoms', 'shoes'];
    let outfitName = '';
    
    // Add items for each desired category
    for (const category of categoriesToInclude) {
      // First try to find a seasonal item in this category
      const seasonalCategoryItems = seasonalItems.filter(
        item => item.category.toLowerCase() === category
      );
      
      if (seasonalCategoryItems.length > 0) {
        // Pick a random item from seasonal items in this category
        const randomItem = seasonalCategoryItems[
          Math.floor(Math.random() * seasonalCategoryItems.length)
        ];
        outfitItems.push(randomItem._id);
      } else if (categorized[category]?.length > 0) {
        // Fall back to any item in this category
        const randomItem = categorized[category][
          Math.floor(Math.random() * categorized[category].length)
        ];
        outfitItems.push(randomItem._id);
      }
    }
    
    // Potentially add an accessory or outerwear (30% chance each)
    if (Math.random() < 0.3 && categorized['accessories']?.length > 0) {
      const accessory = categorized['accessories'][
        Math.floor(Math.random() * categorized['accessories'].length)
      ];
      outfitItems.push(accessory._id);
    }
    
    if (Math.random() < 0.3 && categorized['outerwear']?.length > 0) {
      const outerwear = categorized['outerwear'][
        Math.floor(Math.random() * categorized['outerwear'].length)
      ];
      outfitItems.push(outerwear._id);
    }
    
    // If we couldn't create a balanced outfit, return an error
    if (outfitItems.length < 3) {
      return res.status(400).json({ 
        message: 'Not enough variety in your wardrobe to create an outfit. Add more items in different categories.' 
      });
    }
    
    // Create outfit name based on season and occasion
    const occasions = ['casual', 'work', 'formal', 'sport'];
    const randomOccasion = occasions[Math.floor(Math.random() * occasions.length)];
    
    outfitName = `${randomSeason.charAt(0).toUpperCase() + randomSeason.slice(1)} ${
      randomOccasion.charAt(0).toUpperCase() + randomOccasion.slice(1)
    } Outfit`;
    
    // Create the outfit
    const outfit = await Outfit.create({
      user: req.user._id,
      title: outfitName,
      items: outfitItems,
      occasion: randomOccasion,
      public: true
    });
    
    await outfit.populate('items');
    
    res.status(201).json(outfit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};