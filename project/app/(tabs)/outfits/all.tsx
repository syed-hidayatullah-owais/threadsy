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
import OutfitCard from '@/components/OutfitCard';

export default function AllOutfitsScreen() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadOutfits = async () => {
    try {
      const { data, error } = await api.get('/outfits');
      if (error) throw new Error(error);
      
      if (data && Array.isArray(data)) {
        setOutfits(data);
      }
    } catch (err) {
      console.error('Error loading outfits:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadOutfits();
  }, []);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOutfits();
  };
  
  const renderItem = ({ item }: { item: any }) => (
    <OutfitCard
      outfit={item}
      onPress={() => router.push(`/outfits/${item._id || item.id}`)}
      style={styles.outfitCard}
    />
  );
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading outfits...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.title}>All Outfits</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <FlatList
        data={outfits}
        renderItem={renderItem}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContent}
        numColumns={1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No outfits found</Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={async () => {
                try {
                  setLoading(true);
                  await api.post('/outfits/generate');
                  await loadOutfits();
                } catch (err) {
                  console.error('Error generating outfit:', err);
                  setLoading(false);
                }
              }}
            >
              <Text style={styles.generateButtonText}>Generate an Outfit</Text>
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
  outfitCard: {
    marginBottom: 16,
    width: '100%',
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
  generateButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  generateButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
