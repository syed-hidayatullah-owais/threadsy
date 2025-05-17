import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';
import { api } from '../../services/api';
import DropDownPicker from 'react-native-dropdown-picker';

const categories = [
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
];

const seasons = [
  { label: 'Spring', value: 'spring' },
  { label: 'Summer', value: 'summer' },
  { label: 'Fall', value: 'fall' },
  { label: 'Winter', value: 'winter' },
  { label: 'All seasons', value: 'all' },
];

const colors = [
  { label: 'Black', value: 'black' },
  { label: 'White', value: 'white' },
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Purple', value: 'purple' },
  { label: 'Pink', value: 'pink' },
  { label: 'Orange', value: 'orange' },
  { label: 'Brown', value: 'brown' },
  { label: 'Gray', value: 'gray' },
];

export default function EditItemScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  // Dropdown states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState<string | null>(null);

  const [colorOpen, setColorOpen] = useState(false);
  const [colorValue, setColorValue] = useState<string | null>(null);

  const [seasonOpen, setSeasonOpen] = useState(false);
  const [seasonValue, setSeasonValue] = useState<string | null>(null);

  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {    const fetchItemDetails = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await api.get(`/wardrobe/${id}`);
        if (error) throw new Error(error);
        
        // Type assertion for data
        const itemData = data as {
          name?: string;
          image?: string;
          category?: string;
          color?: string;
          season?: string;
          public?: boolean;
        };
        
        // Populate form with existing data
        setName(itemData.name || '');
        setImage(itemData.image || '');
        setCategoryValue(itemData.category?.toLowerCase() || null);
        setColorValue(itemData.color?.toLowerCase() || null);
        setSeasonValue(itemData.season?.toLowerCase() || null);
        setIsPublic(itemData.public === undefined ? true : itemData.public);
      } catch (err) {
        console.error('Error fetching item details:', err);
        Alert.alert('Error', 'Could not load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePicture = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is required to take photos');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const handleSubmit = async () => {
    if (!name || !categoryValue || !colorValue || !seasonValue) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      let imageUrl = image;
        // If the image has changed (not a URL), upload it first
      if (image && !image.startsWith('http')) {
        // Upload directly using the image URI
        const uploadResult = await api.uploadImage('/wardrobe/image', image);
        
        if (uploadResult.error) {
          throw new Error('Failed to upload image');
        }
        
        // Access data.url from the response
        imageUrl = uploadResult.data?.url || image;
      }
      
      // Update the item
      const { error } = await api.put(`/wardrobe/${id}`, {
        name,
        category: categoryValue,
        color: colorValue,
        season: seasonValue,
        public: isPublic,
        image: imageUrl,
      });
      
      if (error) throw new Error(error);
      
      Alert.alert('Success', 'Item updated successfully');
      router.back();
    } catch (err) {
      console.error('Error updating item:', err);
      Alert.alert('Error', 'Failed to update item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading item...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          disabled={submitting}
        >
          <ArrowLeft size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Item</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.imageContainer} 
          onPress={pickImage}
          disabled={submitting}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="image" size={48} color="#adb5bd" />
              <Text style={styles.placeholderText}>Tap to select image</Text>
            </View>
          )}
          
          <View style={styles.imageOptions}>
            <TouchableOpacity 
              style={styles.imageOptionButton}
              onPress={pickImage}
              disabled={submitting}
            >
              <Feather name="image" size={20} color="#FF6B6B" />
              <Text style={styles.imageOptionText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imageOptionButton}
              onPress={takePicture}
              disabled={submitting}
            >
              <Feather name="camera" size={20} color="#FF6B6B" />
              <Text style={styles.imageOptionText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Blue Denim Jacket"
            editable={!submitting}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <DropDownPicker
            open={categoryOpen}
            value={categoryValue}
            items={categories}
            setOpen={setCategoryOpen}
            setValue={setCategoryValue}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            placeholderStyle={styles.placeholderText}
            listMode="SCROLLVIEW"
            scrollViewProps={{
              nestedScrollEnabled: true,
            }}
            disabled={submitting}
          />
        </View>

        {!categoryOpen && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Color</Text>
            <DropDownPicker
              open={colorOpen}
              value={colorValue}
              items={colors}
              setOpen={setColorOpen}
              setValue={setColorValue}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderText}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
              disabled={submitting}
            />
          </View>
        )}

        {!colorOpen && !categoryOpen && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Season</Text>
            <DropDownPicker
              open={seasonOpen}
              value={seasonValue}
              items={seasons}
              setOpen={setSeasonOpen}
              setValue={setSeasonValue}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderText}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
              disabled={submitting}
            />
          </View>
        )}

        {!seasonOpen && !colorOpen && !categoryOpen && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.visibilityButtons}>
              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  isPublic && styles.visibilityButtonActive,
                ]}
                onPress={() => setIsPublic(true)}
                disabled={submitting}
              >
                <Feather
                  name="globe"
                  size={18}
                  color={isPublic ? '#fff' : '#6c757d'}
                />
                <Text
                  style={[
                    styles.visibilityButtonText,
                    isPublic && styles.visibilityButtonTextActive,
                  ]}
                >
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  !isPublic && styles.visibilityButtonActive,
                ]}
                onPress={() => setIsPublic(false)}
                disabled={submitting}
              >
                <Feather
                  name="lock"
                  size={18}
                  color={!isPublic ? '#fff' : '#6c757d'}
                />
                <Text
                  style={[
                    styles.visibilityButtonText,
                    !isPublic && styles.visibilityButtonTextActive,
                  ]}
                >
                  Private
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Update Item</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeholderText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  imageOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 8,
  },
  imageOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    minHeight: 50,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  visibilityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  visibilityButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  visibilityButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
  },
  visibilityButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});
