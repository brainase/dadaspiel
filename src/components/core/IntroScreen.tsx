import React from 'react';
import { useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';

export const IntroScreen: React.FC<{ title: string, text: string, onContinue: () => void, warning?: string }> = ({ title, text, onContinue, warning }) => {
    const { playSound } = useSettings();
    
    const handleContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onContinue();
    };
    
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black bg-opacity-80">
            {warning && (
                <div className="mb-4 p-2 bg-red-800 pixel-border animate-pulse">
                    <h3 className="text-2xl text-yellow-300">{warning}</h3>
                </div>
            )}
            <h2 className="text-4xl mb-4">{title}</h2>
            <p className="text-xl mb-8 max-w-prose">{text}</p>
            <button onClick={handleContinue} className="pixel-button p-4 text-2xl">
                ДаДа
            </button>
        </div>
    );
};
