import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { FEMINITIVES_PAIRS } from '../../data/wordData';
import { useSession, useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';

interface FlyingWord { id: number; text: string; correctText: string; pos: { x: number; y: number }; vel: { x: number; y: number }; isTransformed: boolean; isFadingOut: boolean; }
interface Particle { id: number; pos: { x: number; y: number }; }

// A single pillar component
const Pillar: React.FC<{ cracks: number, height: number, isOppressed: boolean }> = ({ cracks, height, isOppressed }) => {
    const crackColors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00'];
    const pillarClasses = `w-24 bg-gray-600 border-2 border-black relative overflow-hidden ${isOppressed ? 'oppressed-pillar' : ''}`;
    
    return (
        <div className={pillarClasses} style={{
            height: `${height}px`,
            background: 'linear-gradient(45deg, #6b7280, #4b5563)'
        }}>
            {/* Render cracks based on the number of hits */}
            {Array.from({ length: cracks }).map((_, i) => (
                <div key={i} className="absolute h-full w-1" style={{
                    left: `${10 + i * 20 + Math.random() * 10}%`,
                    top: '-10%',
                    transform: `rotate(${(Math.random() - 0.5) * 20}deg)`,
                    background: `linear-gradient(to bottom, transparent, ${crackColors[i % crackColors.length]}, transparent)`
                }}></div>
            ))}
        </div>
    );
};

// The new win screen
export const BoitsovskiyKlubFeminitivovWinScreen: React.FC<{ onContinue: () => void; }> = ({ onContinue }) => {
    const { playSound } = useSettings();
    const [phase, setPhase] = useState<'rising' | 'attacking' | 'collapsing' | 'victory'>('rising');
    const [pillars, setPillars] = useState([
        { id: 1, cracks: 0, height: 200 + Math.random() * 80 },
        { id: 2, cracks: 0, height: 200 + Math.random() * 80 },
        { id: 3, cracks: 0, height: 200 + Math.random() * 80 },
    ]);

    const feminitiveWords = useMemo(() => FEMINITIVES_PAIRS.map(p => p.correct).sort(() => 0.5 - Math.random()), []);

    const flyingSymbols = useMemo(() => {
        return Array.from({ length: 30 }).map((_, i) => {
            const fromLeft = Math.random() > 0.5;
            const symbol = ['♦', '★', '●', '■', '▲'][i % 5];
            const color = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff8c00'][i % 5];
            return {
                id: i,
                symbol,
                style: {
                    position: 'absolute',
                    top: `${Math.random() * 100}%`,
                    left: fromLeft ? '-10%' : '110%',
                    '--destination-x': fromLeft ? '120vw' : '-120vw',
                    transform: `scale(${1 + Math.random()})`,
                    animation: `fly-across linear forwards`,
                    animationDuration: `${5 + Math.random() * 7}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    fontSize: '2rem',
                    color: color,
                    textShadow: '2px 2px 0 #000',
                } as React.CSSProperties,
            };
        });
    }, []);

    // Phase management
    useEffect(() => {
        // Phase 1 -> 2
        const toAttack = setTimeout(() => {
            setPhase('attacking');
        }, 2000);
        // Phase 2 -> 3
        const toCollapse = setTimeout(() => {
            playSound(SoundType.WIN_BOITSOVSKIY);
            setPhase('collapsing');
        }, 6000);
        // Phase 3 -> 4
        const toVictory = setTimeout(() => {
             playSound(SoundType.PLAYER_WIN);
            setPhase('victory');
        }, 8000);

        return () => {
            clearTimeout(toAttack);
            clearTimeout(toCollapse);
            clearTimeout(toVictory);
        };
    }, [playSound]);

    // Attack simulation
    useEffect(() => {
        if (phase !== 'attacking') return;

        const attackInterval = setInterval(() => {
            playSound(SoundType.PLAYER_HIT);
            setPillars(currentPillars => {
                const targetPillarIndex = Math.floor(Math.random() * currentPillars.length);
                return currentPillars.map((p, i) =>
                    i === targetPillarIndex ? { ...p, cracks: p.cracks + 1 } : p
                );
            });
        }, 400);

        return () => clearInterval(attackInterval);
    }, [phase, playSound]);


    const renderPillars = () => (
        <div className="absolute bottom-0 w-full flex justify-around items-end">
            {pillars.map(p => {
                const isRising = phase === 'rising';
                const isCollapsing = phase === 'collapsing' || phase === 'victory';
                const style: React.CSSProperties = {
                    transition: 'transform 1s ease-out, opacity 1s ease-out',
                    transform: isCollapsing ? `translateY(100%) rotate(${(Math.random() - 0.5) * 45}deg) scale(0.5)` : isRising ? 'translateY(100%)' : 'translateY(0)',
                    opacity: isCollapsing ? 0 : 1,
                };
                 if (isRising) {
                    style.animation = `pillar-rise 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards`;
                 }
                return (
                    <div key={p.id} style={style}>
                        <Pillar cracks={p.cracks} height={p.height} isOppressed={phase === 'attacking'} />
                    </div>
                );
            })}
        </div>
    );
    
    return (
        <div className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center overflow-hidden">
            <style>{`
                @keyframes fly-across { from { transform: translateX(var(--destination-x)); } to { transform: translateX(calc(var(--destination-x) * -1)); } }
                @keyframes pillar-rise { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .oppressed-pillar { animation: pillar-oppress 0.5s ease-in-out infinite; }
                @keyframes pillar-oppress { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.95) scaleX(1.05); } }
                @keyframes text-slam { from { transform: scale(5) rotate(-30deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }
            `}</style>
            {/* Flying symbols in the background */}
            {phase === 'attacking' && flyingSymbols.map(s => <div key={s.id} style={s.style}>{s.symbol}</div>)}
            
            {/* The pillars */}
            {renderPillars()}

            {/* Victory text and button */}
            {phase === 'victory' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="flex">
                        {feminitiveWords[0].split('').map((char, i) => (
                            <h2 key={i} className="text-6xl text-fuchsia-400" style={{ animation: `text-slam 0.5s ${1 + i*0.1}s ease-out forwards`, opacity: 0 }}>{char}</h2>
                        ))}
                    </div>
                    <h3 className="text-3xl text-white mt-4" style={{ animation: `text-slam 0.5s 2s ease-out forwards`, opacity: 0 }}>ПАТРИАРХАТ ПОВЕРЖЕН!</h3>
                    <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl bg-green-700" style={{ animation: `text-slam 0.5s 2.5s ease-out forwards`, opacity: 0 }}>
                        ДАЛЬШЕ!
                    </button>
                </div>
            )}
        </div>
    );
};

export const BoitsovskiyKlubFeminitivov: React.FC<{ onWin: () => void; onLose: () => void; isMinigameInverted?: boolean; }> = ({ onWin, onLose, isMinigameInverted = false }) => {
    const { playSound } = useSettings();
    const { character, handleMistake, addScore } = useSession();
    const containerRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);
    const wordIdCounter = useRef(0);
    const particleIdCounter = useRef(0);
    
    const settings = useMemo(() => {
        const baseSettings = { time: 45, spawnRate: 0.05, speed: 6 };
        switch(character) {
            case Character.KANILA: // Easy
                return { time: 60, spawnRate: 0.04, speed: 5 };
            case Character.BLACK_PLAYER: // Hard
                return { time: 35, spawnRate: 0.07, speed: 8 };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [character]);
    
    const [words, setWords] = useState<FlyingWord[]>([]);
    const [timeLeft, setTimeLeft] = useState(settings.time);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [status, setStatus] = useState<'playing' | 'won'>('playing');

    useGameLoop(useCallback((deltaTime) => {
        if(hasFinished.current || status !== 'playing') return;
        const dtSec = deltaTime / 1000;
        
        setTimeLeft(t => {
            const newTime = t - dtSec;
            if (newTime <= 0) {
                if (!hasFinished.current) { hasFinished.current = true; onLose(); }
                return 0;
            }
            return newTime;
        });

        if (Math.random() < settings.spawnRate) {
            const pair = FEMINITIVES_PAIRS[Math.floor(Math.random() * FEMINITIVES_PAIRS.length)];
            const fromLeft = Math.random() > 0.5;
            setWords(w => [...w, {
                id: wordIdCounter.current++, text: pair.incorrect, correctText: pair.correct,
                pos: { x: fromLeft ? -10 : 110, y: 15 + Math.random() * 70 },
                vel: { x: (fromLeft ? 1 : -1) * settings.speed, y: 0 },
                isTransformed: false, isFadingOut: false,
            }]);
        }

        setWords(currentWords => currentWords.map(w => {
            let newX = w.pos.x + w.vel.x * dtSec;
            if (newX < -15 || newX > 115) return null; // Despawn
            if (w.isFadingOut && Math.abs(50 - newX) < 1) return null;
            return { ...w, pos: { ...w.pos, x: newX } };
        }).filter(Boolean) as FlyingWord[]);

    }, [onLose, status, settings]), status === 'playing');

    const handleWordClick = (word: FlyingWord) => {
        if (word.isTransformed || hasFinished.current) return;
        
        const isCorrectClick = !isMinigameInverted;

        if (isCorrectClick) {
            playSound(SoundType.TRANSFORM_SUCCESS);
            addScore(100);
            setWords(ws => ws.map(w => w.id === word.id ? { ...w, isTransformed: true, text: word.correctText, vel: {x: (50 - w.pos.x) / 2, y: 0}, isFadingOut: true } : w));
            const newParticles: Particle[] = Array.from({length: 8}).map(() => ({id: particleIdCounter.current++, pos: word.pos}));
            setParticles(p => [...p, ...newParticles]);
            setTimeout(() => setParticles(p => p.filter(particle => !newParticles.some(np => np.id === particle.id))), 500);
        } else {
            if (!handleMistake()) {
                playSound(SoundType.PUNISHMENT_CLICK);
                setTimeLeft(t => Math.max(0, t - 3));
            }
        }
    };

    const handleBackgroundClick = () => {
        if (hasFinished.current) return;
        const isCorrectClick = isMinigameInverted;
        if(isCorrectClick) {
            playSound(SoundType.TRANSFORM_SUCCESS);
            addScore(10);
        } else {
             if (!handleMistake()) {
                 playSound(SoundType.ITEM_CATCH_BAD);
             }
        }
    };

    useEffect(() => {
        if(status === 'playing' && timeLeft > 0 && words.length === 0 && wordIdCounter.current > 15) {
             if(!hasFinished.current){
                hasFinished.current = true;
                setStatus('won');
            }
        }
    }, [words, timeLeft, status]);
    
    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    }
    
    const handleWordInteract = (e: React.MouseEvent | React.TouchEvent, word: FlyingWord) => {
        e.stopPropagation();
        handleWordClick(word);
    };

    return (
        <div ref={containerRef} className="w-full h-full bg-gray-900 flex flex-col relative overflow-hidden" onClick={handleBackgroundClick} onTouchStart={handleBackgroundClick}>
            {status === 'won' && <BoitsovskiyKlubFeminitivovWinScreen onContinue={handleWinContinue} />}

            <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center text-white z-10">
                <h3 className="text-3xl">БОЙЦОВСКИЙ КЛУБ</h3>
                <p className="text-xl">Время: {Math.ceil(timeLeft)}</p>
                <p className="text-yellow-300">{isMinigameInverted ? "Кликай на фон, а не на слова!" : "Кликай на слова, чтобы их исправить!"}</p>
            </div>
            
            <div className="absolute inset-0">
                {words.map(w => (
                    <div key={w.id} 
                        className={`absolute text-2xl md:text-3xl font-bold cursor-pointer whitespace-nowrap ${w.isTransformed ? 'text-fuchsia-400' : 'text-white'}`} 
                        style={{ left: `${w.pos.x}%`, top: `${w.pos.y}%`, transition: 'left 0.1s linear', textShadow: '2px 2px #000' }}
                        onClick={(e) => handleWordInteract(e, w)}
                        onTouchStart={(e) => handleWordInteract(e, w)}
                    >
                        {w.text}
                    </div>
                ))}
            </div>

            {/* Player Shield */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-10 bg-gradient-to-t from-fuchsia-500 to-pink-500 rounded-t-full z-20 pixel-border border-b-0 flex items-center justify-center text-lg font-bold text-white">Я - ЧМАВЕЧЫЦА</div>

            {/* Particles from successful hits */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
                {particles.map(p => (
                    <div key={p.id} className="absolute text-2xl font-bold text-yellow-300" style={{ left: `${p.pos.x}%`, top: `${p.pos.y}%`, textShadow: '2px 2px 0px #000', animation: 'jiggle 0.5s ease-out forwards' }}>+</div>
                ))}
            </div>
        </div>
    );
};
