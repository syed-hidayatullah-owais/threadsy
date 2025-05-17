import { Server } from 'socket.io';

let io;

/**
 * Initialize the Socket.IO server
 * @param {Object} server - HTTP server instance
 */
export const initSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Authenticate the socket connection
    socket.on('authenticate', (userId) => {
      // Associate userId with this socket connection
      socket.userId = userId;
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated on socket ${socket.id}`);
    });

    // Listen for user activity
    socket.on('activity', (data) => {
      broadcastActivity(socket.userId, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get the Socket.IO instance
 * @returns {Object} Socket.IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Send a notification to a specific user
 * @param {string} userId - User ID to notify
 * @param {Object} notification - Notification data
 */
export const notifyUser = (userId, notification) => {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('notification', notification);
};

/**
 * Broadcast user activity to followers
 * @param {string} userId - User performing the activity
 * @param {Object} activity - Activity data
 */
export const broadcastActivity = (userId, activity) => {
  if (!io || !userId) return;
  
  // In a real app, we would fetch followers from the database
  // For now, we broadcast to all users for demonstration
  io.emit('activity', {
    userId,
    ...activity,
    timestamp: new Date()
  });
};

/**
 * Notify users about a new outfit creation
 * @param {string} creatorId - ID of user who created the outfit
 * @param {Object} outfit - Outfit data
 */
export const notifyOutfitCreation = (creatorId, outfit) => {
  if (!io || !creatorId) return;
  
  const activity = {
    type: 'outfit_created',
    creatorId,
    outfitId: outfit._id || outfit.id,
    outfitTitle: outfit.title,
    timestamp: new Date()
  };
  
  // Broadcast to all users - in a real app we'd only send to followers
  io.emit('activity', activity);
};

/**
 * Notify users about a new item added to wardrobe
 * @param {string} userId - User ID
 * @param {Object} item - Wardrobe item data
 */
export const notifyItemAdded = (userId, item) => {
  if (!io || !userId) return;
  
  const activity = {
    type: 'item_added',
    userId,
    itemId: item._id || item.id,
    itemName: item.name,
    itemImage: item.image,
    timestamp: new Date()
  };
  
  // Broadcast to all users
  io.emit('activity', activity);
};

/**
 * Notify when a user likes an item or outfit
 * @param {string} userId - User who liked the content
 * @param {string} contentType - 'item' or 'outfit'
 * @param {Object} content - The liked content
 */
export const notifyLike = (userId, contentType, content) => {
  if (!io || !userId) return;
  
  const ownerId = content.user;
  
  // Don't notify if user likes their own content
  if (userId === ownerId) return;
  
  const notification = {
    type: 'like',
    userId,
    contentType,
    contentId: content._id || content.id,
    timestamp: new Date()
  };
  
  // Send notification to content owner
  notifyUser(ownerId, notification);
};
