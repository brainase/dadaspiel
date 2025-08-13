import React from 'react';
import { useNavigation, useSettings } from '../../context/GameContext';
import { GameScreen } from '../../../types';
import { SoundType } from '../../utils/AudioEngine';

export const LogView: React.FC = () => {
    const { setScreen } = useNavigation();
    const { log, playSound } = useSettings();
    const logText = log.map(l => `[${l.timestamp}] ${l.message}`).join('\n');
    
    const handleBack = () => {
        playSound(SoundType.BUTTON_CLICK);
        setScreen(GameScreen.DEBUG_MENU);
    }

    return (
        <div className="flex flex-col h-full p-4">
            <h2 className="text-2xl mb-4">ЛОГ СОБЫТИЙ</h2>
            <textarea
                readOnly
                value={logText}
                className="w-full h-full bg-black text-white font-mono text-sm p-2 border-2 border-white flex-grow"
            />
            <div className="flex justify-center mt-4">
                 <button onClick={handleBack} className="pixel-button p-2 text-lg">
                    Назад
                </button>
            </div>
        </div>
    );
};
