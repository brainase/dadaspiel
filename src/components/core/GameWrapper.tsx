
import React, { ReactNode } from 'react';
import { useSession } from '../../context/GameContext';
import { OrientationLock } from './OrientationLock';

export const GameWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentCase } = useSession();
  const isGameScreen = !!currentCase;

  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-0 sm:p-4">
      <div 
        id="game-container"
        className={`w-full h-full bg-[#1a1a1a] pixel-border flex flex-col relative overflow-hidden transition-all duration-300 ${isGameScreen ? 'aspect-[4/3] max-w-[1024px] max-h-[768px]' : 'sm:max-w-[1024px] sm:max-h-[768px]'}`}
        style={{ containerType: 'inline-size' }}
      >
        <div id="game-content-container" className="w-full h-full">
            {children}
        </div>
        {isGameScreen && <OrientationLock />}
      </div>
    </div>
  );
};
