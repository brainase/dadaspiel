import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { FEMINITIVES_TO_ASSEMBLE } from '../../data/wordData';
import { useSession, useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';

export const SoberiFeminitivWinScreen: React.FC<{ onContinue: () => void; finalWord: string }> = ({ onContinue, finalWord }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_FEMINITIV);
    }, [playSound]);

    return (
        <div className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center overflow-hidden">
            <style>{`
            @keyframes fly-in-letter {
                from { transform: translate(var(--start-x), var(--start-y)) rotate(var(--start-rot)) scale(0); opacity: 0; }
                to { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
            }
            @keyframes final-word-glow { 0%, 100% { text-shadow: 0 0 10px #fff, 0 0 20px #ff00ff, 0 0 30px #ff00ff; } 50% { text-shadow: 0 0 20px #fff, 0 0 30px #00ffff, 0 0 40px #00ffff; } }
            .final-word { animation: final-word-glow 2s ease-in-out infinite; }
            .flying-letter { animation: fly-in-letter 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        `}</style>
            <div className="flex final-word">
                {finalWord.split('').map((char, i) => {
                    const style = {
                        '--start-x': `${(Math.random() - 0.5) * 800}px`,
                        '--start-y': `${(Math.random() - 0.5) * 600}px`,
                        '--start-rot': `${(Math.random() - 0.5) * 720}deg`,
                        animationDelay: `${0.5 + i * 0.1}s`
                    } as React.CSSProperties;
                    return <span key={i} className="flying-letter text-6xl text-fuchsia-400" style={style}>{char}</span>;
                })}
            </div>
            <h2 className="text-2xl mt-8 text-white" style={{ animation: 'fly-in-letter 1s 1.5s forwards', opacity: 0 }}>ЯЗЫК ОСВОБОЖДЕН!</h2>
            <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700" style={{ animation: 'fly-in-letter 1s 2s forwards', opacity: 0 }}>ДАЛЬШЕ!</button>
        </div>
    );
};


