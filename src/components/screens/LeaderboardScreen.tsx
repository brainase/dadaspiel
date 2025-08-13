import React, { useMemo } from 'react';
import { useProfile, useNavigation, useSettings } from '../../context/GameContext';
import { GameScreen } from '../../../types';
import { SoundType } from '../../utils/AudioEngine';
import { MINI_CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';

export const LeaderboardScreen: React.FC = () => {
    const { profiles } = useProfile();
    const { setScreen } = useNavigation();
    const { playSound } = useSettings();

    const sortedProfiles = useMemo(() => {
        return [...profiles].sort((a, b) => b.highScore - a.highScore);
    }, [profiles]);

    const handleBack = () => {
        playSound(SoundType.BUTTON_CLICK);
        setScreen(GameScreen.PROFILE_SELECTION);
    };
    
    return (
        <div className="flex flex-col items-center h-full p-8">
            <h1 className="text-5xl font-bold mb-8 text-yellow-300">ТАБЛИЦА РЕКОРДОВ</h1>
            <div className="w-full max-w-2xl flex-grow overflow-y-auto pixel-border bg-black/50 p-4">
                <ol className="list-none space-y-3">
                    {sortedProfiles.map((profile, index) => (
                        <li key={profile.id} className="flex items-center justify-between p-3 bg-gray-800/50">
                           <div className="flex items-center gap-4">
                                <span className="text-3xl font-bold w-12 text-right">{index + 1}.</span>
                                <div className="w-[24px] h-[36px] flex-shrink-0">
                                    <PixelArt artData={MINI_CHARACTER_ART_MAP[profile.character]} palette={PIXEL_ART_PALETTE} pixelSize={4} />
                                </div>
                                <span className="text-2xl">{profile.name}</span>
                           </div>
                           <span className="text-3xl font-bold text-yellow-300">{profile.highScore}</span>
                        </li>
                    ))}
                    {sortedProfiles.length === 0 && (
                        <p className="text-center text-gray-400 p-8">Рекордов пока нет. Будьте первым!</p>
                    )}
                </ol>
            </div>
            <div className="mt-8">
                 <button onClick={handleBack} className="pixel-button p-4 text-2xl">
                    Назад
                </button>
            </div>
        </div>
    );
};