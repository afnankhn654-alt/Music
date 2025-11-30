import React, { useRef } from 'react';
import { UploadIcon } from './icons';

interface MusicUploaderProps {
  onSongsUpload: (files: FileList) => void;
}

const MusicUploader: React.FC<MusicUploaderProps> = ({ onSongsUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onSongsUpload(event.target.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6">
      <input
        type="file"
        multiple
        accept="audio/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75"
      >
        <UploadIcon className="w-5 h-5 mr-3" />
        Upload Music
      </button>
    </div>
  );
};

export default MusicUploader;