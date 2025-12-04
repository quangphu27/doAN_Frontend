import { API } from '../constants/config';

const API_URL = API || '192.168.1.11:5000';
export const getFullImageUrl = (imageUrl?: string): string | undefined => {
  if (!imageUrl) return undefined;
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/')) {
    return `${API_URL}${imageUrl}`;
  }
  
  const isGameImage = imageUrl.includes('originalImage') || 
      imageUrl.includes('puzzle') || 
      imageUrl.includes('coloring') || 
      imageUrl.includes('matching') ||
      imageUrl.includes('game') ||
      imageUrl.includes('media') ||
      imageUrl.match(/^\w+-\d+-\d+\.(jpg|jpeg|png|gif|mp4|mov|webm)$/) ||
      imageUrl.match(/^media-\d+-\d+\.(jpg|jpeg|png|gif|mp4|mov|webm)$/);
  
  const fullUrl = isGameImage ? `${API_URL}/uploads/games/${imageUrl}` : `${API_URL}/uploads/${imageUrl}`;
  
  return fullUrl;
};

export const getImageSource = (imageUrl?: string) => {
  const fullUrl = getFullImageUrl(imageUrl);
  return fullUrl ? { uri: fullUrl } : undefined;
};
