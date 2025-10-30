

import React from 'react';
import type { Page } from '../types';
import { NAV_ITEMS } from '../constants';
import { UserIcon } from './icons/Icons';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentPage, setCurrentPage }) => {
  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const navItems = NAV_ITEMS.map(({ name, icon: Icon }) => (
    <li key={name}>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleNavClick(name);
        }}
        className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${
          currentPage === name
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-200 hover:bg-gray-700 hover:text-white'
        }`}
      >
        <Icon className="w-6 h-6 mr-4" />
        <span className="font-medium">{name}</span>
      </a>
    </li>
  ));

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-64 md:w-72 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 flex flex-col`}
      >
        <div className="flex items-center justify-center p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white tracking-wider">VIPAT HMS</h1>
        </div>
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            {navItems}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center p-3 rounded-lg bg-gray-700/50">
            <UserIcon className="w-10 h-10 rounded-full bg-blue-500 p-2"/>
            <div className="ml-3">
              <p className="font-semibold text-white">ผู้ดูแลระบบ</p>
              <p className="text-sm text-gray-400">ผู้จัดการโรงแรม</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
