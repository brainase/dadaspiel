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
export const BoitsovskiyKlubFeminitivovWinScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
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
                    style.animation = `pillar-rise 1.5s cubic-bezier(0.25, 1, 0.5, 1) ${p.id * 0.2}s forwards`;
                }
                return <div key={p.id} style={style}><Pillar cracks={p.cracks} height={p.height} isOppressed={phase === 'attacking'} /></div>
            })}
        </div>
    );

    const renderAttackers = () => {
        if (phase !== 'attacking') return null;
        return Array.from({ length: 15 }).map((_, i) => {
            const word = feminitiveWords[i % feminitiveWords.length];
            const style = {
                '--start-x': `${Math.random() * 100}vw`,
                '--end-y': `${60 + Math.random() * 40}vh`,
                animation: 'fly-down 0.8s ease-in forwards',
                animationDelay: `${i * 0.25}s`,
                color: ['#ff00ff', '#00ffff', '#ffff00', '#00ff00'][i % 4]
            } as React.CSSProperties;
            return <div key={i} className="absolute top-[-10vh] text-2xl font-bold attacker" style={style}>{word}</div>
        });
    };

    const renderDebris = () => {
        if (phase !== 'collapsing' && phase !== 'victory') return null;
        return Array.from({ length: 50 }).map((_, i) => {
             const style = {
                left: `${40 + Math.random() * 20}%`,
                '--end-x': `${(Math.random() - 0.5) * 100}vw`,
                '--end-y': `${(Math.random() - 0.5) * 100}vh`,
                '--rot': `${(Math.random() - 0.5) * 1080}deg`,
                animation: 'fly-out 2s cubic-bezier(0.1, 0.7, 0.3, 1) forwards',
                backgroundColor: ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#6b7280'][i % 5]
            } as React.CSSProperties;
            return <div key={i} className="absolute bottom-0 w-4 h-4 debris" style={style}></div>
        });
    }

    return (
        <div className="absolute inset-0 bg-black z-40 flex flex-col items-center justify-center overflow-hidden">
            <style>{`
                @keyframes pillar-rise {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes pillar-oppressive-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                @keyframes pillar-oppressive-glitch {
                    0% { transform: translate(0,0) skew(0,0); }
                    25% { transform: translate(-3px, 1px) skew(-1deg, 0.5deg); }
                    50% { transform: translate(0,0) skew(0,0); }
                    75% { transform: translate(3px, -1px) skew(1deg, -0.5deg); }
                    100% { transform: translate(0,0) skew(0,0); }
                }
                .oppressed-pillar {
                    animation: pillar-oppressive-pulse 1.5s ease-in-out infinite, pillar-oppressive-glitch 0.3s linear infinite;
                }
                @keyframes fly-down {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(var(--end-y)); opacity: 0; }
                }
                .attacker { position: absolute; left: var(--start-x); }
                @keyframes fly-out {
                    from { transform: translateY(0) rotate(0); opacity: 1; }
                    to { transform: translate(var(--end-x), var(--end-y)) rotate(var(--rot)); opacity: 0; }
                }
                .debris { position: absolute; }
                
                @keyframes horda-slam-and-shake {
                    0% { opacity: 0; letter-spacing: 2rem; transform: scale(3) rotate(-10deg); }
                    80% { opacity: 1; letter-spacing: normal; transform: scale(1) rotate(0); }
                    85% { transform: translate(-4px, 2px) rotate(-1deg); }
                    90% { transform: translate(4px, -2px) rotate(1deg); }
                    95% { transform: translate(-2px, -2px) rotate(0deg); }
                    100% { transform: translate(0, 0); }
                }
                .horda-final-text {
                    font-smoothing: none;
                    -webkit-font-smoothing: none;
                    text-shadow: 4px 4px 0px #000;
                    animation: horda-slam-and-shake 1.8s cubic-bezier(0.1, 0.7, 0.3, 1) forwards;
                    color: #ffff00;
                }
                .horda-friend {
                    position: absolute;
                    font-size: 2rem;
                    color: #ff00ff;
                    text-shadow: 2px 2px 0px #000;
                    animation: friend-jitter 0.3s infinite, friend-appear 1s forwards;
                    opacity: 0;
                    font-smoothing: none;
                    -webkit-font-smoothing: none;
                }
                @keyframes friend-jitter {
                    0% { transform: translate(0,0); }
                    25% { transform: translate(-2px, 2px); }
                    50% { transform: translate(2px, -2px); }
                    75% { transform: translate(-2px, -2px); }
                    100% { transform: translate(2px, 2px); }
                }
                @keyframes friend-appear {
                    from { opacity: 0; transform: scale(0); }
                    to { opacity: 1; transform: scale(1); }
                }
                .bg-animate {
                    background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff8c00);
                    background-size: 200% 200%;
                    animation: bg-pan 16s ease infinite;
                    opacity: ${phase === 'collapsing' || phase === 'victory' ? 0.6 : 0};
                    transition: opacity 2s;
                }
                @keyframes bg-pan {
                    0%{background-position:0% 50%}
                    50%{background-position:100% 50%}
                    100%{background-position:0% 50%}
                }
                @keyframes fly-across {
                    to { transform: translateX(var(--destination-x)) rotate(720deg); }
                }
            `}</style>
            <div className="absolute inset-0 bg-animate"></div>

            {phase === 'victory' && flyingSymbols.map(s => (
                <div key={s.id} style={s.style}>{s.symbol}</div>
            ))}

            {renderPillars()}
            {renderAttackers()}
            {renderDebris()}
            
            {phase === 'victory' && (
                <div className="flex flex-col items-center justify-center z-10">
                    <div className="relative mb-24">
                        <h2 className="text-6xl font-black horda-final-text">
                            ХОРДА!
                        </h2>
                        <div className="horda-friend" style={{ top: '-5rem', left: '-5rem', animationDelay: '0.2s' }}>ДА!</div>
                        <div className="horda-friend" style={{ top: '-3rem', right: '-6rem', animationDelay: '0.4s' }}>ДА!</div>
                        <div className="horda-friend" style={{ bottom: '-5rem', left: '2rem', animationDelay: '0.6s' }}>ДА!</div>
                        <div className="horda-friend" style={{ bottom: '0rem', right: '-5rem', animationDelay: '0.8s' }}>ДА!</div>
                        <div className="horda-friend" style={{ bottom: '-4rem', right: '4rem', transform: 'rotate(15deg)', animationDelay: '1.0s' }}>ДА!</div>
                    </div>
                    <button onClick={onContinue} className="pixel-button p-4 text-2xl z-50 bg-green-700" style={{ animation: 'horda-slam-and-shake 1.8s 0.5s forwards', opacity: 0 }}>
                        ПРОХОДИМ
                    </button>
                </div>
            )}
        </div>
    );
};


