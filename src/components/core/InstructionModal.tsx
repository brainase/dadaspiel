
import React from 'react';
import { useSettings } from '../../context/GameContext';
import { SeasonalEvent } from '../../../types';

interface InstructionModalProps {
  title: string;
  onStart: () => void;
  children: React.ReactNode;
}

export const InstructionModal: React.FC<InstructionModalProps> = ({ title, onStart, children }) => {
  const { seasonalEvent, seasonalAnimationsEnabled } = useSettings();

  let borderColor = "pixel-border";
  let titleColor = "text-yellow-300";
  let bgOverlay = "bg-black/80";

  if (seasonalAnimationsEnabled) {
      switch (seasonalEvent) {
          case SeasonalEvent.NEW_YEAR:
              borderColor = "border-4 border-green-500 box-shadow-green";
              titleColor = "text-red-500";
              break;
          case SeasonalEvent.HALLOWEEN:
              borderColor = "border-4 border-orange-600";
              titleColor = "text-orange-500";
              break;
          case SeasonalEvent.DADA_BIRTHDAY:
              borderColor = "border-4 border-pink-400";
              titleColor = "text-pink-300";
              break;
          case SeasonalEvent.GONDOLIER_DAY:
              borderColor = "border-4 border-blue-400";
              titleColor = "text-cyan-300";
              break;
          case SeasonalEvent.SEPTEMBER_3:
              borderColor = "border-4 border-orange-800";
              titleColor = "text-amber-500";
              break;
          case SeasonalEvent.APRIL_FOOLS:
              borderColor = "border-4 border-gray-500";
              titleColor = "text-gray-400 font-sans";
              break;
          case SeasonalEvent.GLITCH_DAY:
              borderColor = "border-4 border-green-400";
              titleColor = "text-green-400 font-mono";
              bgOverlay = "bg-black/95";
              break;
          case SeasonalEvent.POTATO_SALVATION:
              borderColor = "border-4 border-yellow-800";
              titleColor = "text-yellow-600";
              break;
      }
  }

  return (
    <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center ${bgOverlay} text-white p-4 animate-[fadeIn_0.3s]`}>
      <div className={`w-full max-w-2xl bg-[#1a1a1a] ${borderColor} p-6 flex flex-col items-center text-center relative overflow-hidden`}>
        {/* Gondolier Stripes Background */}
        {seasonalAnimationsEnabled && seasonalEvent === SeasonalEvent.GONDOLIER_DAY && (
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #0000ff 10px, #0000ff 20px)'}}></div>
        )}
        
        <h2 className={`text-3xl mb-4 ${titleColor} relative z-10`}>{title}</h2>
        <div className="text-left w-full max-h-[50vh] overflow-y-auto pr-2 space-y-3 text-lg mb-6 relative z-10">
          {children}
        </div>
        <button onClick={onStart} className="pixel-button p-4 text-2xl mt-2 relative z-10">
          ДАДА
        </button>
      </div>
    </div>
  );
};
