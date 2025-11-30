import { type Song } from '../types';

// The SECURE way: Use environment variables (Secrets) exclusively.
const API_KEY = process.env.API_KEY;

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export class ApiKeyMissingError extends Error {
  constructor(message = "Action Required: YouTube API key is missing. Please add it to the 'Secrets' tab to enable YouTube features.") {
    super(message);
    this.name = "ApiKeyMissingError";
  }
}

const transformYoutubeItemToSong = (item: any): Song => {
  const videoId = typeof item.id === 'string' ? item.id : item.id.videoId;
  return {
    id: videoId,
    videoId: videoId,
    name: item.snippet.title,
    artist: item.snippet.channelTitle,
    albumArt: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    source: 'youtube',
  };
};

export const searchYoutube = async (query: string): Promise<Song[]> => {
  if (!API_KEY) {
    throw new ApiKeyMissingError();
  }

  const url = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=15&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        console.error("YouTube API error:", errorData);
        throw new Error(`YouTube API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.items
      .filter((item: any) => item.id.videoId) // Ensure item is a video with an ID
      .map(transformYoutubeItemToSong);
  } catch (error) {
    console.error("Failed to search YouTube:", error);
    // Re-throw other errors if necessary, or return empty
    if (error instanceof ApiKeyMissingError) throw error;
    return [];
  }
};

export const getTrendingMusic = async (regionCode: string): Promise<Song[]> => {
    if (!API_KEY) {
        throw new ApiKeyMissingError();
    }
  
    const url = `${BASE_URL}/videos?part=snippet,contentDetails&chart=mostPopular&regionCode=${regionCode}&videoCategoryId=10&maxResults=15&key=${API_KEY}`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("YouTube API error:", errorData);
        throw new Error(`YouTube API error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.items.map(transformYoutubeItemToSong);
    } catch (error) {
      console.error("Failed to fetch trending music:", error);
      if (error instanceof ApiKeyMissingError) throw error;
      return [];
    }
  };