export const BoitsovskiyKlubFeminitivov: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { playSound } = useSettings();
    const { character } = useSession();

    const settings = useMemo(() => {
        const baseSettings = { survivalTime: 20, wordSpeedMultiplier: 1.0, spawnRate: 0.05 };
        switch(character) {
            case Character.KANILA: // Easy
                return { survivalTime: 25, wordSpeedMultiplier: 0.8, spawnRate: 0.04 };
            case Character.BLACK_PLAYER: // Hard
                return { survivalTime: 18, wordSpeedMultiplier: 1.25, spawnRate: 0.065 };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [character]);

    const [timeLeft, setTimeLeft] = useState(settings.survivalTime);
    const [words, setWords] = useState<FlyingWord[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [playerHit, setPlayerHit] = useState(false);
    const [status, setStatus] = useState<'playing' | 'won'>('playing');
    
    const [punishmentClicks, setPunishmentClicks] = useState(0);
    const [egoState, setEgoState] = useState<'pristine' | 'cracked1' | 'cracked2' | 'shattered'>('pristine');

    const hasFinished = useRef(false);
    const wordIdCounter = useRef(0);
    const particleIdCounter = useRef(0);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    
    // Reset timer when settings change
    useEffect(() => {
        setTimeLeft(settings.survivalTime);
    }, [settings.survivalTime]);

    // Основной игровой цикл
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current) return;
        
        // Таймер на выживание
        setTimeLeft(t => {
            const newTime = t - deltaTime / 1000;
            if (newTime <= 0) {
                if (!hasFinished.current) {
                    hasFinished.current = true;
                    setStatus('won');
                }
                return 0;
            }
            return newTime;
        });

        // Случайное появление новых слов
        if (Math.random() < settings.spawnRate) {
            const side = Math.floor(Math.random() * 4); // 0:left, 1:right, 2:top, 3:bottom
            const pair = FEMINITIVES_PAIRS[Math.floor(Math.random() * FEMINITIVES_PAIRS.length)];
            let pos, vel;
            const baseSpeed = 10 * settings.wordSpeedMultiplier;
            const randomSpeed = 5 * settings.wordSpeedMultiplier;
            switch(side) {
                case 0: pos = { x: -10, y: Math.random() * 100 }; vel = { x: baseSpeed + Math.random() * randomSpeed, y: (Math.random() - 0.5) * 10 }; break;
                case 1: pos = { x: 110, y: Math.random() * 100 }; vel = { x: -baseSpeed - Math.random() * randomSpeed, y: (Math.random() - 0.5) * 10 }; break;
                case 2: pos = { x: Math.random() * 100, y: -10 }; vel = { y: baseSpeed + Math.random() * randomSpeed, x: (Math.random() - 0.5) * 10 }; break;
                default: pos = { x: Math.random() * 100, y: 110 }; vel = { y: -baseSpeed - Math.random() * randomSpeed, x: (Math.random() - 0.5) * 10 }; break;
            }
            setWords(w => [...w, { id: wordIdCounter.current++, text: pair.incorrect, correctText: pair.correct, pos, vel, isTransformed: false, isFadingOut: false }]);
        }

        // Движение слов
        setWords(ws => ws.map(w => ({ ...w, pos: { x: w.pos.x + w.vel.x * (deltaTime / 1000), y: w.pos.y + w.vel.y * (deltaTime / 1000) } })).filter(w => !w.isFadingOut));

        // Проверка столкновения с игроком (невидимая зона в центре)
        if (gameAreaRef.current) {
            const playerRect = { x: 50, y: 50, width: 20, height: 10 }; // Центральная зона
            for (const word of words) {
                if (!word.isTransformed && word.pos.x > playerRect.x - playerRect.width / 2 && word.pos.x < playerRect.x + playerRect.width / 2 && word.pos.y > playerRect.y - playerRect.height / 2 && word.pos.y < playerRect.y + playerRect.height / 2) {
                    // Если "неправильное" слово долетело до центра, засчитываем поражение
                    if (!hasFinished.current) {
                        playSound(SoundType.PLAYER_HIT);
                        hasFinished.current = true;
                        setPlayerHit(true);
                        setTimeout(onLose, 2000);
                    }
                }
            }
        }
    }, [words, onLose, playSound, settings]), status === 'playing');

    const handlePunishmentClick = (clickedWord: FlyingWord) => {
        const newPunishmentClicks = punishmentClicks + 1;
        setPunishmentClicks(newPunishmentClicks);
        
        playSound(SoundType.PUNISHMENT_CLICK);

        if (newPunishmentClicks === 1) {
            // Revert word to incorrect form and shake ego text
            setWords(ws => ws.map(w => w.id === clickedWord.id ? { 
                ...w, 
                isTransformed: false, 
                vel: { x: clickedWord.vel.x * -0.5, y: clickedWord.vel.y * -0.5 }
            } : w));
            setEgoState('cracked1');
        } else if (newPunishmentClicks === 2) {
            // Spawn a wave of new words
            const waveWords: FlyingWord[] = [];
            for (let i = 0; i < 5; i++) {
                const side = Math.floor(Math.random() * 4);
                const pair = FEMINITIVES_PAIRS[Math.floor(Math.random() * FEMINITIVES_PAIRS.length)];
                let pos, vel;
                switch(side) {
                    case 0: pos = { x: -10, y: Math.random() * 100 }; vel = { x: 10 + Math.random() * 5, y: (Math.random() - 0.5) * 10 }; break;
                    case 1: pos = { x: 110, y: Math.random() * 100 }; vel = { x: -10 - Math.random() * 5, y: (Math.random() - 0.5) * 10 }; break;
                    case 2: pos = { x: Math.random() * 100, y: -10 }; vel = { y: 10 + Math.random() * 5, x: (Math.random() - 0.5) * 10 }; break;
                    default: pos = { x: Math.random() * 100, y: 110 }; vel = { y: -10 - Math.random() * 5, x: (Math.random() - 0.5) * 10 }; break;
                }
                waveWords.push({ id: wordIdCounter.current++, text: pair.incorrect, correctText: pair.correct, pos, vel, isTransformed: false, isFadingOut: false });
            }
            setWords(ws => [...ws, ...waveWords]);
            setEgoState('cracked2');
        } else if (newPunishmentClicks >= 3) {
            // Shatter and lose
            setEgoState('shattered');
            if (!hasFinished.current) {
                hasFinished.current = true;
                setTimeout(onLose, 1500); // Wait for shatter animation
            }
        }
    };

    // Обработчик клика по слову
    const handleWordClick = (id: number) => {
        if (hasFinished.current) return;
        const wordIndex = words.findIndex(w => w.id === id);
        if (wordIndex === -1) return;

        const word = words[wordIndex];

        if (word.isTransformed) {
            handlePunishmentClick(word);
        } else {
            playSound(SoundType.TRANSFORM_SUCCESS);
            const newParticles: Particle[] = [];
            for (let i = 0; i < 8; i++) newParticles.push({ id: particleIdCounter.current++, pos: word.pos });
            setParticles(p => [...p, ...newParticles]);
            setTimeout(() => setParticles(p => p.filter(particle => !newParticles.some(np => np.id === particle.id))), 500);

            // "Превращаем" слово в правильный феминитив и отправляем его лететь обратно
            setWords(ws => ws.map(w => w.id === id ? { ...w, isTransformed: true, vel: {x: w.vel.x * -1.5, y: w.vel.y * -1.5} } : w));
            // Через 1.5 секунды удаляем слово
            setTimeout(() => {
                setWords(ws => ws.map(w => w.id === id ? { ...w, isFadingOut: true } : w));
            }, 1500);
        }
    };
    
    const renderEgoText = () => {
        const text = 'СУПЕРЭГОИНЯ';
        const baseClasses = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-center text-3xl pointer-events-none`;
        
        if (egoState === 'shattered') {
            return (
                <div className={`${baseClasses} text-white`}>
                    {text.split('').map((char, i) => (
                        <span key={i} className="inline-block ego-shatter-piece" style={{
                            '--dx': `${(Math.random() - 0.5) * 600}px`,
                            '--dy': `${(Math.random() - 0.5) * 600}px`,
                            '--rot': `${(Math.random() - 0.5) * 1080}deg`,
                            animationDelay: `${Math.random() * 0.1}s`,
                        } as React.CSSProperties}>{char}</span>
                    ))}
                </div>
            );
        }
        
        let egoClasses = 'text-white';
        if (egoState === 'cracked1') egoClasses = 'text-yellow-400 animate-[wiggle_0.5s_ease-in-out_2]';
        if (egoState === 'cracked2') egoClasses = 'text-orange-500 animate-[wiggle_0.3s_ease-in-out_3]';
        if (playerHit) egoClasses = 'text-red-500 animate-ping';
        
        return (
            <div className={baseClasses}>
                <h3 className={`transition-colors duration-500 ${egoClasses}`}>{text}</h3>
            </div>
        );
    };

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };

    return (
        <div ref={gameAreaRef} className="w-full h-full bg-[#1a1a1a] flex items-center justify-center relative overflow-hidden select-none">
            {status === 'won' && <BoitsovskiyKlubFeminitivovWinScreen onContinue={handleWinContinue} />}
            
            {status === 'playing' && <>
                <style>{`
                    @keyframes flicker { 0%, 100% { opacity: 0; } 50% { opacity: 0.1; } }
                    .flicker { animation: flicker 1.2s infinite steps(1); }
                    @keyframes poof { from { transform: scale(0) rotate(0deg); opacity: 1; } to { transform: scale(1) rotate(180deg); opacity: 0; } }
                    .particle { animation: poof 0.5s ease-out forwards; }
                    @keyframes ego-shatter-fly {
                        from { transform: translate(0,0) rotate(0) scale(1); opacity: 1; }
                        to { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0); opacity: 0; }
                    }
                    .ego-shatter-piece { animation: ego-shatter-fly 1.5s ease-out forwards; }
                    @keyframes wiggle { 
                        0%, 100% { transform: rotate(0deg) translateX(0); }
                        25% { transform: rotate(2deg) translateX(5px); }
                        75% { transform: rotate(-2deg) translateX(-5px); }
                    }
                `}</style>
                <div className="absolute inset-0 bg-yellow-300 flicker pointer-events-none"></div>
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none"></div>
                
                {renderEgoText()}

                {/* Рендеринг слов */}
                {words.map(w => (
                    <div key={w.id} onClick={() => handleWordClick(w.id)} className={`absolute p-2 cursor-pointer whitespace-nowrap ${w.isTransformed ? 'text-lime-400' : 'text-orange-400'}`} style={{ left: `${w.pos.x}%`, top: `${w.pos.y}%`, transform: 'translate(-50%, -50%)', transition: 'color 0.2s', fontSize: '1.2rem' }}>
                        {w.isTransformed ? w.correctText : w.text}
                    </div>
                ))}
                {/* Рендеринг частиц */}
                {particles.map((p, i) => (
                    <div key={p.id} className="absolute w-3 h-3 bg-lime-400 particle" style={{ left: `${p.pos.x}%`, top: `${p.pos.y}%`, transform: `translate(${Math.cos(i * 45) * 50}px, ${Math.sin(i * 45) * 50}px)` }}></div>
                ))}
                <div className="absolute top-20 text-3xl z-20 text-white">ВЫЖИВИ: {Math.ceil(timeLeft)}</div>
                {egoState === 'shattered' && <div className="absolute inset-0 bg-red-800/70 flex items-center justify-center text-7xl font-bold">ЭГО РАЗРУШЕНО</div>}
            </>}
        </div>
    );
};
