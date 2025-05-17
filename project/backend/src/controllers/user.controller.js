import User from '../models/User.model.js';

export const followUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.user._id);

    if (!user.following.includes(req.params.id)) {
      user.following.push(req.params.id);
      userToFollow.followers.push(req.user._id);

      await Promise.all([user.save(), userToFollow.save()]);
    }

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    const userToUnfollow = await User.findById(req.params.id);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.user._id);

    user.following = user.following.filter(
      (id) => id.toString() !== req.params.id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    await Promise.all([user.save(), userToUnfollow.save()]);

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'displayName photoURL email')
      .select('followers');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'displayName photoURL email')
      .select('following');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { displayName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('displayName photoURL email')
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};