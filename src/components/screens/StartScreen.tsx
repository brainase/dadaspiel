import React, { useState, useMemo } from 'react';
import { useProfile, useNavigation, useSettings } from '../../context/GameContext';
import { CHARACTERS } from '../../data/characterData';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { Title } from '../core/Title';
import { Character, GameScreen } from '../../../types';
import { SoundType } from '../../utils/AudioEngine';

export const StartScreen: React.FC = () => {
  const { createProfile, profiles } = useProfile();
  const { setScreen } = useNavigation();
  const { playSound } = useSettings();
  
  const [playerName, setPlayerName] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const completedChars = useMemo(() => new Set(profiles.filter(p => p.gameCompleted).map(p => p.character)), [profiles]);
  const isBlackPlayerUnlocked = completedChars.has(Character.KANILA) || completedChars.has(Character.SEXISM);

  const handlePrev = () => {
    playSound(SoundType.GENERIC_CLICK);
    setSelectedIndex(prev => (prev === 0 ? CHARACTERS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    playSound(SoundType.GENERIC_CLICK);
    setSelectedIndex(prev => (prev === CHARACTERS.length - 1 ? 0 : prev + 1));
  };
  
  const currentCharData = CHARACTERS[selectedIndex];
  const isLocked = currentCharData.name === Character.BLACK_PLAYER && !isBlackPlayerUnlocked;
  const artData = CHARACTER_ART_MAP[currentCharData.name];

  const handleStartGame = () => {
    if (playerName.trim() && !isLocked) {
        playSound(SoundType.BUTTON_CLICK);
        createProfile(playerName.trim(), currentCharData.name);
    }
  };

  const handleBack = () => {
      playSound(SoundType.BUTTON_CLICK);
      setScreen(GameScreen.PROFILE_SELECTION);
  };
  
  return (
    <div className="flex flex-col items-center justify-between h-full p-4">
        <div className="text-center w-full">
            <Title onTitleClick={() => {}}/>
            <p className="mb-4 text-xl">СОЗДАНИЕ НОВОГО ДАДАИСТА</p>
            <input 
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Введите имя..."
              maxLength={16}
              className="bg-gray-800 text-white p-2 text-center pixel-border w-64 text-lg"
            />
        </div>

        <div className="flex flex-row w-full flex-grow items-stretch justify-center gap-8 mt-4">
            {/* Left Panel: Character Selector */}
            <div className="w-1/2 flex items-center justify-center gap-4">
                <button onClick={handlePrev} className="pixel-button text-4xl p-4 self-center">{'<'}</button>
                
                <div key={selectedIndex} className="text-center char-art-container flex flex-col items-center justify-center">
                  <div className={`w-[160px] h-[256px] flex items-center justify-center ${isLocked ? 'opacity-50 filter grayscale' : ''}`}>
                      {artData && <PixelArt artData={artData} palette={PIXEL_ART_PALETTE} pixelSize={8} />}
                  </div>
                  <h3 className="text-2xl mt-4">{currentCharData.name}</h3>
                </div>

                <button onClick={handleNext} className="pixel-button text-4xl p-4 self-center">{'>'}</button>
            </div>

            {/* Right Panel: Details */}
            <div className="w-1/2 h-[90%] flex flex-col justify-between p-6 bg-black/30 pixel-border">
                <div key={selectedIndex} className="details-panel flex-grow overflow-y-auto pr-2">
                    {isLocked ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <p className="text-3xl text-red-500">ЗАБЛОКИРОВАНО</p>
                            <p className="mt-4 text-lg text-gray-300">Пройдите игру за Канилу или Сексизма, чтобы разблокировать Чёрного Игрока.</p>
                        </div>
                    ) : (
                        <>
                          <h4 className="text-2xl text-yellow-300 mb-4">{currentCharData.description}</h4>
                          <ul className="space-y-3 text-lg list-disc list-inside">
                            {currentCharData.abilities.map((ability, i) => <li key={i}>{ability}</li>)}
                          </ul>
                          {currentCharData.name === Character.BLACK_PLAYER && <p className="mt-4 text-yellow-400">Бонус: пройдите игру за обоих других, чтобы получить Дада-Фишку!</p>}
                        </>
                    )}
                </div>
                <div className="flex gap-4 mt-8 justify-end pt-4 border-t-2 border-dashed border-gray-600">
                    <button onClick={handleBack} className="pixel-button p-4 text-2xl bg-gray-600">
                        НАЗАД
                    </button>
                    <button 
                      onClick={handleStartGame} 
                      disabled={!playerName.trim() || isLocked}
                      className={`pixel-button p-4 text-2xl ${(!playerName.trim() || isLocked) ? 'pixel-button-locked' : 'bg-green-700'}`}
                    >
                        НАЧАТЬ
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};