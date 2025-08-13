import React, { useState, useEffect } from 'react';
import { useSession, useSettings, useProfile, useNavigation } from '../../context/GameContext';
import { playSound, SoundType } from '../../utils/AudioEngine';
import { Character, GameScreen } from '../../../types';

export const HUD: React.FC = () => {
  const { 
    lives, sessionScore, character, activateArtistInsight, activateFourthWall,
    abilityUsedInCase, abilityUsedInSession, absurdEdgeUsedInSession, activateAbsurdEdge
  } = useSession();
  const { isMuted, toggleMute } = useSettings();
  const { activeProfile } = useProfile();
  const { screen } = useNavigation();

  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const handleToggleMute = () => {
    // We want the click sound to play even if we are about to mute.
    playSound(SoundType.BUTTON_CLICK);
    toggleMute();
  };

  const handleToggleFullscreen = () => {
    playSound(SoundType.BUTTON_CLICK);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-2xl z-50 pointer-events-none">
      <div>SCORE: {sessionScore}</div>
      <div className="flex items-center gap-4">
        {/* Character Abilities */}
        {character === Character.SEXISM && (
            <button
                onClick={activateArtistInsight}
                disabled={abilityUsedInCase}
                className={`pixel-button text-xl !p-2 pointer-events-auto ${abilityUsedInCase ? 'pixel-button-locked' : 'bg-blue-600'}`}
                aria-label="Активировать Инсайт Художника"
            >
                ИНСАЙТ
            </button>
        )}
        {character === Character.BLACK_PLAYER && (
            <button
                onClick={activateFourthWall}
                disabled={abilityUsedInSession}
                className={`pixel-button text-xl !p-2 pointer-events-auto ${abilityUsedInSession ? 'pixel-button-locked' : 'bg-purple-700'}`}
                aria-label="Активировать Слом Стены"
            >
                СЛОМ
            </button>
        )}
        {character === Character.BLACK_PLAYER && activeProfile?.hasDadaToken && (
            <button
                onClick={activateAbsurdEdge}
                disabled={absurdEdgeUsedInSession || screen !== GameScreen.MINIGAME_INTRO}
                className={`pixel-button text-xl !p-2 pointer-events-auto ${(absurdEdgeUsedInSession || screen !== GameScreen.MINIGAME_INTRO) ? 'pixel-button-locked' : 'bg-pink-600'}`}
                title={screen !== GameScreen.MINIGAME_INTRO ? "Можно использовать только перед началом мини-игры" : "Активировать Грань Абсурда"}
                aria-label="Активировать Грань Абсурда"
            >
                ГРАНЬ
            </button>
        )}

        <div className="flex items-center">
          {Array.from({ length: lives }).map((_, i) => (
            <span key={i} className="text-red-500 text-4xl leading-none ml-2">♥</span>
          ))}
        </div>
         <button
          onClick={handleToggleMute}
          className="pixel-button text-2xl !p-2 pointer-events-auto"
          aria-label={isMuted ? "Включить звук" : "Выключить звук"}
          style={{textShadow: 'none'}} // Emojis look better without text-shadow
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button
          onClick={handleToggleFullscreen}
          className="pixel-button text-2xl !p-2 pointer-events-auto"
          aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Войти в полноэкранный режим"}
          style={{textShadow: 'none'}}
        >
          {isFullscreen ? '↙️' : '↗️'}
        </button>
      </div>
    </div>
  );
};