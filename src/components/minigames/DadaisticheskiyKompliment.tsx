import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, useSettings } from '../../context/GameContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import { DADA_VOCABULARY } from '../../data/wordData';
import { SoundType } from '../../utils/AudioEngine';
import { MinigameHUD } from '../core/MinigameHUD';
import { InstructionModal } from '../core/InstructionModal';
import { instructionData } from '../../data/instructionData';

const DADA_COLORS = ['text-cyan-300', 'text-orange-300', 'text-lime-400', 'text-yellow-300', 'text-pink-500', 'text-fuchsia-400'];
const DADA_COLOR_MAP: { [key: string]: string } = {
    'text-cyan-300': 'bg-cyan-500', 'text-orange-300': 'bg-orange-500', 'text-lime-400': 'bg-lime-500', 'text-yellow-300': 'bg-yellow-400', 'text-pink-500': 'bg-pink-500', 'text-fuchsia-400': 'bg-fuchsia-500',
};

interface DadaWord { id: number; text: string; type: 'shirota' | 'glubina'; pos: { x: number; y: number }; vel: { x: number; y: number }; rot: number; rotVel: number; scale: number; }

type DadaWinState = 'shirota' | 'glubina' | 'timeup';

export const DadaisticheskiyKomplimentWinScreen: React.FC<{ onContinue: () => void; winState: DadaWinState | null }> = ({ onContinue, winState }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        if (winState) {
            playSound(SoundType.WIN_KOMPLIMENT);
        }
    }, [winState, playSound]);

    let title = "", text = "", icon = "";
    if (winState === 'shirota' || winState === 'glubina') { title = "ПОЗНАНИЕ!"; text = "Дар Абсурдистского Обожечки: +1 Жизнь!"; icon = '👁️'; }
    else if (winState === 'timeup') { title = "ВРЕМЯ ВЫШЛО"; text = "Милость Дада-Ламы: Жизни восстановлены до 3."; icon = '🦙'; }
    
    if (!winState) return null;

    return (
         <div className="absolute inset-0 bg-black bg-opacity-80 z-40 flex flex-col items-center justify-center text-center animate-[fadeIn_0.5s_ease-in]">
            <div className="text-8xl mb-4 animate-pulse">{icon}</div><h2 className="text-5xl text-yellow-300 mb-4">{title}</h2><p className="text-2xl">{text}</p>
            <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800">ПРОХОДИМ</button>
        </div>
    )
};

