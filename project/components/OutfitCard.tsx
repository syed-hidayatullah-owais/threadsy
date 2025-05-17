import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

interface OutfitCardProps {
  outfit: {
    id?: string;
    _id?: string;
    title: string;
    items: any[];
    occasion: string;
  };
  style?: object;
  onPress?: () => void;
}

export default function OutfitCard({ outfit, style, onPress }: OutfitCardProps) {
  const displayItems = outfit.items.slice(0, 3);
  
  // Get a nice background color based on occasion
  const getBackgroundColor = (occasion: string) => {
    switch (occasion) {
      case 'work':
        return '#F1F3F5';
      case 'casual':
        return '#FFF3BF';
      case 'formal':
        return '#EDF2FF';
      default:
        return '#F8F9FA';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={onPress}
    >
      <View 
        style={[
          styles.card, 
          { backgroundColor: getBackgroundColor(outfit.occasion) }
        ]}
      >
        <View style={styles.imagesContainer}>
          {displayItems.map((item, index) => (
            <Image
              key={item.id || item._id}
              source={{ uri: item.image }}
              style={[
                styles.itemImage,
                index === 0 && { left: 20 },
                index === 1 && styles.middleImage,
                index === 2 && { right: 20 },
              ]}
            />
          ))}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{outfit.title}</Text>
          <Text style={styles.itemCount}>{outfit.items.length} items</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  card: {
    width: 180,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  imagesContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    position: 'absolute',
    backgroundColor: '#fff',
  },
  middleImage: {
    zIndex: 2,
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#212529',
  },
  itemCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
});