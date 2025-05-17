import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Settings, Grid, Lock, LogOut, Edit3 } from 'lucide-react-native';
import { api } from '@/services/api';
import ItemCard from '@/components/ItemCard';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('public');
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    items: 0,
    outfits: 0,
    following: 0,
    followers: 0,
  });
  const { width } = useWindowDimensions();
  
  // Determine number of columns based on screen width
  const numColumns = Platform.OS === 'web' ? 
    (width > 1200 ? 4 : width > 768 ? 3 : 2) : 
    (width > 600 ? 2 : 1);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        // Get user's wardrobe items
        const { data: wardrobe, error: wardrobeError } = await api.get('/wardrobe');
        if (wardrobeError) throw new Error(wardrobeError);
        if (wardrobe && Array.isArray(wardrobe)) {
          setWardrobe(wardrobe);
        }
        
        // Get outfits count
        const { data: outfits, error: outfitsError } = await api.get('/outfits');
        
        // Get user profile with followers/following
        const { data: profile, error: profileError } = await api.get('/auth/profile');
        if (profileError) throw new Error(profileError);

        // Update stats
        setStats({
          items: wardrobe?.length || 0,
          outfits: outfits?.length || 0,
          following: profile?.following?.length || 0,
          followers: profile?.followers?.length || 0
        });
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // Filter wardrobe based on active tab
  const filteredWardrobe = wardrobe.filter(
    (item) => activeTab === 'public' ? item.public : !item.public
  );

  const renderItem = ({ item }: { item: any }) => {
    return (
      <ItemCard 
        item={item} 
        style={styles.gridItem} 
        contentWidth={width / numColumns - 24}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity>
            <Settings size={24} color="#212529" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: user?.photoURL || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'Fashion Enthusiast'}</Text>
            <Text style={styles.username}>@{user?.email?.split('@')[0] || 'username'}</Text>
            <Text style={styles.bio}>Fashion lover | Style enthusiast | Always dressed to impress</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Edit3 size={16} color="#212529" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.items}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.outfits}</Text>
            <Text style={styles.statLabel}>Outfits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'public' && styles.activeTab]}
            onPress={() => setActiveTab('public')}
          >
            <Grid size={20} color={activeTab === 'public' ? '#FF6B6B' : '#6c757d'} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'public' && styles.activeTabText,
              ]}
            >
              Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'private' && styles.activeTab]}
            onPress={() => setActiveTab('private')}
          >
            <Lock size={20} color={activeTab === 'private' ? '#FF6B6B' : '#6c757d'} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'private' && styles.activeTabText,
              ]}
            >
              Private
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredWardrobe}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items in this collection</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <LogOut size={20} color="#FF6B6B" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 28,
    color: '#212529',
  },
  profileSection: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#212529',
  },
  username: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  bio: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#495057',
  },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#212529',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6c757d',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e9ecef',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
    color: '#6c757d',
  },
  activeTabText: {
    color: '#FF6B6B',
  },
  gridContainer: {
    padding: 12,
  },
  gridItem: {
    margin: 6,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  logoutText: {
    fontFamily: 'Inter-Medium',
    color: '#FF6B6B',
    marginLeft: 8,
  },
});