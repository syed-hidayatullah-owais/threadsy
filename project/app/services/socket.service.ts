import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Define activity and notification types
export interface Activity {
  type: 'outfit_created' | 'item_added' | 'like';
  userId: string;
  timestamp: Date;
  outfitId?: string;
  outfitTitle?: string;
  itemId?: string;
  itemName?: string;
  itemImage?: string;
  contentType?: 'item' | 'outfit';
  contentId?: string;
}

export interface Notification {
  type: string;
  userId: string;
  timestamp: Date;
  [key: string]: any;
}

// Socket.io connection instance
let socket: Socket | null = null;

/**
 * Initialize Socket.IO client and connect to server
 * @param userId Current user ID for authentication
 * @returns Socket.io client instance
 */
export const initSocket = (userId: string) => {
  if (socket) return socket;

  // Connect to the server
  socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000', {
    transports: ['websocket'],
    autoConnect: true
  });

  // Set up event listeners
  socket.on('connect', () => {
    console.log('Socket connected');
    
    // Authenticate with user ID
    socket.emit('authenticate', userId);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

/**
 * Hook for handling real-time activities in the app
 * @param userId Current user ID
 * @returns Object containing activities and methods
 */
export const useSocketActivities = (userId: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket if not already done
    const socketInstance = initSocket(userId);

    // Listen for activities
    socketInstance.on('activity', (activity: Activity) => {
      setActivities((prev) => [activity, ...prev.slice(0, 49)]);
    });

    // Listen for notifications
    socketInstance.on('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 49)]);
    });

    return () => {
      socketInstance.off('activity');
      socketInstance.off('notification');
    };
  }, [userId]);

  /**
   * Broadcast user activity to followers
   * @param activity Activity data to broadcast
   */
  const broadcastActivity = (activity: Partial<Activity>) => {
    if (socket) {
      socket.emit('activity', activity);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markNotificationsAsRead = () => {
    setNotifications((prev) => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  return {
    activities,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    broadcastActivity,
    markNotificationsAsRead
  };
};
