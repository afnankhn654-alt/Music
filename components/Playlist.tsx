import React from 'react';
import { type Song } from '../types';
import { PlayIcon, VolumeUpIcon, MusicNoteIcon } from './icons';

interface PlaylistProps {
  songs: Song[];
  currentSongIndex: number | null;
  onSelectSong: (index: number) => void;
}

const PlaylistItem: React.FC<{
  song: Song;
  isActive: boolean;
  onClick: () => void;
}> = ({ song, isActive, onClick }) => {
  return (
    <li
      onClick={onClick}
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-teal-500/20 text-teal-300'
          : 'hover:bg-slate-800/60'
      }`}
    >
      <div className="w-10 h-10 flex-shrink-0 mr-4 flex items-center justify-center bg-slate-700/50 rounded-md overflow-hidden">
        {song.albumArt ? (
          <img src={song.albumArt} alt={song.name} className="w-full h-full object-cover" />
        ) : (
          isActive ? (
            <VolumeUpIcon className="w-5 h-5 text-teal-400 animate-pulse" />
          ) : (
            <MusicNoteIcon className="w-5 h-5 text-slate-400" />
          )
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        <p className="font-medium truncate">{song.name}</p>
        <p className="text-sm text-slate-400 truncate">{song.artist}</p>
      </div>
    </li>
  );
};

const Playlist: React.FC<PlaylistProps> = ({ songs, currentSongIndex, onSelectSong }) => {
  return (
    <div>
        <h2 className="text-2xl font-semibold mb-4 text-slate-300 tracking-wide">Queue</h2>
        <ul className="space-y-2">
        {songs.map((song, index) => (
            <PlaylistItem
                key={`${song.id}-${index}`}
                song={song}
                isActive={index === currentSongIndex}
                onClick={() => onSelectSong(index)}
            />
        ))}
        </ul>
    </div>
  );
};

export default Playlist;
