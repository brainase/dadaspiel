
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, useProfile, useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { PixelArt } from '../core/PixelArt';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { DOOR_ART_MAP, BISON_SILHOUETTE, TRACTOR_SILHOUETTE, LIBRARY_SILHOUETTE, STORK_SILHOUETTE, STOP_SIGN_ART } from '../../miscArt';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';

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
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
            <div className="bg-black/70 p-4 border-l-4 border-yellow-400 text-white pointer-events-auto max-w-md">
                <h1 className="text-xl font-bold text-yellow-300">ПРОСПЕКТ ДАДАИЗМА</h1>
                <p className="text-xs mt-1 text-gray-300">Путь: {activeProfile?.name}</p>
            </div>
        </div>

        {/* Mobile Controls */}
        <div className="absolute bottom-8 left-0 w-full flex justify-between px-8 md:hidden pointer-events-auto z-50">
            <div className="flex gap-6">
                <button 
                    className="w-20 h-20 bg-white/10 border-2 border-white/50 rounded-full flex items-center justify-center text-4xl active:bg-white/30 backdrop-blur-sm"
                    onTouchStart={(e) => { e.preventDefault(); keysPressed.current['ArrowLeft'] = true; }}
                    onTouchEnd={(e) => { e.preventDefault(); keysPressed.current['ArrowLeft'] = false; }}
                >←</button>
                <button 
                    className="w-20 h-20 bg-white/10 border-2 border-white/50 rounded-full flex items-center justify-center text-4xl active:bg-white/30 backdrop-blur-sm"
                    onTouchStart={(e) => { e.preventDefault(); keysPressed.current['ArrowRight'] = true; }}
                    onTouchEnd={(e) => { e.preventDefault(); keysPressed.current['ArrowRight'] = false; }}
                >→</button>
            </div>
            <div className="flex gap-6">
                 <button 
                    className="w-20 h-20 bg-blue-500/30 border-2 border-blue-300/50 rounded-full flex items-center justify-center text-2xl font-bold active:bg-blue-500/50 backdrop-blur-sm"
                    onTouchStart={(e) => { e.preventDefault(); handleJump(); }}
                >
                    JUMP
                </button>
                {activeDoorId !== null && (
                    <button 
                        className="w-24 h-24 bg-yellow-500 border-4 border-black rounded-full flex items-center justify-center text-xl font-bold animate-pulse text-black shadow-lg"
                        onTouchEnd={(e) => { e.preventDefault(); handleInteract(); }}
                        onClick={handleInteract}
                    >
                        ВХОД
                    </button>
                )}
            </div>
        </div>
        
        <div className="absolute bottom-4 w-full text-center text-white/30 text-sm hidden md:block pointer-events-none">
            [←][→] Move &nbsp;&nbsp; [SPACE/UP] Jump &nbsp;&nbsp; [ENTER] Enter
        </div>

    </div>
  );
};
