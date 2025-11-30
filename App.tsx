import React, { useState, useCallback, useRef, useEffect } from 'react';
import { type Song } from './types';
import Header from './components/Header';
import MusicUploader from './components/MusicUploader';
import Playlist from './components/Playlist';
import Discover from './components/Discover';
import SearchResults from './components/SearchResults';
import { searchYoutube, ApiKeyMissingError } from './api/youtube';
import { 
  MusicNoteIcon, LibraryIcon, CompassIcon, PlayIcon, 
  PauseIcon, NextIcon, PrevIcon, QueueListIcon 
} from './components/icons';
import useDeviceDetect from './hooks/useDeviceDetect';

const App: React.FC = () => {
  const { isMobile } = useDeviceDetect();
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'discover'>('library');

  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Player State
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentSong = currentSongIndex !== null ? songs[currentSongIndex] : null;

  // Load YouTube IFrame Player API
  useEffect(() => {
    if ((window as any).YT) return; // Don't load script if it's already there

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
        youtubePlayerRef.current = new (window as any).YT.Player('youtube-player', {
            height: '0',
            width: '0',
            playerVars: {
                playsinline: 1,
            },
            events: {
                'onReady': () => {},
                'onStateChange': onPlayerStateChange,
                'onError': (e: any) => console.error("YouTube Player Error:", e.data),
            }
        });
    };

    return () => {
        if (document.body.contains(tag)) {
            tag.remove();
        }
        (window as any).onYouTubeIframeAPIReady = null;
    }
  }, []);

  const onPlayerStateChange = (event: any) => {
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
        setIsPlaying(true);
    } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
        setIsPlaying(false);
    } else if (event.data === (window as any).YT.PlayerState.ENDED) {
        handleNextSong();
    }
  };

  // Main playback useEffect
  useEffect(() => {
    if (!currentSong) return;
    setProgress(0);
    setDuration(0);

    if (currentSong.source === 'local') {
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.pauseVideo === 'function') {
        youtubePlayerRef.current.pauseVideo();
      }
      if (audioRef.current && currentSong.url) {
        audioRef.current.src = currentSong.url;
        audioRef.current.load();
        audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
      }
    } else if (currentSong.source === 'youtube' && currentSong.videoId) {
      if (audioRef.current) audioRef.current.pause();
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.loadVideoById === 'function') {
        youtubePlayerRef.current.loadVideoById(currentSong.videoId);
        setIsPlaying(true);
      }
    }
  }, [currentSong]);
  
  // Progress tracking for YouTube
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && currentSong?.source === 'youtube' && youtubePlayerRef.current) {
        interval = setInterval(() => {
            const currentTime = youtubePlayerRef.current.getCurrentTime();
            const videoDuration = youtubePlayerRef.current.getDuration();
            setProgress(currentTime);
            if (videoDuration) setDuration(videoDuration);
        }, 250);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentSong]);


  const handleSongsUpload = (files: FileList) => {
    const newSongs: Song[] = Array.from(files)
      .filter(file => file.type.startsWith('audio/'))
      .map((file, index) => {
        const cleanedName = file.name.replace(/\.[^/.]+$/, "");
        const parts = cleanedName.split(' - ');
        const artist = parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
        const name = parts.length > 1 ? parts[1].trim() : parts[0].trim();

        return {
          id: (Date.now() + index).toString(),
          name,
          artist,
          url: URL.createObjectURL(file),
          source: 'local',
        };
      });
    
    setSongs(prevSongs => [...prevSongs, ...newSongs]);
    if (currentSongIndex === null && newSongs.length > 0) {
      setCurrentSongIndex(songs.length);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setApiKeyError(null);
    try {
      const results = await searchYoutube(query);
      setSearchResults(results);
    } catch (error) {
      if (error instanceof ApiKeyMissingError) {
        setApiKeyError(error.message);
        setSearchResults([]);
      } else {
        console.error("Failed to search YouTube:", error);
      }
    } finally {
      setIsSearching(false);
    }
  };
  
  const addSongToQueueAndPlay = (song: Song) => {
    const existingIndex = songs.findIndex(s => s.id === song.id);
    if (existingIndex !== -1) {
        setCurrentSongIndex(existingIndex);
    } else {
        const newSongs = [...songs];
        const insertIndex = currentSongIndex === null ? songs.length : currentSongIndex + 1;
        newSongs.splice(insertIndex, 0, song);
        setSongs(newSongs);
        setCurrentSongIndex(insertIndex);
    }
  };

  const handleSelectSearchResult = (song: Song) => {
    addSongToQueueAndPlay(song);
    setSearchResults([]);
  };

  const handleSelectSong = (index: number) => {
    setCurrentSongIndex(index);
  };
  
  const handleSelectDiscoveredSong = (songToPlay: Song) => {
    addSongToQueueAndPlay(songToPlay);
    setActiveTab('library');
  };

  const handleNextSong = useCallback(() => {
    if (songs.length > 0) {
      setCurrentSongIndex(prevIndex => 
        prevIndex === null ? 0 : (prevIndex + 1) % songs.length
      );
    }
  }, [songs.length]);

  const handlePrevSong = useCallback(() => {
    if (songs.length > 0) {
      setCurrentSongIndex(prevIndex =>
        prevIndex === null ? 0 : (prevIndex - 1 + songs.length) % songs.length
      );
    }
  }, [songs.length]);

  const togglePlayPause = () => {
    if (!currentSong) return;
    if (currentSong.source === 'local' && audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    } else if (currentSong.source === 'youtube' && youtubePlayerRef.current) {
        if (isPlaying) {
            youtubePlayerRef.current.pauseVideo();
        } else {
            youtubePlayerRef.current.playVideo();
        }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentSong) return;
    const time = Number(event.target.value);
    setProgress(time);
    if (currentSong.source === 'local' && audioRef.current) {
        audioRef.current.currentTime = time;
    } else if (currentSong.source === 'youtube' && youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(time, true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const renderContent = () => {
    if (activeTab === 'discover') {
        return <Discover songs={songs} onSelectSong={handleSelectDiscoveredSong} />;
    }
    return (
      <>
        <MusicUploader onSongsUpload={handleSongsUpload} />
        {songs.length > 0 ? (
        <Playlist 
            songs={songs} 
            currentSongIndex={currentSongIndex}
            onSelectSong={handleSelectSong}
        />
        ) : (
        <div className="flex flex-col items-center justify-center text-center text-slate-500 h-64 border-2 border-dashed border-slate-700 rounded-lg mt-8">
            <MusicNoteIcon className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold">Your library is empty</h2>
            <p>Search for music or upload your own files to get started!</p>
        </div>
        )}
      </>
    );
  };
  
  const mainContent = (
    <div className="p-6">
        <Header onSearch={handleSearch} />
        <div className="mt-8">
            {isSearching ? <div className="text-center text-slate-400">Searching...</div> : renderContent()}
        </div>
    </div>
  );
  
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Action Required</h2>
        <p className="text-slate-300 max-w-md">{message}</p>
        <p className="text-slate-400 mt-2 text-sm font-semibold">Please add your key and refresh the app.</p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="bg-slate-900 text-white min-h-screen flex flex-col font-sans">
        <main className="flex-grow pb-32 relative">
          {mainContent}
          {apiKeyError ? <ErrorDisplay message={apiKeyError} /> : (searchResults.length > 0 && <SearchResults results={searchResults} onSelectSong={handleSelectSearchResult}/>)}
        </main>
        {currentSong && (
          <div className="fixed bottom-16 left-0 right-0 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700 p-2 z-20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-slate-700 rounded-md flex items-center justify-center text-teal-400 flex-shrink-0 overflow-hidden">
                {currentSong.albumArt ? <img src={currentSong.albumArt} alt={currentSong.name} className="w-full h-full object-cover"/> : <MusicNoteIcon className="w-6 h-6" />}
              </div>
              <div className="flex-1 mx-3 min-w-0">
                  <p className="font-bold truncate">{currentSong.name}</p>
                  <p className="text-sm text-slate-400 truncate">{currentSong.artist}</p>
              </div>
              <button onClick={togglePlayPause} className="w-10 h-10 flex items-center justify-center text-white">
                  {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-600">
              <div className="bg-teal-400 h-full" style={{ width: `${(progress / duration) * 100 || 0}%` }}></div>
            </div>
          </div>
        )}
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 flex justify-around z-20">
            <button onClick={() => setActiveTab('library')} className={`flex flex-col items-center space-y-1 py-2 px-4 transition-colors ${activeTab === 'library' ? 'text-teal-400' : 'text-slate-400'}`}>
                <LibraryIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Library</span>
            </button>
            <button onClick={() => setActiveTab('discover')} className={`flex flex-col items-center space-y-1 py-2 px-4 transition-colors ${activeTab === 'discover' ? 'text-teal-400' : 'text-slate-400'}`}>
                <CompassIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Discover</span>
            </button>
        </nav>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans grid grid-cols-[auto,1fr] lg:grid-cols-[250px,1fr,350px] gap-2 p-2">
       <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNextSong}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />
      <div id="youtube-player" className="hidden"></div>
      
      {/* Sidebar */}
      <aside className="bg-slate-950/50 rounded-lg p-4 flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <MusicNoteIcon className="h-6 w-6 text-teal-400" />
            <h1 className="text-xl font-bold hidden lg:block">MyMusic</h1>
          </div>
          <nav className="flex flex-col space-y-2">
            <button onClick={() => setActiveTab('library')} className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${activeTab === 'library' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
                <LibraryIcon className="w-6 h-6" />
                <span className="font-semibold hidden lg:block">My Library</span>
            </button>
            <button onClick={() => setActiveTab('discover')} className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${activeTab === 'discover' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
                <CompassIcon className="w-6 h-6" />
                <span className="font-semibold hidden lg:block">Discover</span>
            </button>
          </nav>
      </aside>

      {/* Main Content */}
      <main className="bg-slate-950/50 rounded-lg overflow-y-auto relative">
        {mainContent}
        {apiKeyError ? <ErrorDisplay message={apiKeyError} /> : (searchResults.length > 0 && <SearchResults results={searchResults} onSelectSong={handleSelectSearchResult}/>)}
      </main>

      {/* Now Playing */}
      <aside className="bg-slate-950/50 rounded-lg p-6 flex-col hidden lg:flex">
        <h2 className="text-xl font-bold mb-6">Now Playing</h2>
        {currentSong ? (
          <div className="flex-grow flex flex-col">
            <div className="w-full aspect-square bg-slate-800 rounded-lg flex items-center justify-center text-teal-400 mb-6 shadow-2xl overflow-hidden">
                {currentSong.albumArt ? <img src={currentSong.albumArt} alt={currentSong.name} className="w-full h-full object-cover"/> : <MusicNoteIcon className="w-24 h-24" />}
            </div>
            <div className="text-center mb-6">
                <p className="text-2xl font-bold">{currentSong.name}</p>
                <p className="text-md text-slate-400">{currentSong.artist}</p>
            </div>
            
            <div className="w-full flex items-center space-x-2 mt-2 mb-6">
              <span className="text-xs text-slate-400 w-10 text-right">{formatTime(progress)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={progress}
                onChange={handleSeek}
                className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:rounded-full"
              />
              <span className="text-xs text-slate-400 w-10">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-center space-x-6">
              <button onClick={handlePrevSong} className="text-slate-300 hover:text-white transition-colors"><PrevIcon className="w-8 h-8" /></button>
              <button 
                onClick={togglePlayPause} 
                className="w-16 h-16 flex items-center justify-center rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-all transform hover:scale-110"
              >
                {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
              </button>
              <button onClick={handleNextSong} className="text-slate-300 hover:text-white transition-colors"><NextIcon className="w-8 h-8" /></button>
            </div>
            <div className="border-t border-slate-800 mt-auto pt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Up Next</h3>
                <QueueListIcon className="w-5 h-5 text-slate-400"/>
              </div>
              <p className="text-sm text-slate-500">
                {songs.length > 1 && currentSongIndex !== null && songs[(currentSongIndex + 1) % songs.length]
                  ? `${songs[(currentSongIndex + 1) % songs.length].name}`
                  : "Queue is empty."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-600 text-center">
            <MusicNoteIcon className="w-20 h-20"/>
            <p className="mt-4 font-medium">No song selected</p>
            <p className="text-sm">Choose a song from your library to start listening.</p>
          </div>
        )}
      </aside>
    </div>
  );
};

export default App;