import React, { useMemo, useState, useEffect } from 'react';
import { type Song } from '../types';
import { MusicNoteIcon, PlayIcon } from './icons';
import { getTrendingMusic, ApiKeyMissingError } from '../api/youtube';

interface DiscoverProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
}

const GENRE_KEYWORDS = {
  'Electronic': ['electro', 'techno', 'house', 'edm', 'dance', 'trance'],
  'Rock': ['rock', 'metal', 'punk', 'alternative', 'indie'],
  'Chill': ['chill', 'ambient', 'lofi', 'acoustic', 'instrumental'],
  'Hip Hop': ['hip hop', 'rap', 'trap'],
  'Pop': ['pop', 'synthpop'],
  'Classical': ['classical', 'orchestra', 'symphony'],
};

const Discover: React.FC<DiscoverProps> = ({ songs, onSelectSong }) => {
  const [trending, setTrending] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoading(true);
      setApiKeyError(null);
      try {
        const trendingSongs = await getTrendingMusic('PK');
        setTrending(trendingSongs);
      } catch (error) {
        if (error instanceof ApiKeyMissingError) {
            setApiKeyError(error.message);
        } else {
            console.error("Failed to fetch trending music:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const localSongs = useMemo(() => songs.filter(s => s.source === 'local'), [songs]);

  const forYouSongs = useMemo(() => {
    return [...localSongs].sort(() => 0.5 - Math.random()).slice(0, 10);
  }, [localSongs]);

  const categorizedGenres = useMemo(() => {
    const categories: Record<string, Song[]> = Object.fromEntries(Object.keys(GENRE_KEYWORDS).map(g => [g, []]));
    
    localSongs.forEach(song => {
        const songIdentifier = `${song.name} ${song.artist}`.toLowerCase();
        let found = false;
        for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
            if (keywords.some(kw => songIdentifier.includes(kw))) {
                categories[genre].push(song);
                found = true;
                break; 
            }
        }
    });
    return Object.entries(categories).filter(([, genreSongs]) => genreSongs.length > 0);
  }, [localSongs]);

  return (
    <div className="space-y-12 animate-fade-in">
      <section>
        <h2 className="text-3xl font-bold mb-4 text-slate-200">Trending in Pakistan</h2>
        {isLoading ? (
          <div className="text-center py-10 text-slate-400">Loading trending music...</div>
        ) : apiKeyError ? (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-lg text-center">
                <p className="font-semibold">Could not load trending music.</p>
                <p className="text-sm mt-1">{apiKeyError}</p>
            </div>
        ) : (
          <ul className="space-y-2">
            {trending.map((song, index) => (
              <li key={song.id} onClick={() => onSelectSong(song)} className="flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-800/60 group">
                <div className="text-xl font-bold text-slate-500 w-8 text-center">{index + 1}</div>
                <div className="w-12 h-12 flex-shrink-0 mx-4 relative">
                  {song.albumArt && <img src={song.albumArt} alt={song.name} className="w-full h-full object-cover rounded-md" />}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-grow overflow-hidden">
                  <p className="font-medium truncate text-white">{song.name}</p>
                  <p className="text-sm text-slate-400 truncate">{song.artist}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {forYouSongs.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold mb-4 text-slate-200">For You (From Library)</h2>
          <div className="flex overflow-x-auto space-x-4 pb-4 -mx-4 px-4">
            {forYouSongs.map(song => (
              <div key={song.id} className="flex-shrink-0 w-40 cursor-pointer group" onClick={() => onSelectSong(song)}>
                <div className="w-40 h-40 bg-slate-800 rounded-lg flex items-center justify-center text-teal-400 relative overflow-hidden">
                  <MusicNoteIcon className="w-16 h-16" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayIcon className="w-12 h-12 text-white" />
                  </div>
                </div>
                <p className="font-semibold mt-2 truncate">{song.name}</p>
                <p className="text-sm text-slate-400 truncate">{song.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {categorizedGenres.length > 0 && (
        <section>
            <h2 className="text-3xl font-bold mb-4 text-slate-200">Genre Stations (From Library)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categorizedGenres.map(([genre, genreSongs]) => (
                    <div key={genre} onClick={() => onSelectSong(genreSongs[0])} className="aspect-video bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg p-4 flex flex-col justify-end text-white font-bold text-xl cursor-pointer relative group overflow-hidden">
                       <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors"></div>
                       <span className="relative z-10">{genre}</span>
                    </div>
                ))}
            </div>
        </section>
      )}

    </div>
  );
};

export default Discover;