
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { FIGHT_CLUB_EASY, FIGHT_CLUB_MEDIUM, FIGHT_CLUB_HARD } from '../../data/wordData';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';

// --- Win Screen (Classic Horda Style) ---
export const BoitsovskiyKlubFeminitivovWinScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
    const { playSound } = useSettings();
    const [showButton, setShowButton] = useState(false);

    const flyingSymbols = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        symbol: ['♦', '★', '●', '■', '▲', '♀', '👊'][i % 7],
        style: {
            position: 'absolute', 
            top: `${Math.random() * 100}%`, 
            left: Math.random() > 0.5 ? '-10%' : '110%',
            '--destination-x': Math.random() > 0.5 ? '120vw' : '-120vw',
            transform: `scale(${0.5 + Math.random() * 1.5})`, 
            animation: `fly-across ${3 + Math.random() * 4}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`,
            fontSize: `${1 + Math.random() * 3}rem`, 
            color: ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff8c00'][i % 5],
            textShadow: '2px 2px 0 #000'
        } as React.CSSProperties,
    })), []);

    useEffect(() => {
        const t1 = setTimeout(() => { playSound(SoundType.WIN_BOITSOVSKIY); }, 500);
        const t2 = setTimeout(() => { playSound(SoundType.PLAYER_WIN); setShowButton(true); }, 2000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [playSound]);

    return (
        <div className="absolute inset-0 bg-black z-40 flex flex-col items-center justify-center overflow-hidden">
            <style>{`
                @keyframes fly-across { to { transform: translateX(var(--destination-x)) rotate(720deg); } }
                @keyframes horda-shake { 0% { opacity: 0; transform: scale(3); } 80% { opacity: 1; transform: scale(1); } 100% { transform: scale(1); } }
                .horda-final-text { animation: horda-shake 0.8s cubic-bezier(0.1, 0.7, 0.3, 1) forwards; text-shadow: 6px 6px 0 #000; color: #ffff00; }
                .bg-animate { background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff8c00); background-size: 200% 200%; animation: bg-pan 4s ease infinite; opacity: 0.4; }
                @keyframes bg-pan { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
            `}</style>
            <div className="absolute inset-0 bg-animate"></div>
            {flyingSymbols.map(s => <div key={s.id} style={s.style}>{s.symbol}</div>)}
            
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <h2 className="text-7xl md:text-9xl font-black horda-final-text mb-16 tracking-tighter">ХОРДА!</h2>
                {showButton && (
                    <button onClick={onContinue} className="pixel-button p-4 text-2xl bg-green-700 animate-[fadeIn_0.5s_forwards]">ПРОХОДИМ</button>
                )}
            </div>
        </div>
    );
};

// --- FIGHTING GAME COMPONENTS ---

const HealthBar: React.FC<{ hp: number, maxHp: number, isPlayer?: boolean, name: string }> = ({ hp, maxHp, isPlayer, name }) => {
    const percent = Math.max(0, (hp / maxHp) * 100);
    return (
        <div className={`flex flex-col w-full max-w-md ${isPlayer ? 'items-start' : 'items-end'}`}>
            <span className="text-yellow-300 font-bold text-lg mb-1">{name}</span>
            <div className={`w-full h-6 bg-gray-900 border-2 border-white relative ${isPlayer ? '' : 'flex justify-end'}`}>
                <div 
                    className={`h-full transition-all duration-200 ${isPlayer ? 'bg-green-500' : 'bg-red-600'}`}
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
        </div>
    );
};

const FistButton: React.FC<{ suffix: string, onClick: () => void, disabled: boolean, isChaos?: boolean }> = ({ suffix, onClick, disabled, isChaos }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`pixel-button w-24 h-24 md:w-32 md:h-32 flex items-center justify-center text-xl md:text-3xl font-bold transition-transform active:scale-90 
        ${disabled ? 'opacity-50 cursor-not-allowed' : isChaos ? 'bg-purple-600 hover:bg-purple-500 animate-pulse border-yellow-400 border-4' : 'hover:bg-gray-600 hover:scale-105'}`}
        style={isChaos ? { boxShadow: '0 0 15px #a855f7' } : {}}
    >
        {suffix}
    </button>
);

