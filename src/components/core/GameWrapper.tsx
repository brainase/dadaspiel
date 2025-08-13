
import React, { ReactNode } from 'react';

export const GameWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-4">
      <div className="w-full h-full max-w-[1024px] max-h-[768px] aspect-[4/3] bg-[#1a1a1a] pixel-border flex flex-col relative overflow-hidden">
        {children}
      </div>
    </div>
  );
};
