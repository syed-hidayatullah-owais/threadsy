import mongoose from 'mongoose';

const wardrobeItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']
  },
  color: {
    type: String,
    required: true
  },
  season: {
    type: String,
    required: true,
    enum: ['Spring', 'Summer', 'Fall', 'Winter', 'All Seasons']
  },
  public: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  occasions: [{
    type: String,
    enum: ['casual', 'work', 'formal', 'sport']
  }],
  embedding: {
    type: [Number], // Vector embedding for CLIP similarity search
    select: false // Don't include by default in queries
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

// Create a text index for searching by name and tags
wardrobeItemSchema.index({ name: 'text', tags: 'text' });

export default mongoose.model('WardrobeItem', wardrobeItemSchema);