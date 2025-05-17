import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Search, UserPlus, MessageCircle, Heart } from 'lucide-react-native';

// Will be loaded from API

// Activity will be loaded from API

export default function SocialScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('activity');
  const [loading, setLoading] = useState(true);

  // Load friends and search
  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle follow status via API
  const toggleFollow = async (id: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await api.delete(`/users/${id}/follow`);
      } else {
        await api.post(`/users/${id}/follow`);
      }
      // Refresh list
      loadFriends();
    } catch (err) {
      console.error('Follow/unfollow error:', err);
    }
  };

  // Load friends from API
  const loadFriends = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.get('/users/following');
      if (error) throw new Error(error);
      setFriends(data || []);
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Load activity feed from API
  const loadActivity = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.get('/activity');
      if (error) throw new Error(error);
      setActivity(data || []);
    } catch (err) {
      console.error('Error loading activity:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    } else {
      loadActivity();
    }
  }, [activeTab]);

  const renderFriendItem = ({ item }: { item: any }) => (
    <View style={styles.friendItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.username}>{item.username}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          item.isFollowing && styles.followingButton,
        ]}
        onPress={() => toggleFollow(item.id, item.isFollowing)}
      >
        <Text
          style={[
            styles.followButtonText,
            item.isFollowing && styles.followingButtonText,
          ]}
        >
          {item.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderActivityItem = ({ item }: { item: any }) => (
    <View style={styles.activityItem}>
      <Image source={{ uri: item.avatar }} style={styles.activityAvatar} />
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityName}>{item.name}</Text>
          <Text style={styles.activityTimestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.activityText}>
          <Text style={styles.activityAction}>{item.action}</Text> {item.itemName}
        </Text>
        {item.itemImage && (
          <Image source={{ uri: item.itemImage }} style={styles.activityImage} />
        )}
        <View style={styles.activityActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart size={18} color="#6c757d" />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={18} color="#6c757d" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search friends */}
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
        <Text style={styles.subtitle}>Connect with friends and see their activity</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6c757d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={async (text) => {
              setSearchQuery(text);
              if (text.length > 2) {
                const { data, error } = await api.get(`/users/search?query=${text}`);
                if (!error) setFriends(data || []);
              } else {
                loadFriends();
              }
            }}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={loadFriends}>
          <UserPlus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>          <TouchableOpacity
            style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'activity' && styles.activeTabText,
              ]}
            >
              Activity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'friends' && styles.activeTabText,
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading {activeTab === 'friends' ? 'friends' : 'activity'}...</Text>
        </View>
      ) : activeTab === 'friends' ? (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No friends found</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadFriends}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={activity}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent activity</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadActivity}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 28,
    color: '#212529',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6c757d',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#212529',
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6c757d',
  },
  activeTabText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  friendItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  friendInfo: {
    marginLeft: 12,
    flex: 1,
  },
  friendName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#212529',
  },
  username: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6c757d',
  },
  followButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followingButton: {
    backgroundColor: '#e9ecef',
  },
  followButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#fff',
  },
  followingButtonText: {
    color: '#6c757d',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#212529',
  },
  activityTimestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6c757d',
  },
  activityText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  activityAction: {
    fontFamily: 'Inter-Medium',
    color: '#4ECDC4',
  },
  activityImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6c757d',
  },
});