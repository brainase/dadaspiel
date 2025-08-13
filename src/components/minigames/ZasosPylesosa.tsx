
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, useSettings } from '../../context/GameContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { SoundType } from '../../utils/AudioEngine';

// Компонент пиксельного пылесоса
const PixelVacuum: React.FC<{animationToggle: boolean}> = ({ animationToggle }) => {
    return (
        <div className="w-48 h-24 relative" style={{imageRendering: 'pixelated'}}>
            {/* Тело */}
            <div className="absolute w-40 h-16 bg-yellow-400 border-4 border-black bottom-0 left-4 rounded-t-lg"></div>
            {/* Колеса */}
            <div className="absolute w-10 h-10 bg-gray-600 border-4 border-black rounded-full bottom-[-8px] left-0"></div>
            <div className="absolute w-10 h-10 bg-gray-600 border-4 border-black rounded-full bottom-[-8px] right-0"></div>
            {/* Шланг */}
            <div className="absolute w-8 h-12 bg-gray-700 border-4 border-black top-[-8px] left-1/2 -translate-x-1/2"></div>
             {/* Индикатор анимации */}
            <div className={`absolute w-4 h-4 rounded-full top-2 left-20 ${animationToggle ? 'bg-red-500' : 'bg-green-500'}`}></div>
        </div>
    )
}

export const ZasosPylesosaWinScreen: React.FC<{ onContinue: () => void; charArt: string[] }> = ({ onContinue, charArt }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_PYLESOS);
    }, [playSound]);
    
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


export const ZasosPylesosa: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    // --- Состояние ---
    const { character } = useSession();
    const { playSound } = useSettings();

    const settings = useMemo(() => {
        const baseSettings = { survivalTime: 30, baseScrollSpeed: 15, spawnRateMultiplier: 1 };
        switch(character) {
            case Character.KANILA: // Easy
                return { survivalTime: 35, baseScrollSpeed: 12, spawnRateMultiplier: 0.7 };
            case Character.BLACK_PLAYER: // Hard
                return { survivalTime: 25, baseScrollSpeed: 18, spawnRateMultiplier: 1.4 };
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

    // --- Ссылки ---
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);
    const obstacleId = useRef(0);
    const lastPlayerX = useRef(50); // Для вычисления наклона

    // --- Арт и константы ---
    const charArt = useMemo(() => CHARACTER_ART_MAP[character || Character.KANILA], [character]);
    const obstacleTypes = useMemo(() => ['🎹', '🗿', 'АБСУРД', '♦', '📄', '🔥', '👟', '🍔'], []);
    const PLAYER_Y_POS = 80; // Фиксированная вертикальная позиция игрока в %
    
    useEffect(() => {
        setTimeLeft(settings.survivalTime);
    }, [settings.survivalTime]);

    // --- Игровой цикл ---
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing') return;
        const dtSec = deltaTime / 1000;

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
        const spawnChance = (0.08 + progress * 0.15) * settings.spawnRateMultiplier;

        // --- Скроллинг фона ---
        setScrollOffset(offset => (offset + scrollSpeed * dtSec) % 100);

        // --- Движение пылесоса ---
        setVacuumX(x => 50 + Math.sin(Date.now() / 1000) * 40);

        // --- Появление препятствий ---
        if (Math.random() < spawnChance) {
            setObstacles(o => [...o, {
                id: obstacleId.current++,
                content: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)],
                x: 10 + Math.random() * 80, // Появляются по всей ширине
                y: -5, // Появляются сверху
                size: 2 + Math.random() * 3, // Размер в vmin
                rot: Math.random() * 360
            }]);
        }

        // --- Движение и столкновения препятствий ---
        const playerRect = { x: playerX - 2.5, y: PLAYER_Y_POS - 4, width: 5, height: 8 };
        setObstacles(currentObs => {
            const updated = [];
            for (const o of currentObs) {
                const newY = o.y + scrollSpeed * dtSec;
                if (newY > 110) continue; // Исчезают за экраном

                // Проверка столкновения
                const obsRect = { x: o.x - o.size / 2, y: newY - o.size / 2, width: o.size, height: o.size };
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

    }, [status, timeLeft, playerX, obstacleTypes, onLose, settings]), status === 'playing');

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
            {/* Фон */}
            <div className="absolute inset-0 bg-gray-800 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.1)_2px,transparent_2px),linear-gradient(to_right,rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[size:50px_50px]" style={{ backgroundPosition: `0 ${scrollOffset}%` }}></div>

            {status === 'lost' && <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center text-7xl text-red-500 animate-ping">ЗАСОСАЛО</div>}
            {status === 'won' && <ZasosPylesosaWinScreen onContinue={handleWinContinue} charArt={charArt} />}

            {status === 'playing' && <>
                <div className="absolute top-16 text-3xl z-40 text-white">УБЕГАЙ: {Math.ceil(timeLeft)}</div>

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
                    }}>
                        {o.content}
                    </div>
                ))}
                
                {/* Пылесос */}
                <div className="absolute bottom-0 z-10" style={{ left: `${vacuumX}%`, transform: 'translateX(-50%)' }}>
                    <PixelVacuum animationToggle={Math.floor(timeLeft*2)%2 === 0}/>
                </div>
            </>}
        </div>
    );
};
