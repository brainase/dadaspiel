import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, useSettings } from '../../context/GameContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { PixelArt } from '../core/PixelArt';
import { SoundType } from '../../utils/AudioEngine';
import { MinigameHUD } from '../core/MinigameHUD';

interface Kiss {
    id: number;
    x: number; // horizontal position %
    y: number; // vertical position %
    speed: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    char: string;
}

// Компонент, отображающий пропуск на "Гей-Оргию" при победе
export const PoceluyDobraWinScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_DOBRO);
    }, [playSound]);

    return (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden z-30">
            <style>{`
            @keyframes rainbow-bg { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
            .rainbow-bg {
                background: linear-gradient(124deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #dd00f3);
                background-size: 1800% 1800%;
                animation: rainbow-bg 18s ease infinite;
            }
            @keyframes fly-in { from { transform: translateY(100vh) rotate(-180deg) scale(0); } to { transform: translateY(0) rotate(0) scale(1); } }
            @keyframes float-around { 0% { transform: translate(0, 0); } 25% { transform: translate(10px, 20px); } 50% { transform: translate(-15px, -10px); } 75% { transform: translate(5px, -15px); } 100% { transform: translate(0, 0); } }
            .flying-emoji { animation: float-around 8s ease-in-out infinite; }
        `}</style>
            <div className="absolute inset-0 rainbow-bg opacity-70"></div>
            {/* Летающие эмодзи для атмосферы */}
            <div className="absolute top-[10%] left-[15%] text-5xl flying-emoji" style={{ animationDelay: '0s' }}>🍆</div>
            <div className="absolute top-[70%] left-[80%] text-5xl flying-emoji" style={{ animationDelay: '-2s' }}>🍑</div>
            <div className="absolute top-[80%] left-[10%] text-5xl flying-emoji" style={{ animationDelay: '-4s' }}>💦</div>
            <div className="absolute top-[20%] left-[75%] text-5xl flying-emoji" style={{ animationDelay: '-6s' }}>❤️‍🔥</div>
            
            <div className="w-96 h-56 bg-fuchsia-300 p-2 pixel-border flex flex-col items-center justify-around text-black transform rotate-[-3deg] animate-[fly-in_1s_cubic-bezier(.17,.67,.73,1.34)]" style={{textShadow: 'none'}}>
                <h3 className="text-2xl font-bold tracking-widest">— ПРОХОДКА —</h3>
                <div className="my-2 text-center">
                    <p className="text-4xl font-bold">ГЕЙ-ОРГИЯ</p>
                    <p className="text-lg">(добра)</p>
                </div>
                <p className="text-sm">*предъявителю сего*</p>
            </div>
            <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800">
                ПРОХОДИМ
            </button>
        </div>
    );
};

// Пиксельный арт Георгия Добра
const PixelDobro: React.FC<{ scale: number; isHit: boolean }> = ({ scale, isHit }) => {
    // ... (rest of PixelDobro component is unchanged)
    const pixelSize = 4; const s = (size: number) => size * pixelSize;
    const skinLight = '#f2d4c2'; const skinMid = '#d4b39b'; const skinShadow = '#a17d68';
    const hairMain = '#b0a08a'; const hairShadow = '#6b5f4e';
    const glassesFrame = '#1a1a1a'; const glassesHighlight = '#ffffff';
    const lipRed = '#ff0000';
    const containerWidth = 20; const containerHeight = 20;

    return (
        <div className={`relative transition-transform ${isHit ? 'animate-[hit-shake_0.2s_ease-in-out]' : ''}`} style={{
            transform: `scale(${scale})`, width: s(containerWidth), height: s(containerHeight), imageRendering: 'pixelated', filter: 'drop-shadow(3px 3px 0px rgba(0,0,0,0.7))'
        }}>
            <div style={{ position: 'absolute', top: s(2), left: s(12), width: s(6), height: s(12), backgroundColor: hairShadow }}></div>
            <div style={{ position: 'absolute', top: s(5), left: s(9), width: s(8), height: s(12), backgroundColor: skinMid }}></div>
            <div style={{ position: 'absolute', top: s(5), left: s(3), width: s(6), height: s(12), backgroundColor: skinLight }}></div>
            <div style={{ position: 'absolute', top: s(1), left: s(2), width: s(12), height: s(7), backgroundColor: hairMain }}></div>
            <div style={{ position: 'absolute', top: s(0), left: s(5), width: s(7), height: s(3), backgroundColor: hairMain }}></div>
            <div style={{ position: 'absolute', top: s(8), left: s(2), width: s(16), height: s(4), backgroundColor: glassesFrame }}></div>
            <div style={{ position: 'absolute', top: s(9), left: s(3), width: s(5), height: s(2), backgroundColor: glassesHighlight }}></div>
            <div style={{ position: 'absolute', top: s(12), left: s(8), width: s(1), height: s(3), backgroundColor: skinLight }}></div>
            <div style={{ position: 'absolute', top: s(12), left: s(9), width: s(1), height: s(3), backgroundColor: skinShadow }}></div>
            <div style={{ position: 'absolute', top: s(15), left: s(9), width: s(2), height: s(1), backgroundColor: lipRed }}></div>
            <div style={{ position: 'absolute', top: s(16), left: s(8), width: s(4), height: s(1), backgroundColor: lipRed }}></div>
            <div style={{ position: 'absolute', top: s(17), left: s(9), width: s(2), height: s(1), backgroundColor: lipRed }}></div>
            <div style={{ position: 'absolute', top: s(17), left: s(4), width: s(4), height: s(1), backgroundColor: skinLight }}></div>
            <div style={{ position: 'absolute', top: s(17), left: s(8), width: s(1), height: s(1), backgroundColor: skinMid }}></div>
            <div style={{ position: 'absolute', top: s(17), left: s(11), width: s(2), height: s(1), backgroundColor: skinMid }}></div>
        </div>
    );
};

