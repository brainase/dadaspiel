
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { SoundType, updateMusicParameter } from '../../utils/AudioEngine';

// Компонент пиксельного пылесоса
const PixelVacuum: React.FC<{animationToggle: boolean}> = ({ animationToggle }) => {
    return (
        <div className="w-48 h-24 relative" style={{imageRendering: 'pixelated'}}>
            {/* Тело */}
            <div className="absolute w-40 h-16 bg-yellow-400 border-4 border-black bottom-0 left-4 rounded-t-lg z-20"></div>
            {/* Колеса */}
            <div className="absolute w-10 h-10 bg-gray-600 border-4 border-black rounded-full bottom-[-8px] left-0 z-30"></div>
            <div className="absolute w-10 h-10 bg-gray-600 border-4 border-black rounded-full bottom-[-8px] right-0 z-30"></div>
            {/* Шланг */}
            <div className="absolute w-8 h-12 bg-gray-700 border-4 border-black top-[-8px] left-1/2 -translate-x-1/2 z-10"></div>
             {/* Индикатор анимации */}
            <div className={`absolute w-4 h-4 rounded-full top-2 left-20 z-30 ${animationToggle ? 'bg-red-500' : 'bg-green-500'}`}></div>
        </div>
    )
}

export const ZasosPylesosaWinScreen: React.FC<{ onContinue: () => void; character: Character | null }> = ({ onContinue, character }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_PYLESOS);
    }, [playSound]);

    const charArt = CHARACTER_ART_MAP[character || Character.KANILA];

    // --- KANILA WIN: RODEO ---
    if (character === Character.KANILA) {
        return (
            <div className="absolute inset-0 bg-fuchsia-900 z-50 flex flex-col items-center justify-center overflow-hidden">
                <style>{`
                    @keyframes rodeo-bounce {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        25% { transform: translateY(-20px) rotate(-5deg); }
                        50% { transform: translateY(0) rotate(0deg); }
                        75% { transform: translateY(-15px) rotate(5deg); }
                    }
                    @keyframes speed-lines {
                        from { transform: translateX(100%); }
                        to { transform: translateX(-100%); }
                    }
                `}</style>
                {/* Speed lines background */}
                <div className="absolute inset-0 opacity-20">
                    {Array.from({length:10}).map((_,i) => (
                        <div key={i} className="absolute h-2 bg-white w-full" style={{top: `${i*10}%`, animation: `speed-lines 0.5s linear infinite`, animationDelay: `${i*0.1}s`}}></div>
                    ))}
                </div>

                <div className="relative" style={{ animation: 'rodeo-bounce 0.6s infinite' }}>
                    <div className="absolute -top-[100px] left-8 z-10 transform -scale-x-100">
                         <PixelArt artData={charArt} palette={PIXEL_ART_PALETTE} pixelSize={5} />
                    </div>
                    <PixelVacuum animationToggle={true}/>
                    <div className="absolute top-10 -left-20 text-6xl">💨</div>
                </div>
                
                <h2 className="text-6xl text-yellow-300 font-black mt-16 z-10 animate-pulse" style={{textShadow: '4px 4px 0 #000'}}>УКРОТИТЕЛЬ!</h2>
                <button onClick={onContinue} className="pixel-button mt-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800">ДАЛЬШЕ</button>
            </div>
        );
    }

    // --- SEXISM WIN: ART INSTALLATION ---
    if (character === Character.SEXISM) {
        return (
            <div className="absolute inset-0 bg-[#fdf6e3] z-50 flex flex-col items-center justify-center overflow-hidden">
                <style>{`
                    @keyframes flash-bulb {
                        0%, 90%, 100% { opacity: 0; }
                        91% { opacity: 1; background: white; }
                        95% { opacity: 0; }
                    }
                `}</style>
                <div className="absolute inset-0 pointer-events-none" style={{animation: 'flash-bulb 3s infinite'}}></div>
                
                <div className="relative border-[20px] border-[#b8860b] p-12 bg-white shadow-2xl scale-75 md:scale-100">
                    <PixelVacuum animationToggle={false}/>
                    <div className="absolute -bottom-16 right-0 bg-white border border-black p-2 shadow-lg transform rotate-2">
                        <p className="text-black font-serif text-xs">Exponat #6-2</p>
                        <p className="text-black font-serif font-bold">"Sucking Void"</p>
                        <p className="text-gray-600 text-[10px]">Mixed Media, 2024</p>
                    </div>
                </div>

                <div className="absolute bottom-8 right-8 md:bottom-32 md:right-32 transform scale-x-[-1]">
                     <PixelArt artData={charArt} palette={PIXEL_ART_PALETTE} pixelSize={5} />
                </div>

                <h2 className="text-5xl text-[#b8860b] font-serif font-bold mt-16 md:mt-24 z-10 text-center">КОНЦЕПТУАЛЬНО.</h2>
                <button onClick={onContinue} className="pixel-button mt-8 p-4 text-2xl z-50 bg-[#8b4513] text-white hover:bg-[#a0522d]">ЦЕНИТЬ</button>
            </div>
        );
    }

    // --- BLACK PLAYER WIN: ANNIHILATION ---
    if (character === Character.BLACK_PLAYER) {
        return (
            <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden">
                <style>{`
                    @keyframes implode {
                        0% { transform: scale(1) rotate(0); filter: hue-rotate(0deg); }
                        50% { transform: scale(0.1) rotate(180deg); filter: hue-rotate(180deg) invert(1); }
                        60% { transform: scale(0); opacity: 0; }
                        100% { transform: scale(0); opacity: 0; }
                    }
                    @keyframes void-pulse {
                        0%, 100% { box-shadow: 0 0 50px 20px #ff0000; opacity: 0.5; }
                        50% { box-shadow: 0 0 100px 50px #ff0000; opacity: 1; }
                    }
                `}</style>
                
                <div className="relative">
                    <div style={{ animation: 'implode 3s ease-in-out forwards' }}>
                        <PixelVacuum animationToggle={true}/>
                    </div>
                    {/* The Void appearing after implosion */}
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-black rounded-full z-10" style={{
                        transform: 'translate(-50%, -50%)',
                        animation: 'void-pulse 2s infinite 2s',
                        opacity: 0,
                        animationFillMode: 'forwards'
                    }}></div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none mix-blend-difference">
                     <PixelArt artData={charArt} palette={PIXEL_ART_PALETTE} pixelSize={8} />
                </div>

                <h2 className="text-4xl md:text-6xl text-red-600 font-mono mt-32 z-10 animate-pulse text-center">01000100 01000001</h2>
                <button onClick={onContinue} className="pixel-button mt-8 p-4 text-2xl z-50 bg-red-900 hover:bg-red-800 border-red-500 text-red-100">ПОГЛОТИТЬ</button>
            </div>
        );
    }
    
    // Fallback Generic
    return (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden">
            <style>{`
                @keyframes suck-in {
                    0% { transform: translate(-50%, -50%) scale(1) rotate(0); }
                    100% { transform: translate(-50%, -50%) scale(0) rotate(720deg); top: 50%; }
                }
                @keyframes bloat {
                    0% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.5, 1.3); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }
                 @keyframes text-slam {
                    from { transform: scale(5) rotate(-30deg); opacity: 0; }
                    to { transform: scale(1) rotate(0deg); opacity: 1; }
                }
            `}</style>
            <div className="absolute top-[50%] left-[50%]" style={{ animation: 'bloat 1s ease-in-out 1s 3' }}>
                 <PixelArt artData={charArt} palette={PIXEL_ART_PALETTE} pixelSize={4} />
            </div>
            <div className="absolute top-[110%] left-[50%] z-[-1]" style={{ animation: 'suck-in 1s ease-in 0.5s forwards' }}>
                <PixelVacuum animationToggle={true}/>
            </div>
            <h2 className="text-8xl text-yellow-400" style={{ animation: 'text-slam 0.5s ease-out 3.5s forwards', opacity: 0 }}>ЗАСОСАЛ!</h2>
             <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50" style={{ animation: 'text-slam 0.5s ease-out 4s forwards', opacity: 0 }}>
                ДАЛЬШЕ
            </button>
        </div>
    )
}

