import React from 'react';
import { useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';

export const OutroScreen: React.FC<{ title: string, text: string, onContinue: () => void }> = ({ title, text, onContinue }) => {
    const { playSound } = useSettings();

    const handleContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onContinue();
    };
    
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black bg-opacity-80">
            <h2 className="text-4xl mb-4">{title}</h2>
            <p className="text-xl mb-8 max-w-prose">{text}</p>
            <button onClick={handleContinue} className="pixel-button p-4 text-2xl">
                ПРОдадаЖИТЬ
            </button>
        </div>
    );
};
