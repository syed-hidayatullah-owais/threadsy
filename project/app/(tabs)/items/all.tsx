import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { api } from '@/services/api';
import ItemCard from '@/components/ItemCard';

export default function AllItemsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadItems = async () => {
    try {
      const { data, error } = await api.get('/wardrobe');
      if (error) throw new Error(error);
      
      if (data && Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadItems();
  }, []);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
  };
  
  const renderItem = ({ item }: { item: any }) => (
    <ItemCard
      item={item}
      onPress={() => router.push(`/item/${item._id || item.id}`)}
      style={styles.itemCard}
    />
  );
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.title}>All Items</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/add')}
            >
              <Text style={styles.addButtonText}>Add New Item</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#212529',
  },
  backButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemCard: {
    marginBottom: 16,
    width: '48%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
