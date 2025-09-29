import React from 'react';
import Navigation from './Navigation';
import MusicPlayer from '../MusicPlayer';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <Navigation />
      <main className="main-content">
        {children}
      </main>
      <MusicPlayer />
    </div>
  );
};

export default Layout;