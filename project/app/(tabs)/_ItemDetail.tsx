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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Share2, Edit2, Trash2 } from 'lucide-react-native';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await api.get(`/wardrobe/${id}`);
        if (error) throw new Error(error);
        
        setItem(data);
        setLiked(data.likes?.includes(user?.id));
        setLikeCount(data.likes?.length || 0);
        setIsOwner(data.user?.id === user?.id);
      } catch (err) {
        console.error('Error fetching item details:', err);
        Alert.alert('Error', 'Could not load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id, user?.id]);
  
  const handleLike = async () => {
    try {
      if (liked) {
        await api.delete(`/wardrobe/${id}/like`);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await api.post(`/wardrobe/${id}/like`);
        setLikeCount(prev => prev + 1);
      }
      setLiked(!liked);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };
  
  const handleDelete = async () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item from your wardrobe?',
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
              await api.delete(`/wardrobe/${id}`);
              Alert.alert('Success', 'Item deleted successfully');
              router.back();
            } catch (err) {
              console.error('Error deleting item:', err);
              Alert.alert('Error', 'Could not delete item');
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
        <Text style={styles.loadingText}>Loading item details...</Text>
      </View>
    );
  }
  
  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Item not found</Text>
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
        <Text style={styles.headerTitle}>Item Details</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
        
        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.name}</Text>
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
          </View>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{item.category}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color</Text>
              <View style={styles.colorInfo}>
                <View 
                  style={[
                    styles.colorDot, 
                    { backgroundColor: item.color === 'Black' ? '#000' : 
                                   item.color === 'White' ? '#FFF' : 
                                   item.color === 'Red' ? '#FF0000' : 
                                   item.color === 'Blue' ? '#0000FF' : 
                                   item.color === 'Green' ? '#00FF00' :
                                   item.color === 'Yellow' ? '#FFFF00' :
                                   item.color === 'Purple' ? '#800080' :
                                   item.color === 'Pink' ? '#FFC0CB' :
                                   item.color === 'Brown' ? '#A52A2A' :
                                   item.color === 'Gray' ? '#808080' : '#CCC' 
                    }
                  ]} 
                />
                <Text style={styles.infoValue}>{item.color}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Season</Text>
              <Text style={styles.infoValue}>{item.season}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Added</Text>
              <Text style={styles.infoValue}>
                {new Date(item.dateAdded).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Visibility</Text>
              <View style={styles.visibilityBadge}>
                <Text style={styles.visibilityText}>
                  {item.public ? 'Public' : 'Private'}
                </Text>
              </View>
            </View>
          </View>
          
          {isOwner && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => router.push(`/edit-item/${id}`)}
              >
                <Edit2 size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Trash2 size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity style={styles.shareButton}>
            <Share2 size={20} color="#4ECDC4" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 350,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 400,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#212529',
    flex: 1,
    marginRight: 16,
  },
  likeButton: {
    alignItems: 'center',
  },
  likeCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  infoLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6c757d',
  },
  infoValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#212529',
  },
  colorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  visibilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  visibilityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#212529',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#4ECDC4',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    borderRadius: 8,
  },
  shareButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#4ECDC4',
    marginLeft: 8,
  },
});
