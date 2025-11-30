import React from 'react';
import { type Song } from '../types';
import { PlayIcon } from './icons';

interface SearchResultsProps {
  results: Song[];
  onSelectSong: (song: Song) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelectSong }) => {
  if (results.length === 0) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 overflow-y-auto p-6 animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-white">Search Results</h2>
      <ul className="space-y-3">
        {results.map((song) => (
          <li
            key={song.id}
            onClick={() => onSelectSong(song)}
            className="flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-slate-800/60 group"
          >
            <div className="w-16 h-16 flex-shrink-0 mr-4 relative">
              {song.albumArt && <img src={song.albumArt} alt={song.name} className="w-full h-full object-cover rounded-md" />}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-grow overflow-hidden">
              <p className="font-semibold text-white truncate">{song.name}</p>
              <p className="text-sm text-slate-400 truncate">{song.artist}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchResults;
