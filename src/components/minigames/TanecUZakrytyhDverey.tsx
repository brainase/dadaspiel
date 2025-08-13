
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PixelArt } from '../core/PixelArt';
import { GUARD_ART_DATA, MINI_GUARD_ART } from '../../miscArt';
import { MINI_CHARACTER_ART_MAP, CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { useSession, useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character } from '../../../types';
import { GenericWinScreen } from '../core/GenericWinScreen';

// Interfaces and Constants
interface Icon {
  id: number;
  type: 'player' | 'guard' | 'player_booster' | 'guard_booster';
  x: number;
  y: number;
  life: number;
  rotation: number;
}
interface Feedback {
  id: number;
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

// Sub-components
const MuseumBackground = () => (
    <div className="absolute inset-0 bg-gradient-to-t from-[#2c222e] to-[#4a3a54] overflow-hidden">
        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-[#3d3342]"></div>
        {/* Door */}
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[35%] h-[80%] bg-[#5c4f6b] pixel-border border-8 border-[#3d3342]">
             <div className="w-1/2 h-full float-left border-r-4 border-[#3d3342] p-8 box-border">
                <div className="w-8 h-8 rounded-full bg-yellow-600"></div>
             </div>
             <div className="w-1/2 h-full float-right border-l-4 border-[#3d3342] p-8 box-border">
                 <div className="w-8 h-8 rounded-full bg-yellow-600"></div>
             </div>
        </div>
        <div className="absolute top-[22%] left-1/2 -translate-x-1/2 text-2xl text-yellow-300">МУЗЕЙ</div>
    </div>
);

const ScoreBar = ({ name, score, maxScore, isPlayer }: { name: string, score: number, maxScore: number, isPlayer: boolean }) => {
  const percentage = Math.max(0, Math.min(100, (Math.abs(score) / maxScore) * 100));
  const barClass = isPlayer ? 'bg-blue-500' : 'bg-red-500';
  const textClass = isPlayer ? 'text-left' : 'text-right';
  const nameClass = `absolute top-0 px-2 text-white text-lg ${isPlayer ? 'left-0' : 'right-0'}`;

  return (
    <div className={`w-[45%] h-8 bg-black/50 pixel-border relative ${textClass}`}>
      <div className={nameClass}>{name}</div>
      <div className={`h-full ${barClass} transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
      <div className="absolute inset-0 text-center font-bold text-white text-xl">{score}</div>
    </div>
  );
};

const CharacterDisplay = ({ artData, pose, isHit, isDancing, isPlayer }: { artData: string[], pose: number, isHit: boolean, isDancing: boolean, isPlayer: boolean }) => {
    const animationClass = isHit ? 'animate-hit' : isDancing ? 'animate-dance' : '';
    const sideClass = isPlayer ? 'left-8' : 'right-8';
    const transform = `translateY(${Math.sin(pose) * 5}px) rotate(${Math.cos(pose) * 2}deg) ${isPlayer ? '' : 'scaleX(-1)'}`;

    return (
        <div className={`absolute bottom-8 ${sideClass} ${animationClass}`} style={{ transform }}>
             <PixelArt artData={artData} palette={PIXEL_ART_PALETTE} pixelSize={6} />
        </div>
    );
};

const GameInstructions: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 text-center text-white p-4">
        <h2 className="text-3xl mb-4 text-yellow-300">ПРАВИЛА ТАНЦ-БАТТЛА</h2>
        <div className="text-left max-w-lg space-y-3 text-base">
            <p><strong>Цель:</strong> Затанцевать вахтёршу, чтобы она сдалась.</p>
            <p className="text-blue-300"><strong>Фаза игрока (ВАШ ХОД):</strong><br/>
            - Кликай по своим иконкам, чтобы набрать очки.<br/>
            - Ошибочный клик по иконке вахтёрши даёт очки ей.</p>
            <p className="text-red-300"><strong>Фаза вахтёрши (ХОД ВАХТЁРШИ):</strong><br/>
            - Мешай ей! Кликай по её иконкам, чтобы набрать очки.<br/>
            - Ошибочный клик по своей иконке даёт очки ей.</p>
            <p><strong>Бустеры</strong> (✨, 🚨) удваивают очки.</p>
            <p>У кого больше очков в конце, тот и победил.</p>
        </div>
        <button onClick={onStart} className="pixel-button p-4 text-2xl mt-6">НАЧАТЬ ТАНЕЦ</button>
    </div>
);


// Main Component
export const TanecUZakrytyhDverey: React.FC<{ onWin: () => void; onLose: () => void; }> = ({ onWin, onLose }) => {
    const { character } = useSession();
    const { playSound } = useSettings();
    
    const settings = useMemo(() => {
        const baseSettings = { phaseDuration: 7, maxScore: 15, iconLife: 1.5 };
        switch(character) {
            case Character.KANILA: // Easy
                return { phaseDuration: 9, maxScore: 12, iconLife: 1.8 };
            case Character.BLACK_PLAYER: // Hard
                return { phaseDuration: 6, maxScore: 18, iconLife: 1.2 };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [character]);

    // State
    const [phase, setPhase] = useState<'intro' | 'player' | 'guard' | 'end'>('intro');
    const [round, setRound] = useState(0); // 0 is intro, 1-4 are game rounds
    const [playerScore, setPlayerScore] = useState(0);
    const [guardScore, setGuardScore] = useState(0);
    const [icons, setIcons] = useState<Icon[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(3);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

    const [playerPose, setPlayerPose] = useState(0);
    const [guardPose, setGuardPose] = useState(0);
    const [playerIsHit, setPlayerIsHit] = useState(false);
    const [guardIsHit, setGuardIsHit] = useState(false);

    const iconId = useRef(0);
    const feedbackId = useRef(0);
    const timeSinceSpawn = useRef(0);
    const hasCalledOnLose = useRef(false);
    
    const charArt = useMemo(() => CHARACTER_ART_MAP[character || "Канила Дозловский"], [character]);
    const miniCharArt = useMemo(() => MINI_CHARACTER_ART_MAP[character || "Канила Дозловский"], [character]);

    const IconContent = useCallback(({ type }: { type: Icon['type'] }) => {
        switch (type) {
            case 'player':
                return <PixelArt artData={miniCharArt} palette={PIXEL_ART_PALETTE} pixelSize={3} />;
            case 'guard':
                return <PixelArt artData={MINI_GUARD_ART} palette={PIXEL_ART_PALETTE} pixelSize={3} />;
            case 'player_booster':
                return <span className="text-4xl text-yellow-300 filter drop-shadow-[2px_2px_0_#000]">✨</span>;
            case 'guard_booster':
                return <span className="text-4xl text-red-500 filter drop-shadow-[2px_2px_0_#000]">🚨</span>;
            default:
                return null;
        }
    }, [miniCharArt]);
    
    // Phase management
    useEffect(() => {
        if (status !== 'playing' || round === 0) return;

        const timer = setTimeout(() => {
            setRound(r => r + 1);
        }, settings.phaseDuration * 1000);

        return () => clearTimeout(timer);
    }, [round, status, settings.phaseDuration]);

    // Update phase based on round
    useEffect(() => {
        if (status !== 'playing') return;

        if (round > 0 && round < 5) {
            setPhaseTimeLeft(settings.phaseDuration);
        }

        switch(round) {
            case 1:
            case 3:
                setPhase('player');
                break;
            case 2:
            case 4:
                setPhase('guard');
                break;
            case 5:
                setPhase('end');
                if (playerScore > guardScore) {
                    playSound(SoundType.WIN_TANEC);
                    setStatus('won');
                } else {
                    setStatus('lost');
                }
                break;
        }
    }, [round, playerScore, guardScore, status, settings.phaseDuration, playSound]);

    // Game Loop
    useGameLoop(useCallback((deltaTime) => {
        if (status !== 'playing' || phase === 'intro' || phase === 'end') return;
        
        const dtSec = deltaTime / 1000;
        setPhaseTimeLeft(t => Math.max(0, t - dtSec));
        setPlayerPose(p => p + dtSec * 5);
        setGuardPose(p => p + dtSec * 5);

        // Icon spawning
        timeSinceSpawn.current += deltaTime;
        if (timeSinceSpawn.current > 600 - round * 50) {
            timeSinceSpawn.current = 0;
            const rand = Math.random();
            let type: Icon['type'];
            if (rand < 0.05) type = 'player_booster';
            else if (rand < 0.1) type = 'guard_booster';
            else if (rand < 0.6) type = phase === 'player' ? 'player' : 'guard';
            else type = phase === 'player' ? 'guard' : 'player';

            setIcons(prev => [...prev, {
                id: iconId.current++,
                type: type,
                x: 10 + Math.random() * 80,
                y: 20 + Math.random() * 50,
                life: settings.iconLife - round * 0.1,
                rotation: (Math.random() - 0.5) * 30
            }]);
        }

        // Icon & Feedback lifetime
        setIcons(prev => prev.map(i => ({...i, life: i.life - dtSec})).filter(i => i.life > 0));
        setFeedback(prev => prev.map(f => ({...f, life: f.life - dtSec, y: f.y - 10 * dtSec})).filter(f => f.life > 0));

    }, [phase, status, round, settings.iconLife]), status === 'playing');

    const handleIconClick = (clickedIcon: Icon) => {
        if (phase === 'intro' || phase === 'end') return;
        
        const isBooster = clickedIcon.type.includes('booster');
        const points = isBooster ? 2 : 1;
        let scoreChangeForPlayer = 0;
        let color = 'text-gray-400';

        if (phase === 'player') {
            if (clickedIcon.type.startsWith('player')) {
                setPlayerScore(s => s + points);
                scoreChangeForPlayer = points;
                setGuardIsHit(true);
                setTimeout(() => setGuardIsHit(false), 200);
                playSound(SoundType.ITEM_CATCH_GOOD);
                color = 'text-blue-400';
            } else {
                setGuardScore(s => s + points);
                scoreChangeForPlayer = -points;
                setPlayerIsHit(true);
                setTimeout(() => setPlayerIsHit(false), 200);
                playSound(SoundType.ITEM_CATCH_BAD);
                color = 'text-red-400';
            }
        } else { // Guard's phase
             if (clickedIcon.type.startsWith('guard')) {
                setPlayerScore(s => s + points);
                scoreChangeForPlayer = points;
                setGuardIsHit(true);
                setTimeout(() => setGuardIsHit(false), 200);
                playSound(SoundType.ITEM_CATCH_GOOD);
                color = 'text-blue-400';
            } else {
                setGuardScore(s => s + points);
                scoreChangeForPlayer = -points;
                setPlayerIsHit(true);
                setTimeout(() => setPlayerIsHit(false), 200);
                playSound(SoundType.ITEM_CATCH_BAD);
                color = 'text-red-400';
            }
        }
        
        setFeedback(prev => [...prev, {
            id: feedbackId.current++,
            text: `${scoreChangeForPlayer > 0 ? '+' : ''}${scoreChangeForPlayer}`,
            x: clickedIcon.x,
            y: clickedIcon.y,
            life: 1,
            color
        }]);
        setIcons(prev => prev.filter(i => i.id !== clickedIcon.id));
    };

    // Effect for handling the lose condition side-effect
    useEffect(() => {
        if (status === 'lost' && !hasCalledOnLose.current) {
            hasCalledOnLose.current = true;
            onLose();
        }
    }, [status, onLose]);

    const isPlayerTurn = phase === 'player';
    const isGuardTurn = phase === 'guard';

    const renderGame = () => (
        <>
            <div className="absolute top-20 w-full flex justify-between px-4 z-20">
                <ScoreBar name={character || "Игрок"} score={playerScore} maxScore={settings.maxScore} isPlayer={true} />
                <div className="text-center text-white">
                    <div className="text-xl">{isPlayerTurn ? "ВАШ ХОД" : isGuardTurn ? "ХОД ВАХТЁРШИ" : "ПРИГОТОВЬТЕСЬ"}</div>
                    <div className="text-4xl font-bold">{Math.ceil(phaseTimeLeft)}</div>
                </div>
                <ScoreBar name="Вахтёрша" score={guardScore} maxScore={settings.maxScore} isPlayer={false} />
            </div>

            <CharacterDisplay artData={charArt} pose={playerPose} isHit={playerIsHit} isDancing={isPlayerTurn} isPlayer={true} />
            <CharacterDisplay artData={GUARD_ART_DATA} pose={guardPose} isHit={guardIsHit} isDancing={isGuardTurn} isPlayer={false} />
            
            {icons.map(icon => (
                <div 
                    key={icon.id}
                    className="absolute cursor-pointer transition-opacity duration-200"
                    style={{
                        left: `${icon.x}%`,
                        top: `${icon.y}%`,
                        transform: `translate(-50%, -50%) rotate(${icon.rotation}deg)`,
                        opacity: icon.life / settings.iconLife
                    }}
                    onClick={() => handleIconClick(icon)}
                    onTouchStart={() => handleIconClick(icon)}
                >
                    <IconContent type={icon.type} />
                </div>
            ))}
            {feedback.map(f => (
                <div key={f.id} className={`absolute font-bold text-2xl pointer-events-none ${f.color}`} style={{
                    left: `${f.x}%`, top: `${f.y}%`, opacity: f.life, transform: 'translate(-50%, -50%)'
                }}>{f.text}</div>
            ))}
        </>
    );

    if (status === 'won') {
        return <GenericWinScreen title="ПРИХОДИТЕ ЗАВТРА!" text="Но не опаздывайте!" buttonText="КУПИТЬ ЧАСЫ" onContinue={onWin} />;
    }
    if (status === 'lost') {
        return null;
    }

    return (
        <div className="w-full h-full relative overflow-hidden">
            <MuseumBackground />
            
            {phase === 'intro' ? (
                <GameInstructions onStart={() => setRound(1)} />
            ) : (
                renderGame()
            )}
        </div>
    );
};