// Background Component tailored for each character
const ThemedBackground: React.FC<{ character: Character | null, scrollOffset: number }> = ({ character, scrollOffset }) => {
    // Kanila: Cyber-Glitch / Acid Punk (Lighter than before)
    if (character === Character.KANILA) {
        return (
            <div className="absolute inset-0 bg-fuchsia-900 overflow-hidden">
                <style>{`
                    @keyframes glitch-bg {
                        0% { background-position: 0% 0%; opacity: 0.1; }
                        25% { background-position: 5% 5%; opacity: 0.2; }
                        50% { background-position: -5% -5%; opacity: 0.1; }
                        75% { background-position: 5% -5%; opacity: 0.2; }
                        100% { background-position: 0% 0%; opacity: 0.1; }
                    }
                `}</style>
                {/* Lighter, messy background pattern */}
                <div 
                    className="absolute inset-0" 
                    style={{ 
                        backgroundImage: `linear-gradient(45deg, #4a044e 25%, transparent 25%, transparent 75%, #4a044e 75%, #4a044e), linear-gradient(45deg, #4a044e 25%, transparent 25%, transparent 75%, #4a044e 75%, #4a044e)`,
                        backgroundSize: '40px 40px',
                        backgroundPosition: `0 ${scrollOffset}%`,
                        opacity: 0.3
                    }}
                ></div>
                {/* Static Noise Overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.1\'/%3E%3C/svg%3E")',
                    animation: 'glitch-bg 0.5s steps(3) infinite'
                }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-fuchsia-900/50 opacity-50"></div>
            </div>
        );
    }

    // Sexism: Surreal Gallery (Unchanged, already light)
    if (character === Character.SEXISM) {
        return (
            <div className="absolute inset-0 bg-[#fdf6e3] overflow-hidden">
                <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(45deg, #d2b48c 25%, transparent 25%, transparent 75%, #d2b48c 75%, #d2b48c), linear-gradient(45deg, #d2b48c 25%, transparent 25%, transparent 75%, #d2b48c 75%, #d2b48c)`,
                        backgroundSize: '60px 60px',
                        backgroundPosition: `0 ${scrollOffset}%`
                    }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="w-[80%] h-[80%] border-8 border-[#8b4513] rotate-12"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#e6d0b3] to-[#fdf6e3] mix-blend-multiply pointer-events-none"></div>
            </div>
        );
    }

    // Black Player: Digital Grid (Less gloomy than pure black)
    if (character === Character.BLACK_PLAYER) {
        return (
            <div className="absolute inset-0 bg-slate-900 overflow-hidden">
                 {/* Red Grid moving downwards */}
                 <div 
                    className="absolute inset-0"
                    style={{ 
                        backgroundImage: `linear-gradient(rgba(50, 0, 0, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 0, 0, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        backgroundPosition: `0 ${scrollOffset}%`
                    }}
                ></div>
                 <div 
                    className="absolute inset-0 opacity-30 font-mono text-red-500 text-xs break-all leading-none"
                    style={{ transform: `translateY(${scrollOffset * 0.2}%)` }}
                >
                    {Array(1000).fill(0).map(() => Math.random() > 0.8 ? '1' : ' ').join('')}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-transparent to-red-950/80 opacity-80"></div>
            </div>
        );
    }

    // Default (Generic)
    return (
        <div className="absolute inset-0 bg-gray-800 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.1)_2px,transparent_2px),linear-gradient(to_right,rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[size:50px_50px]" style={{ backgroundPosition: `0 ${scrollOffset}%` }}></div>
    );
};


export const ZasosPylesosa: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    // --- Состояние ---
    const { character } = useSession();
    const { playSound } = useSettings();

    // Adjusted settings for better playability
    const settings = useMemo(() => {
        // Significantly increased gapWidth (safe zone size)
        // Reduced spawnRateMultiplier to make obstacles less dense
        const baseSettings = { survivalTime: 30, baseScrollSpeed: 15, spawnRateMultiplier: 0.6, gapWidth: 40 };
        switch(character) {
            case Character.KANILA: // Easy
                return { survivalTime: 35, baseScrollSpeed: 12, spawnRateMultiplier: 0.5, gapWidth: 45 };
            case Character.BLACK_PLAYER: // Hard
                return { survivalTime: 25, baseScrollSpeed: 20, spawnRateMultiplier: 0.8, gapWidth: 35 };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [character]);
    
    const [timeLeft, setTimeLeft] = useState(settings.survivalTime);
    const [playerX, setPlayerX] = useState(50); // Позиция игрока по X в %
    const [obstacles, setObstacles] = useState<any[]>([]);
    const [vacuumX, setVacuumX] = useState(50); // Позиция пылесоса по X
    const [status, setStatus] = useState<'playing'|'won'|'lost'>('playing');
    const [scrollOffset, setScrollOffset] = useState(0); // Для скроллинга фона
    const { isInstructionModalVisible } = useNavigation();

    // --- Ссылки ---
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);
    const obstacleId = useRef(0);
    const lastPlayerX = useRef(50); // Для вычисления наклона
    const timeRef = useRef(0); // Total game time elapsed for sine wave calculations

    // --- Арт и константы ---
    const charArt = useMemo(() => CHARACTER_ART_MAP[character || Character.KANILA], [character]);
    
    // Character Specific Items
    const obstacleTypes = useMemo(() => {
        if (character === Character.KANILA) return ['💣', '💊', '🚧', '👾', '🔥', '🧱', '💸'];
        if (character === Character.SEXISM) return ['🎨', '🖼️', '🗿', '👁️', '🎷', '🖌️', '🕰️'];
        if (character === Character.BLACK_PLAYER) return ['0', '1', '☠️', '🕷️', '🌑', '⚠️', '🩸'];
        return ['🎹', '🗿', 'АБСУРД', '♦', '📄', '🔥', '👟', '🍔'];
    }, [character]);

    const PLAYER_Y_POS = 80; // Фиксированная вертикальная позиция игрока в %
    
    useEffect(() => {
        setTimeLeft(settings.survivalTime);
    }, [settings.survivalTime]);

    // --- Игровой цикл ---
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing') return;
        const dtSec = deltaTime / 1000;
        timeRef.current += dtSec;

        // --- Таймер и сложность ---
        const newTimeLeft = Math.max(0, timeLeft - dtSec);
        setTimeLeft(newTimeLeft);
        if (newTimeLeft <= 0) {
            if (!hasFinished.current) {
                hasFinished.current = true;
                setStatus('won');
            }
            return;
        }
        const progress = (settings.survivalTime - newTimeLeft) / settings.survivalTime;
        const scrollSpeed = settings.baseScrollSpeed + progress * 45;
        
        // Spawn rate increases slightly but base is much lower now
        const baseSpawnChance = 0.15; 
        const spawnChance = (baseSpawnChance + progress * 0.1) * settings.spawnRateMultiplier;

        // --- Управление звуком пылесоса ---
        const pitch = 1.0 + progress * 1.5; 
        updateMusicParameter('pitch', pitch);

        // --- Скроллинг фона ---
        setScrollOffset(offset => (offset + scrollSpeed * dtSec) % 100);

        // --- Движение пылесоса (следит за центром безопасной зоны) ---
        // Calculate the "Safe Corridor" center. 
        const wave1 = Math.sin(timeRef.current * 0.8) * 30; // Slow large swing (reduced amplitude slightly)
        const wave2 = Math.sin(timeRef.current * 2.0) * 8; // Fast small wobble
        // Clamp safe zone to ensure it's not totally off screen
        const safeZoneCenter = Math.max(15, Math.min(85, 50 + wave1 + wave2)); 
        
        setVacuumX(safeZoneCenter); // Vacuum follows the safe path to "guide" visually

        // --- Появление препятствий (THE CORRIDOR LOGIC REVISED) ---
        if (Math.random() < spawnChance) {
            // Attempt to spawn items across the width
            // Reduced cluster size to prevent walls
            const clusterSize = 1 + Math.floor(Math.random() * 2); 
            
            for(let i=0; i<clusterSize; i++) {
                // Random position across FULL width (0-100)
                const candidateX = Math.random() * 100;
                
                // Safe zone is [safeZoneCenter - gap/2, safeZoneCenter + gap/2]
                // We use a larger gap width now to make it passable
                const distFromSafe = Math.abs(candidateX - safeZoneCenter);
                
                if (distFromSafe > settings.gapWidth / 2) {
                    setObstacles(o => [...o, {
                        id: obstacleId.current++,
                        content: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)],
                        x: candidateX,
                        y: -10 - Math.random() * 15, // Spread out vertically a bit more
                        size: 3 + Math.random() * 2, // Размер в vmin
                        rot: Math.random() * 360
                    }]);
                }
            }
            
            // Edge Guard: Occasionally spawn at very edges to prevent camping, but less frequently
            // Reduced chance from 0.5 to 0.2
            if (safeZoneCenter > 30 && Math.random() < 0.2) {
                 setObstacles(o => [...o, { id: obstacleId.current++, content: obstacleTypes[0], x: 2 + Math.random()*3, y: -10, size: 3, rot: 0 }]);
            }
            if (safeZoneCenter < 70 && Math.random() < 0.2) {
                 setObstacles(o => [...o, { id: obstacleId.current++, content: obstacleTypes[0], x: 95 + Math.random()*3, y: -10, size: 3, rot: 0 }]);
            }
        }

        // --- Движение и столкновения препятствий ---
        const playerRect = { x: playerX - 2.5, y: PLAYER_Y_POS - 4, width: 5, height: 8 };
        setObstacles(currentObs => {
            const updated = [];
            for (const o of currentObs) {
                const newY = o.y + scrollSpeed * dtSec;
                if (newY > 110) continue; // Исчезают за экраном

                // Проверка столкновения with a slightly more forgiving hitbox
                const hitBoxShrink = 0.2; // Shrink item hitbox by 20%
                const obsRect = { 
                    x: o.x - (o.size * (1 - hitBoxShrink)) / 2, 
                    y: newY - (o.size * (1 - hitBoxShrink)) / 2, 
                    width: o.size * (1 - hitBoxShrink), 
                    height: o.size * (1 - hitBoxShrink) 
                };
                
                 if (
                    playerRect.x < obsRect.x + obsRect.width &&
                    playerRect.x + playerRect.width > obsRect.x &&
                    playerRect.y < obsRect.y + obsRect.height &&
                    playerRect.y + playerRect.height > obsRect.y
                ) {
                    if (!hasFinished.current) {
                        hasFinished.current = true;
                        setStatus('lost');
                        // Анимация "засасывания" игрока при столкновении
                        const playerEl = document.getElementById('player-character');
                        if (playerEl) {
                           playerEl.style.transition = 'top 1s cubic-bezier(0.5, 0, 1, 1), transform 1s ease-in-out';
                           playerEl.style.top = '110%';
                           playerEl.style.transform = 'translate(-50%, -50%) scale(0) rotate(720deg)';
                        }
                        setTimeout(onLose, 1500);
                    }
                }

                updated.push({ ...o, y: newY });
            }
            return updated;
        });

    }, [status, timeLeft, playerX, obstacleTypes, onLose, settings]), status === 'playing' && !isInstructionModalVisible);

    // --- Управление игроком ---
    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameAreaRef.current && status === 'playing') {
            e.preventDefault();
            const rect = gameAreaRef.current.getBoundingClientRect();
            const pointer = 'touches' in e ? e.touches[0] : e;
            if (!pointer) return;
            const x = Math.max(5, Math.min(95, ((pointer.clientX - rect.left) / rect.width) * 100));
            setPlayerX(x);
        }
    };
    
    // Эффект наклона для персонажа игрока в зависимости от направления движения
    const playerTilt = (playerX - lastPlayerX.current) * 5;
    lastPlayerX.current = playerX;
    
    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };
    
    return (
        <div 
            ref={gameAreaRef} 
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            onTouchStart={handlePointerMove}
            className="w-full h-full bg-gray-900 flex flex-col items-center relative overflow-hidden cursor-none"
        >
            <ThemedBackground character={character} scrollOffset={scrollOffset} />

            {status === 'lost' && <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center text-7xl text-red-500 animate-ping">ЗАСОСАЛО</div>}
            {status === 'won' && <ZasosPylesosaWinScreen onContinue={handleWinContinue} character={character} />}

            {status === 'playing' && <>
                <div className="absolute top-16 text-3xl z-40 text-white font-bold" style={{textShadow: '2px 2px 0 #000'}}>
                    {Math.ceil(timeLeft)}
                </div>

                {/* Игрок */}
                <div id="player-character" className="absolute z-30 pointer-events-none" style={{
                    left: `${playerX}%`,
                    top: `${PLAYER_Y_POS}%`,
                    transform: `translate(-50%, -50%) rotate(${playerTilt}deg)`,
                    transition: 'transform 0.1s linear',
                }}>
                     {charArt && <PixelArt artData={charArt} palette={PIXEL_ART_PALETTE} pixelSize={2} />}
                </div>
                
                {/* Препятствия */}
                {obstacles.map(o => (
                    <div key={o.id} className="absolute text-4xl z-20 pointer-events-none" style={{
                        left: `${o.x}%`,
                        top: `${o.y}%`,
                        fontSize: `${o.size}vmin`,
                        transform: `translate(-50%, -50%) rotate(${o.rot}deg)`,
                        textShadow: character === Character.KANILA ? '2px 2px 0 #0f0' : '2px 2px 0 #000'
                    }}>
                        {o.content}
                    </div>
                ))}
                
                {/* Пылесос (Следует за безопасной зоной, чтобы путать или подсказывать?) */}
                <div className="absolute bottom-[-10px] z-10 transition-transform duration-100" style={{ left: `${vacuumX}%`, transform: 'translateX(-50%)' }}>
                    <PixelVacuum animationToggle={Math.floor(timeLeft*2)%2 === 0}/>
                </div>
                
                {/* Визуализация потока воздуха в безопасную зону для красоты */}
                <div className="absolute inset-0 pointer-events-none opacity-20 z-0" style={{
                    background: `radial-gradient(circle at ${vacuumX}% 100%, transparent 10%, ${character === Character.BLACK_PLAYER ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.1)'} 50%)`
                }}></div>
            </>}
        </div>
    );
};
