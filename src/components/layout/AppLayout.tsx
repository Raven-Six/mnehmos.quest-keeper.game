import React from 'react';
import { NavBar } from './NavBar';
import { MainViewport } from './MainViewport';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-terminal-black relative selection:bg-terminal-green selection:text-terminal-black">
      <div className="scanline pointer-events-none z-50" />

      {/* Sidebar Navigation */}
      <NavBar />

      {/* Main Content Viewport */}
      <MainViewport className="flex-1 h-full min-w-0" />
    </div>
  );
};