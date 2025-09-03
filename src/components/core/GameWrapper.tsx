
import React, { ReactNode, useEffect, useRef } from 'react';
import { useSession } from '../../context/GameContext';
import { OrientationLock } from './OrientationLock';

export const GameWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentCase } = useSession();
  const isGameScreen = !!currentCase;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const root = document.documentElement;
    let animationFrameId: number | null = null;

    const observer = new ResizeObserver(entries => {
      // Use requestAnimationFrame to avoid ResizeObserver loop errors
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = window.requestAnimationFrame(() => {
        for (const entry of entries) {
          const containerWidth = entry.contentRect.width;
          // This formula scales the root font-size based on the container width.
          // It's clamped to ensure readability on very small or very large screens.
          // 1.5% of width provides a good balance for mobile and desktop.
          const newFontSize = Math.max(8, Math.min(16, containerWidth * 0.015)); 
          root.style.fontSize = `${newFontSize}px`;
        }
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      // Reset the font-size when the component unmounts to not affect other parts
      // of a larger application.
      root.style.fontSize = ''; 
    };
  }, []); // Empty dependency array ensures this runs only once on mount.


  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-0 sm:p-4">
      <div 
        ref={containerRef}
        id="game-container"
        className={`w-full h-full bg-[#1a1a1a] pixel-border flex flex-col relative overflow-hidden transition-all duration-300 ${isGameScreen ? 'aspect-[4/3] max-w-[1024px] max-h-[768px]' : 'sm:max-w-[1024px] sm:max-h-[768px]'}`}
      >
        <div id="game-content-container" className="w-full h-full">
            {children}
        </div>
        {isGameScreen && <OrientationLock />}
      </div>
    </div>
  );
};
