import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Cloud, Sun, Umbrella, Sparkles } from 'lucide-react-native';
import { api } from '@/services/api';
import OutfitCard from '@/components/OutfitCard';
import ItemCard from '@/components/ItemCard';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [outfits, setOutfits] = useState<any[]>([]);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [weatherCondition, setWeatherCondition] = useState('sunny');
  const { width } = useWindowDimensions();
  
  // Show multiple items in a row on larger screens
  const numColumns = Platform.OS === 'web' && width > 768 ? 2 : 1;

  const [loading, setLoading] = useState(false);
  
  // Load real data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get recent wardrobe items
        const { data: items, error: itemsError } = await api.get('/wardrobe');
        if (itemsError) {
          throw new Error(itemsError);
        }
        
        if (items && Array.isArray(items)) {
          // Sort by dateAdded and take most recent 4
          const sortedItems = [...items].sort((a, b) => 
            new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
          );
          setRecentItems(sortedItems.slice(0, 4));
        }

        // Get outfits
        const { data: outfitsData, error: outfitsError } = await api.get('/outfits');
        if (outfitsError) {
          throw new Error(outfitsError);
        }
        
        if (outfitsData && Array.isArray(outfitsData)) {
          setOutfits(outfitsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Refresh items
      const { data: items } = await api.get('/wardrobe');
      if (items && Array.isArray(items)) {
        const sortedItems = [...items].sort((a, b) => 
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
        setRecentItems(sortedItems.slice(0, 4));
      }

      // Refresh outfits
      const { data: outfitsData } = await api.get('/outfits');
      if (outfitsData && Array.isArray(outfitsData)) {
        setOutfits(outfitsData);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const getWeatherIcon = () => {
    switch (weatherCondition) {
      case 'sunny':
        return <Sun size={24} color="#FF9500" />;
      case 'rainy':
        return <Umbrella size={24} color="#0A84FF" />;
      case 'cloudy':
        return <Cloud size={24} color="#8E8E93" />;
      default:
        return <Sun size={24} color="#FF9500" />;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.username}>{user?.displayName || 'Fashion Friend'}</Text>
        </View>
        <View style={styles.weatherContainer}>
          {getWeatherIcon()}
          <Text style={styles.weatherText}>73°F</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Outfit Suggestions</Text>
          <TouchableOpacity onPress={() => router.push('/outfits/all')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.outfitsContainer}
        >
          {outfits.map((outfit) => (
            <OutfitCard 
              key={outfit._id || outfit.id} 
              outfit={outfit} 
              onPress={() => router.push(`/outfits/${outfit._id || outfit.id}`)} 
            />
          ))}
          
          <TouchableOpacity 
            style={styles.generateCard}
            onPress={async () => {
              try {
                // Call AI to generate a new outfit
                const { data, error } = await api.post('/outfits/generate');
                if (error) throw new Error(error);
                
                // Refresh outfits list
                const { data: outfitsData } = await api.get('/outfits');
                if (outfitsData && Array.isArray(outfitsData)) {
                  setOutfits(outfitsData);
                }
                
                Alert.alert('Success', 'New outfit created successfully!');
              } catch (err) {
                console.error('Error generating outfit:', err);
                Alert.alert('Error', 'Failed to generate outfit. Please try again.');
              }
            }}
          >
            <Sparkles size={32} color="#4ECDC4" />
            <Text style={styles.generateText}>Generate New Outfit</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
          <TouchableOpacity onPress={() => router.push('/items/all')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentItemsGrid}>
          {recentItems.map((item) => (
            <ItemCard 
              key={item._id || item.id} 
              item={item} 
              style={numColumns > 1 ? styles.gridItem : undefined}
              onPress={() => router.push(`/item/${item._id || item.id}`)} 
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6c757d',
  },
  username: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#212529',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  weatherText: {
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
    fontSize: 16,
    color: '#212529',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#212529',
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FF6B6B',
  },
  outfitsContainer: {
    paddingBottom: 8,
  },
  generateCard: {
    width: 180,
    height: 240,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderStyle: 'dashed',
  },
  generateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4ECDC4',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  recentItemsGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: Platform.OS === 'web' ? 'space-between' : 'flex-start',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
});