const ImpactEffect: React.FC<{ text: string, type: 'hit' | 'miss' | 'chaos' }> = ({ text, type }) => (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none w-full flex justify-center items-center">
        <style>{`
            @keyframes impact-pop { 
                0% { transform: scale(0.2); opacity: 0; } 
                50% { transform: scale(1.2); opacity: 1; } 
                100% { transform: scale(1); opacity: 0; } 
            }
        `}</style>
        <div 
            className={`font-black whitespace-nowrap text-center px-4 py-2 ${type === 'hit' ? 'text-green-400' : type === 'chaos' ? 'text-purple-400' : 'text-red-500'}`}
            // Dynamic text sizing based on length to keep it visible
            style={{ 
                animation: 'impact-pop 0.6s ease-out forwards', 
                textShadow: '4px 4px 0 #000, -2px -2px 0 #000', 
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '4px solid white',
                fontSize: text.length > 10 ? '2rem' : '4rem', // Smaller font for long words like 'ПСИХОЛОГИНЯ'
                lineHeight: '1.1'
            }}
        >
            {text}
        </div>
    </div>
);

// Helper to generate nonsense suffix
const generateChaosSuffix = () => {
    const chars = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЫЭЮЯ";
    const len = 2 + Math.floor(Math.random() * 3); // 2-4 chars
    let res = "-";
    for(let i=0; i<len; i++) res += chars[Math.floor(Math.random() * chars.length)];
    return res;
};

