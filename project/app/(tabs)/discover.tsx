import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Search, Sliders } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { api } from '@/services/api';
import ItemCard from '@/components/ItemCard';

const CATEGORIES = [
  'All',
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
];

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const { width } = useWindowDimensions();
  
  // Determine number of columns based on screen width
  const numColumns = Platform.OS === 'web' ? 
    (width > 1200 ? 4 : width > 768 ? 3 : 2) : 
    (width > 600 ? 2 : 1);

  useEffect(() => {
    const loadItems = async () => {
      const { data, error } = await api.get('/wardrobe');
      if (error) {
        console.error('Error fetching wardrobe items:', error);
        return;
      }
      setItems(data || []);
    };
    loadItems();
  }, []);

  useEffect(() => {
    // Filter items based on search query and selected category
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Only show public items
    filtered = filtered.filter((item) => item.public === true);

    setFilteredItems(filtered);
  }, [searchQuery, selectedCategory, items]);

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
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Explore public wardrobe items</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6c757d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Sliders size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.selectedCategoryChip,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.selectedCategoryChipText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
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
  filterButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedCategoryChip: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  categoryChipText: {
    fontFamily: 'Inter-Medium',
    color: '#6c757d',
    fontSize: 14,
  },
  selectedCategoryChipText: {
    color: '#fff',
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
});