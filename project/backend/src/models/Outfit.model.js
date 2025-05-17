import mongoose from 'mongoose';

const outfitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WardrobeItem',
    required: true
  }],
  occasion: {
    type: String,
    required: true,
    enum: ['casual', 'work', 'formal', 'sport']
  },
  public: {
    type: Boolean,
    default: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Outfit', outfitSchema);