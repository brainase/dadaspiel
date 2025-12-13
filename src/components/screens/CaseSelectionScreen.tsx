
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, useProfile, useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { PixelArt } from '../core/PixelArt';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { DOOR_ART_MAP, BISON_SILHOUETTE, TRACTOR_SILHOUETTE, LIBRARY_SILHOUETTE, STORK_SILHOUETTE, STOP_SIGN_ART } from '../../miscArt';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

// --- Constants & Config ---
const GRAVITY = 0.0015;
const JUMP_FORCE = 0.9;
const MOVE_SPEED = 0.4;
const MAX_FALL_SPEED = 0.8;

// Level Definition
interface Platform {
    x: number;
    y: number; // Top position from bottom of world
    w: number;
    h: number;
}

interface DoorLoc {
    id: number;
    x: number;
    y: number;
}

// World Settings
const WORLD_HEIGHT = 800;
const GROUND_LEVEL = 100;

// Custom Palette additions for doors and signs
const EXTENDED_PALETTE = {
    ...PIXEL_ART_PALETTE,
    Y: '#ffd700', // Gold
    R: '#8b0000', // Dark Red
    M: '#4a044e', // Purple/Void
    S: '#777777', // Silver/Pole
};

export const CaseSelectionScreen: React.FC = () => {
  const { startCase, character } = useSession();
  const { activeProfile, dynamicCases: CASES } = useProfile();
  const { playSound } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // --- State ---
  const [player, setPlayer] = useState({ x: 100, y: GROUND_LEVEL, vx: 0, vy: 0, grounded: true, facingRight: true });
  const [activeDoorId, setActiveDoorId] = useState<number | null>(null);
  
  // Refs for tracking state inside loops/listeners
  const activeDoorIdRef = useRef<number | null>(null);
  const playerRef = useRef(player);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Sync refs
  useEffect(() => { activeDoorIdRef.current = activeDoorId; }, [activeDoorId]);
  useEffect(() => { playerRef.current = player; }, [player]);

  // --- Level Design ---
  const platforms: Platform[] = [
      { x: 500, y: 180, w: 150, h: 20 },
      { x: 900, y: 250, w: 120, h: 20 },
      { x: 1300, y: 150, w: 100, h: 20 },
      { x: 1600, y: 300, w: 100, h: 20 },
      { x: 2000, y: 100, w: 300, h: 40 },
  ];

  const doorLocations: DoorLoc[] = [
      { id: 1, x: 300, y: GROUND_LEVEL },
      { id: 2, x: 575, y: 180 },
      { id: 3, x: 960, y: 250 },
      { id: 4, x: 1350, y: 150 },
      { id: 5, x: 1650, y: 300 },
      { id: 6, x: 2150, y: 140 },
  ];

  const worldWidth = 2500;

  // --- Helpers ---
  const isCaseComplete = (caseId: number) => {
    if (!activeProfile) return false;
    const caseData = CASES.find(c => c.id === caseId);
    if (!caseData) return false;
    return (activeProfile.progress[caseId] || 0) >= caseData.minigames.length;
  };

  const isUnlocked = (caseId: number) => {
    if (!activeProfile) return false;
    // Original Logic: First 3 cases are open.
    if (caseId <= 3) return true;
    
    // Case 4 requires 1, 2, and 3 complete
    if (caseId === 4) return isCaseComplete(1) && isCaseComplete(2) && isCaseComplete(3);
    
    // Others require previous
    return isCaseComplete(caseId - 1);
  };

  // Helper to remove "Дело №X: " prefix
  const cleanTitle = (title: string) => {
      return title.replace(/^Дело №\d+:\s*/, '');
  };

  // Boundary
  const firstLockedDoor = doorLocations.find(d => !isUnlocked(d.id));
  const lockedDoorX = firstLockedDoor ? firstLockedDoor.x : worldWidth;
  const signX = lockedDoorX - 90; // Sign stands left of the door
  const maxPlayerX = signX - 30; // Player stops before sign

  const landmarks = [
      { id: 1, x: 150, y: 120, art: BISON_SILHOUETTE, scale: 6, opacity: 0.3 },
      { id: 2, x: 700, y: 100, art: LIBRARY_SILHOUETTE, scale: 8, opacity: 0.2 },
      { id: 3, x: 1200, y: 200, art: STORK_SILHOUETTE, scale: 5, opacity: 0.4 },
      { id: 4, x: 1800, y: 120, art: TRACTOR_SILHOUETTE, scale: 7, opacity: 0.3 },
  ];

  // --- Actions ---
  const handleInteract = useCallback(() => {
      if (activeDoorIdRef.current !== null) {
          playSound(SoundType.BUTTON_CLICK);
          startCase(activeDoorIdRef.current);
      }
  }, [playSound, startCase]);

  const handleJump = useCallback(() => {
      setPlayer(p => {
          if (p.grounded) {
              playSound(SoundType.SWOOSH);
              return { ...p, vy: JUMP_FORCE, grounded: false };
          }
          return p;
      });
  }, [playSound]);

  // --- Input Handlers ---
  useEffect(() => {
      const handleKD = (e: KeyboardEvent) => {
          keysPressed.current[e.code] = true;
          
          if ((e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW')) {
             handleJump();
          }
          
          if (e.code === 'Enter') {
              handleInteract();
          }
      };
      const handleKU = (e: KeyboardEvent) => keysPressed.current[e.code] = false;
      
      window.addEventListener('keydown', handleKD);
      window.addEventListener('keyup', handleKU);
      return () => {
          window.removeEventListener('keydown', handleKD);
          window.removeEventListener('keyup', handleKU);
      };
  }, [handleInteract, handleJump]);

  // Mobile Touch Handlers
  const handleTouchStart = (key: string, e: React.TouchEvent) => {
      // Prevent default to stop scrolling/selection behaviors
      if (e.cancelable) e.preventDefault(); 
      keysPressed.current[key] = true;
      if (key === 'ArrowUp') handleJump();
  };

  const handleTouchEnd = (key: string, e: React.TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      keysPressed.current[key] = false;
  };

  // --- Physics Loop ---
  useGameLoop(useCallback((deltaTime) => {
      const left = keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA'];
      const right = keysPressed.current['ArrowRight'] || keysPressed.current['KeyD'];
      
      let dx = 0;
      if (left) dx = -1;
      if (right) dx = 1;

      setPlayer(p => {
          let newX = p.x + dx * MOVE_SPEED * deltaTime;
          
          // Apply Gravity
          let newVy = p.vy - GRAVITY * deltaTime; 
          let newY = p.y + newVy * deltaTime;
          let newGrounded = false;

          // Boundaries
          newX = Math.max(50, Math.min(newX, maxPlayerX)); 

          // Ground Collision
          if (newY <= GROUND_LEVEL) {
              newY = GROUND_LEVEL;
              newVy = 0;
              newGrounded = true;
          }

          // Platform Collisions (One-way / Top)
          if (newVy <= 0) {
              for (const plat of platforms) {
                  if (newX >= plat.x - 20 && newX <= plat.x + plat.w + 20) {
                      if (p.y >= plat.y && newY <= plat.y) {
                          newY = plat.y;
                          newVy = 0;
                          newGrounded = true;
                      }
                  }
              }
          }

          if (newVy < -MAX_FALL_SPEED) newVy = -MAX_FALL_SPEED;

          return {
              x: newX,
              y: newY,
              vx: dx,
              vy: newVy,
              grounded: newGrounded,
              facingRight: dx !== 0 ? dx > 0 : p.facingRight
          };
      });

      // Door Proximity
      let foundDoor = null;
      for (const door of doorLocations) {
          const p = playerRef.current;
          const dist = Math.sqrt(Math.pow(p.x - door.x, 2) + Math.pow(p.y - door.y, 2));
          if (dist < 80) {
              if (isUnlocked(door.id)) {
                  foundDoor = door.id;
              }
          }
      }
      setActiveDoorId(foundDoor);

  }, [maxPlayerX, platforms, doorLocations]), true);

  // --- Rendering ---
  const charArt = CHARACTER_ART_MAP[character || Character.KANILA];
  
  const screenWidth = containerRef.current ? containerRef.current.clientWidth : 800;
  const cameraX = Math.max(0, Math.min(worldWidth - screenWidth, player.x - screenWidth / 2));

  // Dynamic Background
  const progressPct = Math.min(1, player.x / 2200);
  const bgR = Math.floor(30 + progressPct * 40);
  const bgG = Math.floor(20 - progressPct * 20);
  const bgB = Math.floor(40 - progressPct * 30);
  const bgStyle = { backgroundColor: `rgb(${bgR}%, ${bgG}%, ${bgB}%)` };

  return (
    <div className="w-full h-full relative overflow-hidden font-mono transition-colors duration-1000" style={bgStyle} ref={containerRef}>
        
        <div className="absolute inset-0 opacity-20" style={{background: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '50px 50px'}}></div>

        <div 
            className="absolute top-0 left-0 h-full transition-transform duration-75 ease-linear will-change-transform"
            style={{ 
                width: `${worldWidth}px`,
                transform: `translateX(${-cameraX}px)` 
            }}
        >
            {/* Parallax Landmarks */}
            {landmarks.map(lm => (
                <div 
                    key={lm.id} 
                    className="absolute pointer-events-none"
                    style={{ 
                        left: `${lm.x}px`, 
                        bottom: `${lm.y}px`,
                        opacity: lm.opacity,
                        transform: `scale(${lm.scale}) translateX(${(cameraX * 0.3) / lm.scale}px)` 
                    }}
                >
                    <PixelArt artData={lm.art} palette={{'b': '#000000'}} pixelSize={1} />
                </div>
            ))}

            {/* Platforms */}
            {platforms.map((plat, i) => (
                <div 
                    key={`plat-${i}`}
                    className="absolute bg-stone-800 border-t-4 border-black"
                    style={{
                        left: plat.x,
                        bottom: plat.y - plat.h,
                        width: plat.w,
                        height: plat.h
                    }}
                >
                    <div className="w-full h-full opacity-30" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)'}}></div>
                </div>
            ))}

            {/* Ground */}
            <div className="absolute left-0 w-full bg-[#2d2d2d] border-t-4 border-black" style={{ height: GROUND_LEVEL, bottom: 0 }}>
                 <div className="w-full h-4 border-b-2 border-dashed border-gray-600 mt-2"></div>
            </div>

            {/* Locked Sign ("No Entry" prop) - Text Removed */}
            <div className="absolute" style={{ left: signX, bottom: GROUND_LEVEL }}>
                <PixelArt artData={STOP_SIGN_ART} palette={EXTENDED_PALETTE} pixelSize={6} />
            </div>

            {/* Doors */}
            {CASES.map((c) => {
                const doorLoc = doorLocations.find(d => d.id === c.id) || { x: 0, y: 0 };
                const unlocked = isUnlocked(c.id);
                const completed = isCaseComplete(c.id);
                const DoorArtData = DOOR_ART_MAP[c.id as keyof typeof DOOR_ART_MAP];
                const isActive = activeDoorId === c.id;
                
                // Determine current progress 
                const progress = activeProfile?.progress[c.id] || 0;
                const total = c.minigames.length;
                const showCheck = completed;
                
                return (
                    <div 
                        key={c.id} 
                        className="absolute flex flex-col items-center z-10"
                        style={{ left: doorLoc.x, bottom: doorLoc.y, transform: 'translateX(-50%)' }}
                        onClick={(e) => { 
                            if(isActive && unlocked) {
                                e.stopPropagation(); 
                                handleInteract(); 
                            }
                        }}
                    >   
                        {/* Title Above Door - Acts as Button */}
                        <div 
                            className={`mb-4 px-3 py-1 text-center bg-black/80 border-2 rounded text-white whitespace-nowrap cursor-pointer transition-all duration-200
                                ${isActive && unlocked ? 'border-yellow-400 text-yellow-300 animate-bounce scale-110' : 'border-gray-600 text-gray-400'}
                            `}
                            style={{ 
                                opacity: unlocked ? 1 : 0.5,
                                fontSize: '10px'
                            }}
                        >
                            {cleanTitle(c.title)}
                        </div>

                        {/* Door Art */}
                        <div className={`relative transition-all duration-300 ${isActive ? 'scale-105' : 'scale-100'} ${!unlocked ? 'opacity-50 grayscale' : ''}`}>
                            <PixelArt artData={DoorArtData} palette={EXTENDED_PALETTE} pixelSize={6} />
                            
                            {/* Status Overlay */}
                            {showCheck && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <span className="text-4xl filter drop-shadow-md">✅</span>
                                </div>
                            )}
                            {!showCheck && unlocked && progress > 0 && (
                                <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-[8px] px-1 font-bold border border-white">
                                    {progress}/{total}
                                </div>
                            )}
                            {!unlocked && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl">🔒</div>}
                        </div>
                    </div>
                );
            })}

            {/* Player Character */}
            <div 
                className="absolute z-20 transition-transform duration-75"
                style={{ 
                    left: player.x, 
                    // Компенсация пустых пикселей внизу спрайта (примерно 20px), чтобы ноги касались земли
                    bottom: player.y - 20, 
                    transform: `translateX(-50%) scaleX(${player.facingRight ? 1 : -1})`
                }}
            >
                {charArt && <PixelArt artData={charArt} palette={PIXEL_ART_PALETTE} pixelSize={4} />}
            </div>

        </div>

        {/* HUD Overlay */}
        <div className="absolute top-10 left-0 w-full p-4 flex justify-center items-start pointer-events-none">
            <div className="bg-purple-900/80 p-2 border-2 border-cyan-400 text-white pointer-events-auto max-w-md text-center">
                <h1 className="text-xl font-bold text-yellow-300">БИОСУЩЕСТВО</h1>
                <p className="text-s mt-1 text-gray-300">{activeProfile?.name}</p>
            </div>
        </div>

        {/* Mobile Controls Overlay */}
        {isMobile && (
            <div 
                className="absolute bottom-4 left-0 w-full flex justify-between px-6 pointer-events-none z-50 select-none touch-none"
            >
                {/* Directional Pad + Jump Cluster (Left) */}
                <div className="relative w-48 h-32 pointer-events-auto opacity-70">
                    <div className="absolute bottom-0 left-0 flex gap-4 items-end">
                        {/* Left Arrow */}
                        <button 
                            className="w-20 h-20 bg-white/10 border-2 border-white/50 rounded-lg flex items-center justify-center active:bg-white/30 backdrop-blur-sm shadow-lg"
                            onTouchStart={(e) => handleTouchStart('ArrowLeft', e)}
                            onTouchEnd={(e) => handleTouchEnd('ArrowLeft', e)}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                        </button>

                        {/* Jump Button (Up Arrow) - Positioned slightly higher/between */}
                        <button 
                            className="w-20 h-20 bg-blue-500/30 border-2 border-blue-300/50 rounded-lg flex items-center justify-center active:bg-blue-500/50 backdrop-blur-sm shadow-lg"
                            onTouchStart={(e) => handleTouchStart('ArrowUp', e)} // Jump handler inside touchStart
                            onTouchEnd={(e) => handleTouchEnd('ArrowUp', e)}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                             <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>
                        </button>

                        {/* Right Arrow */}
                        <button 
                            className="w-20 h-20 bg-white/10 border-2 border-white/50 rounded-lg flex items-center justify-center active:bg-white/30 backdrop-blur-sm shadow-lg"
                            onTouchStart={(e) => handleTouchStart('ArrowRight', e)}
                            onTouchEnd={(e) => handleTouchEnd('ArrowRight', e)}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                        </button>
                    </div>
                </div>

                {/* Interact Button (Right) - DaDa Graphic */}
                <div className="flex items-end pointer-events-auto">
                    {activeDoorId !== null && (
                        <button 
                            className="w-24 h-24 bg-yellow-500 border-4 border-black rounded-full flex items-center justify-center animate-pulse shadow-lg active:scale-95 transition-transform"
                            onTouchStart={(e) => { 
                                if (e.cancelable) e.preventDefault();
                                handleInteract(); 
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                handleInteract();
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {/* Graphic "DaDa" to prevent text selection */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 9.470000267028809 121.22000122070312 44.13999938964844" data-asc="0.9052734375" width="121.22000122070312" height="44.13999938964844"><defs/><g fill="#000000"><g transform="translate(0, 0)"><path d="M7.10 9.47L28.88 9.47L28.88 41.04L32.10 41.04L32.10 53.61L27.88 53.61L27.88 45.26L4.22 45.26L4.22 53.61L0 53.61L0 41.04L2.78 41.04Q7.10 34.52 7.10 14.70L7.10 9.47M24.15 13.70L11.67 13.70L11.67 15.53Q11.67 20.09 10.85 28.02Q10.03 35.94 7.64 41.04L24.15 41.04L24.15 13.70ZM54.08 42.07Q51.64 44.14 49.38 45.00Q47.12 45.85 44.53 45.85Q40.26 45.85 37.96 43.76Q35.67 41.67 35.67 38.43Q35.67 36.52 36.54 34.95Q37.40 33.37 38.81 32.42Q40.21 31.47 41.97 30.98Q43.26 30.64 45.87 30.32Q51.20 29.69 53.71 28.81Q53.74 27.91 53.74 27.66Q53.74 24.98 52.49 23.88Q50.81 22.39 47.49 22.39Q44.38 22.39 42.91 23.47Q41.43 24.56 40.72 27.32L36.43 26.73Q37.01 23.97 38.35 22.28Q39.70 20.58 42.24 19.67Q44.78 18.75 48.12 18.75Q51.44 18.75 53.52 19.53Q55.59 20.31 56.57 21.50Q57.54 22.68 57.93 24.49Q58.15 25.61 58.15 28.54L58.15 34.40Q58.15 40.53 58.44 42.15Q58.72 43.77 59.55 45.26L54.96 45.26Q54.27 43.90 54.08 42.07M53.71 32.25Q51.32 33.23 46.53 33.91Q43.82 34.30 42.70 34.79Q41.58 35.28 40.97 36.22Q40.36 37.16 40.36 38.31Q40.36 40.06 41.69 41.24Q43.02 42.41 45.58 42.41Q48.12 42.41 50.10 41.30Q52.08 40.19 53.00 38.26Q53.71 36.77 53.71 33.86L53.71 32.25ZM68.77 9.47L90.55 9.47L90.55 41.04L93.77 41.04L93.77 53.61L89.55 53.61L89.55 45.26L65.89 45.26L65.89 53.61L61.67 53.61L61.67 41.04L64.45 41.04Q68.77 34.52 68.77 14.70L68.77 9.47M85.82 13.70L73.34 13.70L73.34 15.53Q73.34 20.09 72.52 28.02Q71.70 35.94 69.31 41.04L85.82 41.04L85.82 13.70ZM115.75 42.07Q113.31 44.14 111.05 45.00Q108.79 45.85 106.20 45.85Q101.93 45.85 99.63 43.76Q97.34 41.67 97.34 38.43Q97.34 36.52 98.21 34.95Q99.07 33.37 100.48 32.42Q101.88 31.47 103.64 30.98Q104.93 30.64 107.54 30.32Q112.87 29.69 115.38 28.81Q115.41 27.91 115.41 27.66Q115.41 24.98 114.16 23.88Q112.48 22.39 109.16 22.39Q106.05 22.39 104.58 23.47Q103.10 24.56 102.39 27.32L98.10 26.73Q98.68 23.97 100.02 22.28Q101.37 20.58 103.91 19.67Q106.45 18.75 109.79 18.75Q113.11 18.75 115.19 19.53Q117.26 20.31 118.24 21.50Q119.21 22.68 119.60 24.49Q119.82 25.61 119.82 28.54L119.82 34.40Q119.82 40.53 120.10 42.15Q120.39 43.77 121.22 45.26L116.63 45.26Q115.94 43.90 115.75 42.07M115.38 32.25Q112.99 33.23 108.20 33.91Q105.49 34.30 104.37 34.79Q103.25 35.28 102.64 36.22Q102.03 37.16 102.03 38.31Q102.03 40.06 103.36 41.24Q104.69 42.41 107.25 42.41Q109.79 42.41 111.77 41.30Q113.75 40.19 114.67 38.26Q115.38 36.77 115.38 33.86L115.38 32.25Z"/></g></g></svg>
                        </button>
                    )}
                </div>
            </div>
        )}
        
        {/* Desktop Hint - Rendered ONLY if !isMobile */}
        {!isMobile && (
            <div className="absolute bottom-4 w-full text-center text-white/30 text-sm pointer-events-none">
                [←][→] Move &nbsp;&nbsp; [SPACE/UP] Jump &nbsp;&nbsp; [ENTER] Enter
            </div>
        )}

    </div>
  );
};