export const PoceluyDobra: React.FC<{ onWin: () => void; onLose: () => void; isSlowMo?: boolean; }> = ({ onWin, onLose, isSlowMo = false }) => {
    const { character } = useSession();
    const { isMuted, playSound } = useSettings();
    const [round, setRound] = useState(1);
    const [timeLeft, setTimeLeft] = useState(15);
    const [dobroX, setDobroX] = useState(80);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [isAdvancingRound, setIsAdvancingRound] = useState(false);
    const [kisses, setKisses] = useState<Kiss[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isPlayerHit, setIsPlayerHit] = useState(false);
    const [isDobroHit, setIsDobroHit] = useState(false);
    
    const hasFinished = useRef(false);
    const kissCounter = useRef(0);
    const particleCounter = useRef(0);
    const timeSinceLastSpawn = useRef(0);

    const roundSettings = useMemo(() => {
        const baseSettings = [
            { id: 1, push: 12, missPenalty: 20, spawnInterval: 1200, kissSpeed: 25, duration: 12 },
            { id: 2, push: 10, missPenalty: 22, spawnInterval: 900, kissSpeed: 35, duration: 15 },
            { id: 3, push: 8, missPenalty: 25, spawnInterval: 700, kissSpeed: 45, duration: 20 },
        ][round - 1];

        switch(character) {
            case Character.KANILA: // Easy
                return { ...baseSettings, push: baseSettings.push * 1.5, missPenalty: baseSettings.missPenalty * 0.75, kissSpeed: baseSettings.kissSpeed * 0.8 };
            case Character.BLACK_PLAYER: // Hard
                 return { ...baseSettings, push: baseSettings.push * 0.7, missPenalty: baseSettings.missPenalty * 1.25, kissSpeed: baseSettings.kissSpeed * 1.2, spawnInterval: baseSettings.spawnInterval * 0.8 };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [round, character]);

    const PARRY_ZONE_START_X = 22;
    const PARRY_ZONE_END_X = 32;
    const PLAYER_X = 15;

    const charArt = useMemo(() => CHARACTER_ART_MAP[character || Character.KANILA], [character]);

    useEffect(() => {
        setTimeLeft(roundSettings.duration);
        setDobroX(80);
        setKisses([]);
        setIsAdvancingRound(false);
    }, [round, roundSettings]);

    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing' || isAdvancingRound) return;

        const speedMultiplier = isSlowMo ? 0.3 : 1;
        const dtSec = (deltaTime / 1000) * speedMultiplier;
        
        setTimeLeft(t => Math.max(0, t - dtSec));

        // Spawn kisses
        timeSinceLastSpawn.current += deltaTime;
        if (timeSinceLastSpawn.current > roundSettings.spawnInterval / speedMultiplier) {
            timeSinceLastSpawn.current = 0;
            playSound(SoundType.KISS_SPAWN);
            setKisses(k => [...k, {
                id: kissCounter.current++,
                x: dobroX - 10,
                y: 40 + Math.random() * 20,
                speed: roundSettings.kissSpeed * (0.8 + Math.random() * 0.4)
            }]);
        }

        // Move kisses and check for misses
        setKisses(currentKisses => {
            const updatedKisses = [];
            for(const kiss of currentKisses) {
                const newX = kiss.x - kiss.speed * dtSec;
                if (newX < PLAYER_X + 5) { // Kiss reached player
                    setDobroX(x => Math.max(10, x - roundSettings.missPenalty));
                    playSound(SoundType.PLAYER_HIT);
                    setIsPlayerHit(true);
                    setTimeout(() => setIsPlayerHit(false), 200);
                    continue; // Remove kiss
                }
                updatedKisses.push({...kiss, x: newX});
            }
            return updatedKisses;
        });

        // Update particles
        setParticles(p => p.map(particle => ({...particle, x: particle.x + particle.vx * dtSec, y: particle.y + particle.vy * dtSec, life: particle.life - dtSec})).filter(p => p.life > 0));

    }, [status, roundSettings, dobroX, isAdvancingRound, playSound, isSlowMo]), status === 'playing');

    useEffect(() => {
        if (status !== 'playing' || hasFinished.current || isAdvancingRound) return;
        
        if (dobroX <= 10) {
            hasFinished.current = true;
            setStatus('lost');
            setTimeout(onLose, 2000);
        } else if (timeLeft <= 0) {
            setIsAdvancingRound(true);
            setTimeout(() => {
                if (round < 3) {
                    setRound(r => r + 1);
                } else {
                    hasFinished.current = true;
                    setStatus('won');
                }
            }, 1000);
        }
    }, [dobroX, timeLeft, status, round, onLose, isAdvancingRound]);

    const handleParry = () => {
        if (status !== 'playing' || isAdvancingRound) return;

        const parryableKisses = kisses.filter(k => k.x >= PARRY_ZONE_START_X && k.x <= PARRY_ZONE_END_X);

        if (parryableKisses.length > 0) {
            const parriedKiss = parryableKisses[0];
            setKisses(k => k.filter(kiss => kiss.id !== parriedKiss.id));
            setDobroX(x => Math.min(100, x + roundSettings.push));
            playSound(SoundType.PARRY);
            setIsDobroHit(true);
            setTimeout(() => setIsDobroHit(false), 200);

            // Create particle explosion
            const newParticles: Particle[] = [];
            for (let i = 0; i < 10; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const speed = 20 + Math.random() * 20;
                newParticles.push({
                    id: particleCounter.current++, x: parriedKiss.x, y: parriedKiss.y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    life: 0.5, char: '❤️'
                });
            }
            setParticles(p => [...p, ...newParticles]);

        } else {
            playSound(SoundType.ITEM_CATCH_BAD);
            setDobroX(x => Math.max(10, x - 1));
        }
    };

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };

    const dobroScale = 1 + (80 - dobroX) / 70 * 2.5;

    return (
        <div className="w-full h-full bg-gradient-to-br from-[#d299c2] to-[#fef9d7] flex items-center justify-start p-4 relative overflow-hidden cursor-pointer" onClick={handleParry} onTouchStart={handleParry}>
             <style>{`
                @keyframes hit-shake { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-8px, 0px); } 30% { transform: translate(8px, 0px); } 50% { transform: translate(0, 0); } }
                @keyframes parry-zone-glow { 0%, 100% { box-shadow: 0 0 20px 5px rgba(255, 255, 255, 0.7); } 50% { box-shadow: 0 0 35px 15px rgba(0, 255, 255, 0.9); } }
             `}</style>

            {status === 'won' && <PoceluyDobraWinScreen onContinue={handleWinContinue} />}
            {status === 'lost' && <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center text-5xl text-red-500"><p>ЗАЦЕЛОВАН</p><p className="text-3xl mt-4">(насмерть)</p></div>}
            
            <MinigameHUD>
                <div className="w-full text-center text-rose-800" style={{textShadow: '1px 1px 1px #fff'}}>
                    <p className="text-xl mb-1">Раунд {round}/3</p>
                    <div className="w-full h-6 bg-black pixel-border mt-2" title={`Осталось времени: ${Math.ceil(timeLeft)}с`}>
                        <div className="h-full bg-gradient-to-r from-red-500 to-yellow-400 transition-all duration-100" style={{ width: `${(timeLeft / roundSettings.duration) * 100}%` }}></div>
                    </div>
                    <p className="text-xl mt-2">Парируй поцелуи добра!</p>
                </div>
            </MinigameHUD>

            <div className={`absolute z-20 ${isPlayerHit ? 'animate-[hit-shake_0.2s_ease-in-out]' : ''}`} style={{ left: `${PLAYER_X}%`, top: '50%', transform: 'translateY(-50%)' }}>
                <div className="w-[80px] h-[128px]"><PixelArt artData={charArt} palette={PIXEL_ART_PALETTE} pixelSize={4} /></div>
            </div>
            
            <div className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-100" style={{ left: `${dobroX}%`, transform: `translateX(-50%)` }}>
                <PixelDobro scale={dobroScale} isHit={isDobroHit} />
            </div>

            {/* Parry Zone */}
            <div 
                className="absolute h-48 bg-white/50" 
                style={{ 
                    left: `${PARRY_ZONE_START_X}%`, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    width: `${PARRY_ZONE_END_X - PARRY_ZONE_START_X}%`,
                    animation: isSlowMo ? 'parry-zone-glow 1s ease-in-out infinite' : 'none',
                    transition: 'box-shadow 0.3s',
                }}
            ></div>

            {/* Kisses */}
            {kisses.map(kiss => (
                <div key={kiss.id} className="absolute text-4xl pointer-events-none" style={{ left: `${kiss.x}%`, top: `${kiss.y}%`, transform: 'translate(-50%, -50%)' }}>💋</div>
            ))}
            
            {/* Particles */}
            {particles.map(p => (
                 <div key={p.id} className="absolute text-2xl text-red-500 pointer-events-none" style={{ left: `${p.x}%`, top: `${p.y}%` }}>{p.char}</div>
            ))}
        </div>
    );
};