import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Heart } from 'lucide-react-native';

interface ItemCardProps {
  item: {
    id: string;
    _id?: string;
    name: string;
    category: string;
    color: string;
    image: string;
    public: boolean;
  };
  style?: object;
  contentWidth?: number;
  onPress?: () => void;
}

export default function ItemCard({ item, style, contentWidth, onPress }: ItemCardProps) {
  const [liked, setLiked] = React.useState(false);
  const cardWidth = contentWidth || Dimensions.get('window').width - 32;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        style,
        { width: cardWidth }
      ]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering parent onPress
            setLiked(!liked);
          }}
        >
          <Heart 
            size={18} 
            color={liked ? '#FF6B6B' : '#fff'} 
            fill={liked ? '#FF6B6B' : 'none'} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.category}>{item.category}</Text>
          <View style={styles.colorIndicator}>
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
            <Text style={styles.colorName}>{item.color}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  likeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#212529',
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6c757d',
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  colorName: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6c757d',
  },
});