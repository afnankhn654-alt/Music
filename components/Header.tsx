import React from 'react';
import SearchBar from './SearchBar';

interface HeaderProps {
    onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  return (
    <header className="flex justify-between items-center">
      <h1 className="text-3xl font-extrabold tracking-tight text-white hidden md:block">
        Listen Now
      </h1>
      <div className="w-full md:w-auto">
        <SearchBar onSearch={onSearch} />
      </div>
    </header>
  );
};

export default Header;
