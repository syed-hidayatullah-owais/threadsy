import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Check, ArrowLeft, Wand2, Image as ImageIcon } from 'lucide-react-native';
import { api } from '../services/api';
import { visionService } from '../services/vision.service';
import { mediapipeService } from '../services/mediapipe.service';
import { firebaseStorage } from '../services/firebase.service';

const CATEGORIES = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
];

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Purple', value: '#800080' },
  { name: 'Pink', value: '#FFC0CB' },
  { name: 'Brown', value: '#A52A2A' },
  { name: 'Gray', value: '#808080' },
];

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter', 'All Seasons'];

export default function AddItemScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [facing, setFacing] = useState('back');
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [season, setSeason] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [processingBackground, setProcessingBackground] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const cameraRef = useRef<any>(null);

  const toggleCameraFacing = () => {
    setFacing((current: string) => (current === 'back' ? 'front' : 'back'));
  };

  const activateCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        return;
      }
    }
    setCameraActive(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        
        // Resize and optimize the image
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 500 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        setImage(manipulatedImage.uri);
        setCameraActive(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        if (Platform.OS === 'web') {
          // Fallback for web - use a mock image
          setImage('https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg');
          setCameraActive(false);
        }
      }
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions first if needed
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant access to your photos to use this feature.');
        return;
      }
      
      // Launch the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled) {
        // Resize and optimize the image for better performance
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 500 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        setImage(manipulatedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  // Analyze the clothing image with Google Cloud Vision API
  const analyzeImage = async () => {
    if (!image) return;
    
    setAnalyzing(true);
    try {
      const analysis = await visionService.analyzeClothing(image);
      
      if (analysis.error) {
        Alert.alert('Analysis Error', analysis.error);
        return;
      }
      
      // Auto-fill form fields based on Vision API results
      if (analysis.suggestedCategory) {
        setCategory(analysis.suggestedCategory);
      }
      
      if (analysis.suggestedColor) {
        setColor(analysis.suggestedColor);
      }
      
      // Generate a name suggestion based on color and category
      if (analysis.suggestedColor && analysis.suggestedCategory) {
        setName(`${analysis.suggestedColor} ${analysis.suggestedCategory.slice(0, -1)}`);
      }
      
      // Show results to user
      Alert.alert(
        'Auto-Detection Results',
        `Detected: ${analysis.detectedLabels.slice(0, 3).map((label: any) => label.description).join(', ')}\n\nSuggested Category: ${analysis.suggestedCategory}\nSuggested Color: ${analysis.suggestedColor}`,
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Error', 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  // Remove background from the image using MediaPipe
  const removeBackground = async () => {
    if (!image) return;
    
    setProcessingBackground(true);
    try {
      const backgroundRemovedImageUrl = await mediapipeService.removeBackground(image);
      setProcessedImage(backgroundRemovedImageUrl);
      Alert.alert('Success', 'Background removed successfully');
    } catch (error) {
      console.error('Error removing background:', error);
      Alert.alert('Error', 'Failed to remove background');
    } finally {
      setProcessingBackground(false);
    }
  };

  const saveItem = async () => {
    if (!name || !category || !color || !season) {
      Alert.alert('Missing Information', 'Please fill out all fields');
      return;
    }

    if (!image && Platform.OS !== 'web') {
      Alert.alert('Missing Image', 'Please take a photo of your item');
      return;
    }

    try {
      // Generate a unique ID
      const itemId = Date.now().toString();
      
      // Use the processed image if available, otherwise use the original image
      const finalImage = processedImage || image;
      
      // Create the new item object
      let newItem = {
        id: itemId,
        name,
        category,
        color,
        season,
        public: isPublic,
        // For web we'll use placeholder image, otherwise we'll update with the uploaded URL
        image: (Platform.OS === 'web' && !finalImage) ? 'https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg' : '',
        dateAdded: new Date().toISOString(),
      };

      // Upload image to Firebase Storage
      let imageUrl = '';
      if (finalImage && finalImage !== 'https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg') {
        try {
          // Show upload progress indicator
          setUploading(true);
          setUploadProgress(0);
          
          // Path in Firebase Storage
          const storagePath = `wardrobe/${itemId}/${Date.now()}.jpg`;
          
          // Upload the image to Firebase Storage
          imageUrl = await firebaseStorage.uploadFile(finalImage, storagePath, (progress) => {
            console.log(`Upload progress: ${progress}%`);
            setUploadProgress(progress);
          });
          
          newItem.image = imageUrl;
        } catch (uploadError) {
          console.error('Firebase upload error:', uploadError);
          
          // Fallback to API upload if Firebase fails
          const uploadRes = await api.uploadImage('/wardrobe/image', finalImage);
          if (uploadRes.error) throw new Error(uploadRes.error);
          imageUrl = uploadRes.data.url;
          newItem.image = imageUrl;
        } finally {
          setUploading(false);
        }
      } else if (Platform.OS === 'web') {
        // For web, use the mock image if no image is available
        imageUrl = 'https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg';
        newItem.image = imageUrl;
      }
      
      // POST new item to backend
      const { error: postError } = await api.post('/wardrobe', newItem);
      if (postError) throw new Error(postError);

      // Reset form
      setImage(null);
      setProcessedImage(null);
      setName('');
      setCategory('');
      setColor('');
      setSeason('');
      setIsPublic(true);

      Alert.alert('Success', 'Item added to your wardrobe!');
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    }
  };

  // Upload Progress Overlay
  const UploadOverlay = () => {
    return (
      <View style={styles.uploadOverlay}>
        <View style={styles.uploadProgressContainer}>
          <Text style={styles.uploadProgressText}>Uploading Image</Text>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.uploadProgressPercentage}>{uploadProgress.toFixed(0)}%</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  if (cameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setCameraActive(false)}
            >
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <Camera size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {uploading && <UploadOverlay />}
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add to Wardrobe</Text>
        </View>

        <View style={styles.imageSection}>
          {image ? (
            <View>
              <View style={styles.previewContainer}>
                <Image source={{ uri: processedImage || image }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => {
                    setImage(null);
                    setProcessedImage(null);
                  }}
                >
                  <X size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={[styles.imageActionButton, analyzing && styles.disabledButton]} 
                  onPress={analyzeImage}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Wand2 size={16} color="#FFF" />
                      <Text style={styles.imageActionButtonText}>Auto-Detect</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.imageActionButton, processingBackground && styles.disabledButton]} 
                  onPress={removeBackground}
                  disabled={processingBackground}
                >
                  {processingBackground ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Camera size={16} color="#FFF" />
                      <Text style={styles.imageActionButtonText}>Remove Background</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={activateCamera}
              >
                <Camera size={32} color="#4ECDC4" />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={pickImage}
              >
                <ImageIcon size={32} color="#4ECDC4" />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="E.g., Blue Denim Jacket"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    category === cat && styles.selectedChip,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat && styles.selectedChipText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorsContainer}
            >
              {COLORS.map((clr) => (
                <TouchableOpacity
                  key={clr.name}
                  style={[
                    styles.colorChip,
                    { backgroundColor: clr.value },
                    color === clr.name && styles.selectedColorChip,
                  ]}
                  onPress={() => setColor(clr.name)}
                >
                  {color === clr.name && (
                    <Check size={16} color={clr.name === 'White' ? '#000' : '#FFF'} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Season</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {SEASONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    season === s && styles.selectedChip,
                  ]}
                  onPress={() => setSeason(s)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      season === s && styles.selectedChipText,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isPublic && styles.activeToggle,
                ]}
                onPress={() => setIsPublic(true)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isPublic && styles.activeToggleText,
                  ]}
                >
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !isPublic && styles.activeToggle,
                ]}
                onPress={() => setIsPublic(false)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    !isPublic && styles.activeToggleText,
                  ]}
                >
                  Private
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveItem}
          >
            <Text style={styles.saveButtonText}>Add to Wardrobe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#212529',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 450,
    padding: 16,
  },
  imageButton: {
    width: 150,
    height: 150,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 8,
  },
  imageButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#4ECDC4',
    marginTop: 8,
  },
  previewContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e9ecef',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  imageActionButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  imageActionButtonText: {
    color: '#FFF',
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  chipsContainer: {
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#4ECDC4',
  },
  chipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#495057',
  },
  selectedChipText: {
    color: '#fff',
  },
  colorsContainer: {
    paddingVertical: 8,
  },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedColorChip: {
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#4ECDC4',
  },
  toggleText: {
    fontFamily: 'Inter-Medium',
    color: '#6c757d',
  },
  activeToggleText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#FFF',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadProgressContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  uploadProgressText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#212529',
    marginBottom: 16,
  },
  uploadProgressPercentage: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#4ECDC4',
    marginTop: 10,
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4ECDC4',
  },
});