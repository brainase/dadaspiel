import React from 'react';

interface InstructionModalProps {
  title: string;
  onStart: () => void;
  children: React.ReactNode;
}

export const InstructionModal: React.FC<InstructionModalProps> = ({ title, onStart, children }) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 text-white p-4 animate-[fadeIn_0.3s]">
      <div className="w-full max-w-2xl bg-[#1a1a1a] pixel-border p-6 flex flex-col items-center text-center">
        <h2 className="text-3xl mb-4 text-yellow-300">{title}</h2>
        <div className="text-left w-full max-h-[50vh] overflow-y-auto pr-2 space-y-3 text-lg mb-6">
          {children}
        </div>
        <button onClick={onStart} className="pixel-button p-4 text-2xl mt-2">
          НАЧАТЬ
        </button>
      </div>
    </div>
  );
};
