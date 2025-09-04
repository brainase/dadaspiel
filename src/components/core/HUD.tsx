import React, { useState, useEffect, useRef } from 'react';
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
  
  // States for HUD visibility
  const [isSticky, setIsSticky] = useState(false); // For permanent visibility toggle
  const [isHovering, setIsHovering] = useState(false); // For temporary visibility on hover/tap
  const isHudVisible = isSticky || isHovering;

  // Refs for interaction logic
  const hideTimerRef = useRef<number | null>(null);
  const lastTapRef = useRef(0);

  // --- Event Handlers for Visor Interaction ---

  const handleDesktopClick = () => {
    // This logic is for desktop clicks only. Touch events are handled separately.
    if ('ontouchstart' in window) return;
    setIsSticky(prev => !prev);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent ghost clicks on mobile that would trigger onClick
    if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
    }

    const now = Date.now();
    if (now - lastTapRef.current < 300) { // Double tap
        setIsSticky(prev => !prev);
        setIsHovering(false); // Ensure temporary visibility is off when toggling sticky
    } else { // Single tap
        if (!isSticky) {
            setIsHovering(true);
            hideTimerRef.current = window.setTimeout(() => {
                setIsHovering(false);
            }, 5000); // Hide after 5 seconds
        }
    }
    lastTapRef.current = now;
  };

  const handleMouseEnter = () => {
    if ('ontouchstart' in window) return; // Ignore mouse events on touch devices
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if ('ontouchstart' in window) return; // Ignore mouse events on touch devices
    setIsHovering(false);
  };
  
  // --- Handlers for Control Buttons ---

  const handleToggleMute = () => {
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
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 pt-2 px-4 flex justify-between items-start text-2xl z-50 pointer-events-none">
      
      {/* Left-side HUD elements (Score, Abilities, Controls) */}
      <div 
        className="flex flex-col items-start gap-2 transition-all duration-300"
        style={{
            animation: isHudVisible ? 'hud-glitch-in 0.3s forwards' : 'hud-glitch-out 0.3s forwards',
            opacity: isHudVisible ? 1 : 0,
            transformOrigin: 'top center'
        }}
      >
        {activeProfile && (
            <>
                <div>SCORE: {sessionScore}</div>
                <div className="flex items-center gap-2">
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
                </div>
            </>
        )}
        <div className="flex items-center gap-2">
            <button
                onClick={handleToggleMute}
                className="pixel-button text-2xl !p-2 pointer-events-auto"
                aria-label={isMuted ? "Включить звук" : "Выключить звук"}
                style={{textShadow: 'none'}}
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
      
      {/* Central HUD trigger (Dada-Visor) */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 top-2 w-auto h-auto pointer-events-auto cursor-pointer flex items-center justify-center animate-pulse p-2"
        onClick={handleDesktopClick}
        onTouchStart={handleTouchStart}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Показать/скрыть интерфейс"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Right-side HUD elements (Lives only) */}
      <div className="flex flex-col items-end gap-3">
        {activeProfile && (
            <div className="flex items-center">
                {Array.from({ length: lives }).map((_, i) => (
                    <span key={i} className="text-red-500 text-4xl leading-none ml-2">♥</span>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
