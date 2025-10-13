
import React from 'react';
import type { Page } from '../types';
import { MenuIcon } from './icons/Icons';

interface HeaderProps {
  toggleSidebar: () => void;
  currentPage: Page;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, currentPage }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-10 md:justify-end">
      <button onClick={toggleSidebar} className="text-gray-600 md:hidden">
        <MenuIcon className="w-6 h-6" />
      </button>
      <h2 className="text-xl font-semibold text-gray-800 md:absolute md:left-1/2 md:-translate-x-1/2">
        {currentPage}
      </h2>
      <div>
        {/* Potentially add user profile/notifications here for larger screens */}
      </div>
    </header>
  );
};

export default Header;