export const SoberiFeminitiv: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { playSound } = useSettings();
    const { character } = useSession();

    const settings = useMemo(() => {
        const baseSettings = { time: 30, letterSpeedMultiplier: 1.0 };
        switch(character) {
            case Character.KANILA: // Easy
                return { time: 40, letterSpeedMultiplier: 0.7 };
            case Character.BLACK_PLAYER: // Hard
                return { time: 25, letterSpeedMultiplier: 1.4 };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [character]);

    // Выбираем 3 случайных слова для игры.
    const gameWords = useMemo(() => [...FEMINITIVES_TO_ASSEMBLE].sort(() => 0.5 - Math.random()).slice(0, 3), []);
    const [round, setRound] = useState(0);
    const [targetWord, setTargetWord] = useState("");
    const [letters, setLetters] = useState<any[]>([]); // Состояние для летающих букв.
    const [slots, setSlots] = useState<any[]>([]); // Состояние для слотов, куда нужно ставить буквы.
    const [timeLeft, setTimeLeft] = useState(settings.time);
    const [draggedLetter, setDraggedLetter] = useState<{ id: number; offset: { x: number; y: number } } | null>(null);
    const [status, setStatus] = useState<'playing' | 'won'>('playing');
    const containerRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);

    // Настройка нового раунда.
    useEffect(() => {
        if (hasFinished.current) return;
        // Если все раунды пройдены, победа.
        if (round >= gameWords.length) {
            hasFinished.current = true;
            setStatus('won');
            return;
        }

        const word = gameWords[round];
        setTargetWord(word);
        setTimeLeft(settings.time);
        setSlots(word.split('').map(() => null)); // Создаем пустые слоты.
        // Создаем массив букв, перемешиваем их и задаем случайные начальные позиции и скорости.
        setLetters(word.split('').sort(() => Math.random() - 0.5).map((char, index) => ({
            id: index, char: char,
            pos: { x: 10 + Math.random() * 80, y: 10 + Math.random() * 40 },
            vel: { x: ((Math.random() - 0.5) * 4) * settings.letterSpeedMultiplier, y: ((Math.random() - 0.5) * 4) * settings.letterSpeedMultiplier },
            isPlaced: false, jiggleKey: 0,
        })));
    }, [round, gameWords, settings]);

    // Основной игровой цикл.
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing') return;
        // Обновляем таймер.
        setTimeLeft(t => {
            const newTime = t - deltaTime / 1000;
            if (newTime <= 0) {
                if (!hasFinished.current) {
                    hasFinished.current = true;
                    onLose();
                }
                return 0;
            }
            return newTime;
        });

        // Двигаем буквы, которые не перетаскиваются и не установлены на место.
        setLetters(l => l.map(letter => {
            if (letter.isPlaced || (draggedLetter && draggedLetter.id === letter.id)) return letter;
            let newX = letter.pos.x + letter.vel.x * (deltaTime / 1000);
            let newY = letter.pos.y + letter.vel.y * (deltaTime / 1000);
            let newVelX = letter.vel.x; let newVelY = letter.vel.y;
            // Отскок от стен.
            if (newX < 2 || newX > 93) { newVelX *= -1; newX = Math.max(2, Math.min(93, newX)); }
            if (newY < 2 || newY > 48) { newVelY *= -1; newY = Math.max(2, Math.min(48, newY)); }
            return { ...letter, pos: { x: newX, y: newY }, vel: { x: newVelX, y: newVelY } };
        }));
    }, [draggedLetter, onLose, status]), status === 'playing');

    // Начало перетаскивания.
    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, id: number) => {
        e.preventDefault();
        const letter = letters.find(l => l.id === id);
        if (!letter || letter.isPlaced || hasFinished.current) return;
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const pointer = 'touches' in e ? e.touches[0] : e;
            const mouseX = ((pointer.clientX - rect.left) / rect.width) * 100;
            const mouseY = ((pointer.clientY - rect.top) / rect.height) * 100;
            setDraggedLetter({ id, offset: { x: mouseX - letter.pos.x, y: mouseY - letter.pos.y } });
        }
    };
    
    // Процесс перетаскивания.
    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!draggedLetter || !containerRef.current) return;
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const pointer = 'touches' in e ? e.touches[0] : e;
        const mouseX = ((pointer.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((pointer.clientY - rect.top) / rect.height) * 100;
        setLetters(l => l.map(letter =>
            letter.id === draggedLetter.id ? { ...letter, pos: { x: mouseX - draggedLetter.offset.x, y: mouseY - draggedLetter.offset.y } } : letter
        ));
    };

    // Окончание перетаскивания.
    const handlePointerUp = () => {
        if (!draggedLetter) return;
        const letterIndex = letters.findIndex(l => l.id === draggedLetter.id);
        const letter = letters[letterIndex];
        // Находим первый пустой слот.
        const nextSlotIndex = slots.findIndex(s => s === null);
        
        // Проверяем, правильную ли букву пытаются поставить в следующий слот.
        if (letter && nextSlotIndex !== -1 && letter.char === targetWord[nextSlotIndex]) {
            playSound(SoundType.ITEM_PLACE_SUCCESS);
            // Если да, помечаем букву как "установленную".
            const newLetters = [...letters];
            newLetters[letterIndex] = { ...letter, isPlaced: true, jiggleKey: letter.jiggleKey + 1 };
            setLetters(newLetters);

            // Заполняем слот.
            const newSlots = [...slots];
            newSlots[nextSlotIndex] = letter.char;
            setSlots(newSlots);
            
            // Если все слоты заполнены, переходим на следующий раунд.
            if (newSlots.every(s => s !== null)) {
                setTimeout(() => setRound(r => r + 1), 1000);
            }
        }
        setDraggedLetter(null);
    };

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };

    return (
        <div 
            ref={containerRef} 
            onMouseMove={handlePointerMove} 
            onMouseUp={handlePointerUp} 
            onMouseLeave={handlePointerUp}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="w-full h-full bg-gradient-to-b from-pink-300 to-fuchsia-300 flex flex-col items-center p-4 relative overflow-hidden select-none"
        >
            {status === 'won' && <SoberiFeminitivWinScreen onContinue={handleWinContinue} finalWord={gameWords[gameWords.length - 1]} />}
            
            {status === 'playing' && <>
                <style>{`
                    @keyframes jiggle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2) rotate(-5deg); } }
                    .jiggle-it { animation: jiggle 0.3s ease-in-out; }
                `}</style>
                <MinigameHUD>
                <div className="text-left">РАУНД: {round + 1}/{gameWords.length}</div>
                <div className="text-right">ВРЕМЯ: {Math.ceil(timeLeft)}</div>
                </MinigameHUD>
                <div className="w-full h-1/2 relative mt-4">
                     {/* Рендерим летающие буквы */}
                     {letters.map(l => (
                        !l.isPlaced && (
                            <div 
                                key={l.id} 
                                onMouseDown={(e) => handlePointerDown(e, l.id)} 
                                onTouchStart={(e) => handlePointerDown(e, l.id)}
                                className="absolute w-12 h-12 flex items-center justify-center bg-white pixel-border cursor-grab active:cursor-grabbing text-3xl text-pink-800" style={{ left: `${l.pos.x}%`, top: `${l.pos.y}%` }}>
                                {l.char}
                            </div>
                        )
                     ))}
                </div>
                <div className="flex justify-center items-center gap-2 mt-8">
                    {/* Рендерим слоты для букв */}
                    {targetWord.split('').map((char, index) => (
                        <div key={index} className="w-16 h-16 flex items-center justify-center bg-pink-300 pixel-border text-4xl text-pink-900">
                            {slots[index] ? (
                                <span key={letters.find(l => l.char === slots[index])?.jiggleKey} className="jiggle-it">{slots[index]}</span>
                            ) : '?'}
                        </div>
                    ))}
                </div>
            </>}
        </div>
    );
};
