import vision from '@google-cloud/vision';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Google Cloud Vision Setup
let client;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    console.log('Google Cloud Vision API initialized successfully');
  } else {
    console.log('Google Cloud Vision credentials not provided. Using mock data.');
    client = null;
  }
} catch (error) {
  console.error('Failed to initialize Google Cloud Vision:', error);
  client = null;
}

/**
 * Analyzes an image using Google Cloud Vision to detect clothing information
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} - Clothing detection results
 */
export const analyzeClothingImage = async (imageUrl) => {
  try {
    let labels;
    let colors;
    
    if (!client) {
      // Use mock data when Google Cloud Vision client is not available
      console.log('Using mock data for clothing analysis');
      
      // Mock labels data
      labels = [
        { description: 'T-shirt', score: 0.95 },
        { description: 'Clothing', score: 0.92 },
        { description: 'Top', score: 0.88 },
        { description: 'Casual wear', score: 0.82 }
      ];
      
      const clothingLabels = labels;
      
      // Mock colors data
      colors = [
        {
          rgb: { red: 30, green: 144, blue: 255 },
          score: 0.8,
          pixelFraction: 0.5
        },
        {
          rgb: { red: 255, green: 255, blue: 255 },
          score: 0.15,
          pixelFraction: 0.3
        },
        {
          rgb: { red: 0, green: 0, blue: 0 },
          score: 0.05,
          pixelFraction: 0.2
        }
      ];
      
      // Map detected color to predefined colors
      const mainColor = mapRGBToNamedColor(colors[0].rgb);
      
      return {
        detectedLabels: clothingLabels.map(label => ({
          description: label.description,
          confidence: label.score
        })),
        dominantColors: colors,
        suggestedCategory: 'top',
        mainColor
      };
    }
    
    // Analyze the image with Google Vision API
    let [result] = await client.labelDetection(imageUrl);
    labels = result.labelAnnotations;

    // Filter for clothing-related labels
    const clothingLabels = labels.filter(label => 
      ['clothing', 'dress', 'shirt', 'pants', 'skirt', 'jacket', 'coat', 
       'shoe', 'jeans', 'sweater', 'blouse', 'suit', 'hat', 'accessory'].some(
        keyword => label.description.toLowerCase().includes(keyword)
      )
    );

    // Detect colors in the image
    [result] = await client.imageProperties(imageUrl);
    colors = result.imagePropertiesAnnotation.dominantColors.colors
      .slice(0, 3)
      .map(color => {
        const rgb = {
          red: color.color.red,
          green: color.color.green,
          blue: color.color.blue
        };
        return {
          rgb,
          score: color.score,
          pixelFraction: color.pixelFraction
        };
      });

    // Map detected color to predefined colors
    const mainColor = mapRGBToNamedColor(colors[0].rgb);

    // Get a category suggestion based on the labels
    const categorySuggestion = getCategorySuggestion(clothingLabels);

    return {
      detectedLabels: clothingLabels.map(label => ({
        description: label.description,
        confidence: label.score
      })),
      dominantColors: colors,
      suggestedCategory: categorySuggestion,
      suggestedColor: mainColor
    };
  } catch (error) {
    console.error('Error analyzing image with Vision API:', error);
    throw new Error('Failed to analyze clothing image');
  }
};

/**
 * Maps RGB values to the closest named color in our app
 * @param {Object} rgb - RGB color object
 * @returns {string} - Named color
 */
function mapRGBToNamedColor({ red, green, blue }) {
  // Define our app's color palette
  const colorMap = [
    { name: 'Black', rgb: { red: 0, green: 0, blue: 0 } },
    { name: 'White', rgb: { red: 255, green: 255, blue: 255 } },
    { name: 'Red', rgb: { red: 255, green: 0, blue: 0 } },
    { name: 'Blue', rgb: { red: 0, green: 0, blue: 255 } },
    { name: 'Green', rgb: { red: 0, green: 255, blue: 0 } },
    { name: 'Yellow', rgb: { red: 255, green: 255, blue: 0 } },
    { name: 'Purple', rgb: { red: 128, green: 0, blue: 128 } },
    { name: 'Pink', rgb: { red: 255, green: 192, blue: 203 } },
    { name: 'Brown', rgb: { red: 165, green: 42, blue: 42 } },
    { name: 'Gray', rgb: { red: 128, green: 128, blue: 128 } }
  ];

  // Calculate distance to each named color and find the closest one
  let closestColor = null;
  let closestDistance = Infinity;

  for (const color of colorMap) {
    const distance = Math.sqrt(
      Math.pow(red - color.rgb.red, 2) +
      Math.pow(green - color.rgb.green, 2) +
      Math.pow(blue - color.rgb.blue, 2)
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = color.name;
    }
  }

  return closestColor;
}

/**
 * Determine the clothing category based on detected labels
 * @param {Array} labels - Detected labels from Vision API
 * @returns {string} - Suggested category
 */
function getCategorySuggestion(labels) {
  const labelDescriptions = labels.map(label => label.description.toLowerCase());

  const categoryKeywords = {
    'Tops': ['shirt', 'tshirt', 't-shirt', 'blouse', 'sweater', 'top', 'hoodie', 'sweatshirt'],
    'Bottoms': ['pants', 'jeans', 'shorts', 'skirt', 'trousers', 'leggings'],
    'Dresses': ['dress', 'gown', 'frock'],
    'Outerwear': ['jacket', 'coat', 'blazer', 'cardigan', 'vest'],
    'Shoes': ['shoes', 'sneakers', 'boots', 'footwear', 'sandals'],
    'Accessories': ['hat', 'bag', 'purse', 'scarf', 'gloves', 'belt', 'jewelry', 'watch', 'accessory']
  };

  // Find the category with the most keyword matches
  let bestCategory = 'Tops'; // Default
  let maxMatches = 0;

  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    const matches = labelDescriptions.filter(label => 
      keywords.some(keyword => label.includes(keyword))
    ).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  });

  return bestCategory;
}