export const DadaisticheskiyKompliment: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { addLife, lives } = useSession();
    const { logEvent, playSound } = useSettings();
    const containerRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);
    const attractors = useRef({ shirota: { x: 20, y: 50 }, glubina: { x: 80, y: 50 } }).current;
    
    const [words, setWords] = useState<DadaWord[]>([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [progress, setProgress] = useState({ shirota: 0, glubina: 0 });
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
    const [winState, setWinState] = useState<DadaWinState | null>(null);
    const [groupColors, setGroupColors] = useState({ shirota: 'text-cyan-300', glubina: 'text-orange-300' });
    const [pulsatingWordIds, setPulsatingWordIds] = useState<number[]>([]);
    const [showInstructions, setShowInstructions] = useState(true);
    const wordsRef = useRef(words);
    useEffect(() => { wordsRef.current = words; }, [words]);

    useEffect(() => {
        const shuffled = [...DADA_VOCABULARY].sort(() => 0.5 - Math.random());
        const selectedWords = shuffled.slice(0, 20);
        const initialWords: DadaWord[] = selectedWords.map((text, i) => ({
            id: i, text: text.toUpperCase(), type: i < 10 ? 'shirota' : 'glubina',
            pos: { x: 50 + (Math.random() - 0.5) * 50, y: 50 + (Math.random() - 0.5) * 50 },
            vel: { x: (Math.random() - 0.5) * 0.05, y: (Math.random() - 0.5) * 0.05 },
            rot: Math.random() * 360, rotVel: (Math.random() - 0.5) * 0.02, scale: 1,
        }));
        setWords(initialWords);
    }, []);
    
    useEffect(() => {
        if (hasFinished.current || showInstructions) { setPulsatingWordIds([]); return; }
        const pulsationInterval = setInterval(() => {
            const currentWords = wordsRef.current;
            const shirotaWords = currentWords.filter(w => w.type === 'shirota');
            const glubinaWords = currentWords.filter(w => w.type === 'glubina');
            const pulsatingShirota = shirotaWords.sort(() => 0.5 - Math.random()).slice(0, 2).map(w => w.id);
            const pulsatingGlubina = glubinaWords.sort(() => 0.5 - Math.random()).slice(0, 2).map(w => w.id);
            setPulsatingWordIds([...pulsatingShirota, ...pulsatingGlubina]);
        }, 2000);
        return () => clearInterval(pulsationInterval);
    }, [hasFinished.current, showInstructions]);

    useEffect(() => {
        if (hasFinished.current || showInstructions) return;
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timer);
                    if (!hasFinished.current) {
                        hasFinished.current = true;
                        logEvent("Dada Kompliment: Time's up. Restoring lives to 3.");
                        const livesToAdd = Math.max(0, 3 - lives);
                        if (livesToAdd > 0) addLife(livesToAdd);
                        else if (lives > 3) addLife(3 - lives);
                        setWinState('timeup');
                    }
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [lives, addLife, logEvent, showInstructions]);

    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current) return;
        setWords(currentWords => currentWords.map(word => {
            if (pulsatingWordIds.includes(word.id)) {
                const newScale = 1.2 + Math.sin(Date.now() / 80) * 0.3;
                return { ...word, scale: newScale };
            }
            let finalVel = { ...word.vel };
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const wordPixelPos = { x: word.pos.x / 100 * rect.width, y: word.pos.y / 100 * rect.height };
                const dist = Math.sqrt(Math.pow(mousePos.x - wordPixelPos.x, 2) + Math.pow(mousePos.y - wordPixelPos.y, 2));
                if (dist < 120) {
                    const repulsionForce = 0.005 * (120 - dist);
                    finalVel.x += (wordPixelPos.x - mousePos.x) / dist * repulsionForce;
                    finalVel.y += (wordPixelPos.y - mousePos.y) / dist * repulsionForce;
                }
            }
            const attractor = word.type === 'shirota' ? attractors.shirota : attractors.glubina;
            const attractorDist = Math.sqrt(Math.pow(attractor.x - word.pos.x, 2) + Math.pow(attractor.y - word.pos.y, 2));
            if (attractorDist > 1) {
                 finalVel.x += (attractor.x - word.pos.x) / attractorDist * 0.00001 * deltaTime;
                 finalVel.y += (attractor.y - word.pos.y) / attractorDist * 0.00001 * deltaTime;
            }
            finalVel.x *= 0.99; finalVel.y *= 0.99;
            let newX = word.pos.x + finalVel.x * (deltaTime / 16); let newY = word.pos.y + finalVel.y * (deltaTime / 16);
            if (newX < 5 || newX > 95) { newX = Math.max(5, Math.min(95, newX)); finalVel.x *= -1; }
            if (newY < 15 || newY > 95) { newY = Math.max(15, Math.min(95, newY)); finalVel.y *= -1; }
            const newRot = word.rot + word.rotVel * deltaTime;
            return { ...word, pos: { x: newX, y: newY }, vel: finalVel, rot: newRot, scale: 1 };
        }));
    }, [mousePos, pulsatingWordIds, attractors]), !hasFinished.current && !showInstructions);
    
    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (containerRef.current) {
            const pointer = 'touches' in e ? e.touches[0] : e;
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({ x: pointer.clientX - rect.left, y: pointer.clientY - rect.top });
        }
    };

    const handleClick = (word: DadaWord) => {
        if (!pulsatingWordIds.includes(word.id) || hasFinished.current) return;
        
        playSound(SoundType.ITEM_PLACE_SUCCESS);

        const newProgress = { ...progress };
        let isWin = false;
        if (word.type === 'shirota') {
            newProgress.shirota = Math.min(100, newProgress.shirota + 10);
            if(newProgress.shirota >= 100) { setWinState('shirota'); isWin = true; }
        } else {
            newProgress.glubina = Math.min(100, newProgress.glubina + 10);
            if (newProgress.glubina >= 100) { setWinState('glubina'); isWin = true; }
        }
        setProgress(newProgress);
        setWords(ws => ws.filter(w => w.id !== word.id));
        setGroupColors(currentColors => {
            const newColors = { ...currentColors }; const otherGroup = word.type === 'shirota' ? 'glubina' : 'shirota'; const otherColor = newColors[otherGroup]; let newColor;
            do { newColor = DADA_COLORS[Math.floor(Math.random() * DADA_COLORS.length)]; } while (newColor === newColors[word.type] || newColor === otherColor);
            newColors[word.type] = newColor; return newColors;
        });

        if (isWin) {
            hasFinished.current = true;
            logEvent(`Dada Kompliment: ${word.type} won! Granting 4th life.`);
            const livesToAdd = Math.max(0, 4 - lives);
            if (livesToAdd > 0) addLife(livesToAdd);
        }
    };
    
    const shirotaBgColor = DADA_COLOR_MAP[groupColors.shirota] || 'bg-gray-500';
    const glubinaBgColor = DADA_COLOR_MAP[groupColors.glubina] || 'bg-gray-500';

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };
    
    const instruction = instructionData['2-3'];
    const InstructionContent = instruction.content;

    return (
        <div 
            ref={containerRef} 
            onMouseMove={handlePointerMove} 
            onTouchMove={handlePointerMove}
            onTouchStart={handlePointerMove}
            className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-950 flex flex-col items-center p-4 relative overflow-hidden select-none"
        >
            {winState && <DadaisticheskiyKomplimentWinScreen onContinue={handleWinContinue} winState={winState} />}
            
            {showInstructions && (
                <InstructionModal title={instruction.title} onStart={() => setShowInstructions(false)}>
                    <InstructionContent />
                </InstructionModal>
            )}

            {!showInstructions && <>
                <MinigameHUD>
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-2">
                            <span className={`text-lg ${groupColors.shirota}`}>ШИРОТА</span>
                            <span className="text-2xl font-bold">Время: {timeLeft}</span>
                            <span className={`text-lg ${groupColors.glubina}`}>ГЛУБИНА</span>
                        </div>
                        <div className="flex gap-2 w-full h-8 pixel-border bg-black">
                            <div className={`h-full ${shirotaBgColor}`} style={{ width: `${progress.shirota}%`, transition: 'width 0.3s ease' }}></div>
                            <div className="flex-grow"></div>
                            <div className={`h-full ${glubinaBgColor}`} style={{ width: `${progress.glubina}%`, transition: 'width 0.3s ease' }}></div>
                        </div>
                    </div>
                </MinigameHUD>

                <div className="w-full flex-grow relative">
                    {words.map(w => <div key={w.id} className={`absolute p-1 cursor-pointer whitespace-nowrap ${w.type === 'shirota' ? groupColors.shirota : groupColors.glubina}`} style={{ left: `${w.pos.x}%`, top: `${w.pos.y}%`, transform: `translate(-50%, -50%) rotate(${w.rot}deg) scale(${w.scale})`, transition: pulsatingWordIds.includes(w.id) ? 'transform 0.1s' : 'none' }} onClick={() => handleClick(w)}>{w.text}</div>)}
                </div>
            </>}
        </div>
    );
};