export const BoitsovskiyKlubFeminitivov: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { playSound } = useSettings();
    const { character } = useSession();
    const { isInstructionModalVisible } = useNavigation();

    // Game Settings
    const settings = useMemo(() => {
        let reactionTime = 3000;
        let enemyHp = 10;
        if (character === Character.KANILA) { reactionTime = 3500; enemyHp = 8; } // Easy
        if (character === Character.BLACK_PLAYER) { reactionTime = 2000; enemyHp = 15; } // Hard
        return { reactionTime, enemyHp, playerHp: 3 };
    }, [character]);

    // State
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [enemyHp, setEnemyHp] = useState(settings.enemyHp);
    const [playerHp, setPlayerHp] = useState(settings.playerHp);
    const [timer, setTimer] = useState(settings.reactionTime);
    const [currentWordData, setCurrentWordData] = useState<any>(null);
    const [options, setOptions] = useState<{text: string, isChaos: boolean}[]>([]);
    const [visualState, setVisualState] = useState<'idle' | 'punch_left' | 'punch_right' | 'punch_mid' | 'hurt' | 'enemy_attack'>('idle');
    const [impact, setImpact] = useState<{ text: string, type: 'hit' | 'miss' | 'chaos' } | null>(null);
    
    // Chaos Button Logic
    const [chaosButtonUsed, setChaosButtonUsed] = useState(false);
    const [roundCount, setRoundCount] = useState(0);
    
    const hasFinished = useRef(false);

    // Prepare Round
    const startRound = useCallback(() => {
        if (hasFinished.current) return;
        
        let pool: any[] = [];
        const roll = Math.random();

        // Difficulty balancing based on character
        if (character === Character.KANILA) {
            // 90% Easy, 10% Hard
            pool = roll < 0.9 ? FIGHT_CLUB_EASY : FIGHT_CLUB_HARD;
        } else if (character === Character.SEXISM) {
            // 50% Medium, 50% Hard
            pool = roll < 0.5 ? FIGHT_CLUB_MEDIUM : FIGHT_CLUB_HARD;
        } else if (character === Character.BLACK_PLAYER) {
            // 100% Hard/Absurd
            pool = FIGHT_CLUB_HARD;
        } else {
            pool = FIGHT_CLUB_MEDIUM; // Fallback
        }

        const data = pool[Math.floor(Math.random() * pool.length)];
        setCurrentWordData(data);
        
        // Options generation
        let currentOptions = [
            { text: data.correct, isChaos: false },
            { text: data.traps[0], isChaos: false },
            { text: data.traps[1] || data.traps[0], isChaos: false }
        ];

        // Check if Chaos Button should appear (random chance if not used yet)
        if (!chaosButtonUsed && Math.random() < 0.2 + (roundCount * 0.05)) {
            const chaosSuffix = generateChaosSuffix();
            const trapIndex = 1 + Math.floor(Math.random() * 2); // index 1 or 2
            currentOptions[trapIndex] = { text: chaosSuffix, isChaos: true };
        }

        // Shuffle options
        currentOptions = currentOptions.sort(() => 0.5 - Math.random());
        setOptions(currentOptions);
        
        setTimer(settings.reactionTime);
        setVisualState('idle');
        setImpact(null);
        setRoundCount(r => r + 1);
    }, [settings.reactionTime, character, chaosButtonUsed, roundCount]);

    // Initial Start
    useEffect(() => {
        if (!isInstructionModalVisible && status === 'playing' && !currentWordData) {
            startRound();
        }
    }, [isInstructionModalVisible, status, startRound, currentWordData]);

    // Game Loop (Timer)
    useGameLoop((deltaTime) => {
        if (status !== 'playing' || hasFinished.current || visualState !== 'idle' || isInstructionModalVisible) return;

        setTimer(t => {
            const newTime = t - deltaTime;
            if (newTime <= 0) {
                handlePlayerMiss(true); // Time out = miss
                return 0;
            }
            return newTime;
        });
    }, status === 'playing' && !isInstructionModalVisible);

    const handlePlayerHit = (option: { text: string, isChaos: boolean }) => {
        if (visualState !== 'idle') return;

        if (option.isChaos) {
            // CHAOS BUTTON EFFECT
            setChaosButtonUsed(true);
            playSound(SoundType.TRANSFORM_SUCCESS);
            
            if (character === Character.KANILA) {
                // Instant Win
                setImpact({ text: 'ФАТАЛИТИ!', type: 'chaos' });
                hasFinished.current = true;
                setTimeout(() => setStatus('won'), 1000);
            } else if (character === Character.SEXISM) {
                // Enemy Heals (More words)
                setImpact({ text: 'БОЛЬШЕ СЛОВ!', type: 'miss' });
                setEnemyHp(h => h + 5); // Add HP
                setTimeout(startRound, 1000);
            } else if (character === Character.BLACK_PLAYER) {
                // Instant Loss
                setImpact({ text: 'САМОЛИКВИДАЦИЯ', type: 'miss' });
                hasFinished.current = true;
                setTimeout(() => {
                    setStatus('lost');
                    onLose();
                }, 1000);
            }
            return;
        }

        if (option.text === currentWordData.correct) {
            // SUCCESS
            playSound(SoundType.PLAYER_HIT); // Punch sound
            setVisualState('punch_mid'); 
            // Show full word instead of just "УДАР!"
            setImpact({ text: currentWordData.full || 'УДАР!', type: 'hit' });
            
            const newEnemyHp = enemyHp - 1;
            setEnemyHp(newEnemyHp);

            if (newEnemyHp <= 0) {
                hasFinished.current = true;
                setTimeout(() => setStatus('won'), 1000); // Wait for hit animation
            } else {
                setTimeout(startRound, 800); // Fast tempo
            }
        } else {
            // WRONG SUFFIX
            handlePlayerMiss(false);
        }
    };

    const handlePlayerMiss = (isTimeout: boolean) => {
        playSound(SoundType.PLAYER_LOSE); // Hit sound
        setVisualState('enemy_attack');
        setImpact({ text: isTimeout ? 'МЕДЛЕННО!' : 'ОШИБКА!', type: 'miss' });
        
        // Short delay before showing player hurt state
        setTimeout(() => {
            setVisualState('hurt');
            const newPlayerHp = playerHp - 1;
            setPlayerHp(newPlayerHp);

            if (newPlayerHp <= 0) {
                hasFinished.current = true;
                setTimeout(() => {
                    setStatus('lost');
                    onLose();
                }, 1000);
            } else {
                setTimeout(startRound, 1000);
            }
        }, 300);
    };

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };

    // Render Logic
    const timerPercent = (timer / settings.reactionTime) * 100;
    
    // Background Enemy
    const EnemySprite = () => (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ${visualState === 'punch_mid' ? 'scale-90 opacity-50 blur-sm' : visualState === 'enemy_attack' ? 'scale-150' : 'scale-100 animate-pulse'}`}>
            {/* Display the EMOJI of the current word concept */}
            <div className="text-[150px] md:text-[200px] leading-none select-none filter drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                {currentWordData?.emoji || '👹'}
            </div>
        </div>
    );

    // Player Hands
    const PlayerHands = () => {
        if (visualState === 'idle') return null;
        if (visualState === 'punch_mid') return <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[150px] animate-[punch-up_0.2s_ease-out]">👊</div>;
        if (visualState === 'enemy_attack' || visualState === 'hurt') return null; // Hide hands when getting hit
        return null;
    };

    // --- Dynamic Background Logic ---
    // Calculate ratio: How much player is winning? 
    // If Player HP is high and Enemy low -> ratio > 1 (Blue/Green takes over)
    // If Enemy HP is high -> ratio < 1 (Red takes over)
    const totalHp = playerHp + enemyHp;
    const playerRatio = totalHp > 0 ? (playerHp / (settings.playerHp + settings.enemyHp)) * 100 : 50; 
    // Shift the gradient stop based on advantage.
    // 50% is neutral. Higher means player advantage (blue pushes red back).
    // Let's amplify it a bit visually.
    const gradientStop = 30 + (playerHp / settings.playerHp) * 40; // 30% to 70% range

    const dynamicBgStyle: React.CSSProperties = {
        background: `linear-gradient(110deg, #1e3a8a ${gradientStop - 10}%, #7f1d1d ${gradientStop + 10}%)`,
        transition: 'background 0.5s ease-in-out'
    };

    const flashOverlayStyle: React.CSSProperties = {
        opacity: visualState === 'punch_mid' ? 0.6 : visualState === 'hurt' ? 0.6 : 0,
        backgroundColor: visualState === 'punch_mid' ? '#4ade80' : '#ef4444', // Green flash on hit, Red on hurt
        transition: 'opacity 0.1s'
    };

    return (
        <div className="w-full h-full relative overflow-hidden flex flex-col justify-between p-4 select-none" style={dynamicBgStyle}>
            <style>{`
                @keyframes shake { 0%, 100% { transform: translate(0,0); } 25% { transform: translate(-10px, 10px); } 75% { transform: translate(10px, -10px); } }
                .screen-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
                @keyframes punch-up { 0% { transform: translate(-50%, 100%); } 50% { transform: translate(-50%, -20%); } 100% { transform: translate(-50%, 0); } }
            `}</style>

            {status === 'won' && <BoitsovskiyKlubFeminitivovWinScreen onContinue={handleWinContinue} />}
            {status === 'lost' && <div className="absolute inset-0 bg-red-900/90 z-50 flex items-center justify-center text-6xl font-black text-black">НОКАУТ!</div>}

            {/* Flash Effect Layer */}
            <div className={`absolute inset-0 pointer-events-none z-0`} style={flashOverlayStyle}></div>
            {/* Shake Effect Layer (Wrapper) */}
            <div className={`absolute inset-0 pointer-events-none ${visualState === 'punch_mid' || visualState === 'hurt' ? 'screen-shake' : ''}`}></div>

            {status === 'playing' && (
                <>
                    {/* Top HUD: Health Bars */}
                    <div className="w-full flex justify-between items-start z-10 gap-4">
                        <HealthBar name="СУПЕРЭГО" hp={playerHp} maxHp={settings.playerHp} isPlayer />
                        <HealthBar name="ПАТРИАРХАТ" hp={enemyHp} maxHp={settings.enemyHp} />
                    </div>

                    {/* Center Stage */}
                    <div className="flex-grow relative flex items-center justify-center z-10">
                        <EnemySprite />
                        
                        {/* Word Display */}
                        {visualState === 'idle' && currentWordData && (
                            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 p-4 border-4 border-red-600 rounded-lg transform rotate-[-2deg]">
                                <span className="text-4xl md:text-6xl font-black text-white tracking-widest">{currentWordData.root}</span>
                            </div>
                        )}
                        
                        {impact && <ImpactEffect text={impact.text} type={impact.type} />}
                        <PlayerHands />
                    </div>

                    {/* Bottom Controls: Suffixes */}
                    <div className="w-full flex flex-col items-center gap-2 z-10 mb-4">
                        {/* Timer Bar */}
                        <div className="w-full max-w-2xl h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                            <div 
                                className={`h-full transition-all duration-75 ${timerPercent < 30 ? 'bg-red-500' : 'bg-yellow-400'}`} 
                                style={{ width: `${timerPercent}%` }}
                            ></div>
                        </div>

                        <div className="flex gap-4 md:gap-8 mt-4 justify-center">
                            {options.map((option, i) => (
                                <FistButton 
                                    key={i} 
                                    suffix={option.text} 
                                    onClick={() => handlePlayerHit(option)} 
                                    disabled={visualState !== 'idle'} 
                                    isChaos={option.isChaos}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
