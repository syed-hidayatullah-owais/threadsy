import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Href } from 'expo-router';
import { ArrowLeft, Heart, Share2, MessageCircle } from 'lucide-react-native';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ItemCard from '@/components/ItemCard';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';

// Define types for the outfit and its items
interface OutfitItem {
  _id?: string;
  id?: string;
  name: string;
  category: string;
  image: string;
}

interface OutfitType {
  _id?: string;
  id?: string;
  title: string;
  occasion: string;
  notes?: string;
  items: OutfitItem[];
  user: {
    id?: string;
    _id?: string;
  };
  likes: string[];
}

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [outfit, setOutfit] = useState<OutfitType | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchOutfitDetails = async () => {
      if (!id) return;
        try {        
        const { data, error } = await api.get(`/outfits/${id}`);
        if (error) throw new Error(error);
        
        if (data) {
          // Type cast the data to OutfitType
          const outfitData = data as OutfitType;          setOutfit(outfitData);
          setLiked(outfitData.likes?.includes(user?.id || '') || false);
          setLikeCount(outfitData.likes?.length || 0);
          setIsOwner(outfitData.user?.id === user?.id);
        }
      } catch (err) {
        console.error('Error fetching outfit details:', err);
        Alert.alert('Error', 'Could not load outfit details');
      } finally {
        setLoading(false);
      }
    };

    fetchOutfitDetails();
  }, [id, user?.id]);
  
  const handleLike = async () => {
    try {
      if (liked) {
        await api.delete(`/outfits/${id}/like`);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await api.post(`/outfits/${id}/like`);
        setLikeCount(prev => prev + 1);
      }
      setLiked(!liked);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };
  
  const handleDelete = async () => {
    Alert.alert(
      'Delete Outfit',
      'Are you sure you want to delete this outfit?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/outfits/${id}`);
              Alert.alert('Success', 'Outfit deleted successfully');
              router.back();
            } catch (err) {
              console.error('Error deleting outfit:', err);
              Alert.alert('Error', 'Could not delete outfit');
            }
          },
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading outfit details...</Text>
      </View>
    );
  }
  
  if (!outfit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Outfit not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Outfit Details</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.outfitHeader}>
          <Text style={styles.outfitTitle}>{outfit.title}</Text>
          <View style={styles.occasionBadge}>
            <Text style={styles.occasionText}>{outfit.occasion}</Text>
          </View>
        </View>
        
        <View style={styles.itemsGrid}>
          {outfit.items?.map((item: any) => (            <TouchableOpacity 
              key={item._id || item.id} 
              style={styles.itemContainer}
              onPress={() => router.push(`/item/${item._id || item.id}` as Href)}
            >
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.socialSection}>
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
              <Heart 
                size={24} 
                color={liked ? '#FF6B6B' : '#6c757d'} 
                fill={liked ? '#FF6B6B' : 'none'} 
              />
              {likeCount > 0 && (
                <Text style={styles.likeCount}>{likeCount}</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.commentButton}>
              <MessageCircle size={24} color="#6c757d" />
              <Text style={styles.actionButtonText}>Comment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton}>
              <Share2 size={24} color="#6c757d" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {isOwner && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => router.push(`/edit-outfit/${id}` as Href)}
            >
              <Text style={styles.actionButtonText}>Edit Outfit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={styles.actionButtonText}>Delete Outfit</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {outfit.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{outfit.notes}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: '#dc3545',
    marginBottom: 16,
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
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#212529',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FF6B6B',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  outfitTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#212529',
    flex: 1,
  },
  occasionBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  occasionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#495057',
    textTransform: 'capitalize',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  itemContainer: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  itemInfo: {
    padding: 8,
  },
  itemName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#212529',
  },
  itemCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  socialSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  likeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  likeCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 4,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#4ECDC4',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  notesSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  notesTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#212529',
    marginBottom: 8,
  },
  notesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
});
