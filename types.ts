export interface Song {
  id: string;
  name: string;
  source: 'local' | 'youtube';
  url?: string;
  videoId?: string;
  artist?: string;
  albumArt?: string;
}
