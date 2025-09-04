import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useSession, useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { Character } from '../../../types';
import { MinigameHUD } from '../core/MinigameHUD';

// Компонент, отображаемый при победе.
export const FruktoviySporWinScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
    const { playSound } = useSettings();
    useEffect(() => {
        playSound(SoundType.WIN_FRUKTY);
    }, [playSound]);

    return (
        <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center animate-[fadeIn_0.5s]">
            <h2 className="text-3xl text-yellow-300 mb-8">ПРИКОЛЫ СОБРАНЫ!</h2>
            <div className="w-48 h-24 bg-stone-700 rounded-t-full rounded-b-lg pixel-border flex items-center justify-center relative">
                <div className="absolute w-12 h-12 bg-red-500 rounded-full top-4 left-8"></div>
                <div className="absolute w-8 h-8 bg-blue-500 rounded-md top-10 left-16 transform rotate-45"></div>
                <div className="absolute w-10 h-10 bg-green-500 rounded-full top-2 left-24"></div>
                <div className="absolute text-yellow-300 text-3xl top-8 left-12 animate-pulse">?</div>
            </div>
            <p className="text-xl mt-4">Дадаистичное рагу из приколов</p>
             <button onClick={onContinue} className="pixel-button absolute bottom-8 p-4 text-2xl z-50 bg-green-700 hover:bg-green-800">
                ПРОХОДИМ
            </button>
        </div>
    );
};

export const FruktoviySpor: React.FC<{ onWin: () => void; onLose: () => void; isMinigameInverted?: boolean; }> = ({ onWin, onLose, isMinigameInverted = false }) => {
    const { playSound } = useSettings();
    const { handleMistake, character } = useSession();
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const hasFinished = useRef(false);
    const itemCounter = useRef(0);
    
    // Данные для каждого раунда: что ловить и какие "приманки" существуют.
    const roundData = useMemo(() => [
        { name: "Алыча", color: "#FFA500", shape: "oval", letter: "А", decoys: [{color: 'blue', shape: 'oval', letter: 'А'}, {color: '#FFA500', shape: 'circle', letter: 'А'}, {color: '#FFA500', shape: 'oval', letter: 'Б'}] },
        { name: "Персики", color: "#FFC0CB", shape: "circle", letter: "П", decoys: [{color: 'green', shape: 'circle', letter: 'П'}, {color: '#FFC0CB', shape: 'oval', letter: 'П'}, {color: '#FFC0CB', shape: 'circle', letter: 'Р'}] },
        { name: "Вяленый Томат", color: "#FF6347", shape: "oval", letter: "Т", decoys: [{color: 'purple', shape: 'oval', letter: 'Т'}, {color: '#FF6347', shape: 'circle', letter: 'Т'}, {color: '#FF6347', shape: 'oval', letter: 'Х'}] }
    ], []);

    const settings = useMemo(() => {
        const baseSettings = { scoreToWin: 10, mistakesLimit: 3, fallSpeed: 15 };
        switch(character) {
            case Character.KANILA: // Easy
                return { scoreToWin: 7, mistakesLimit: 5, fallSpeed: 12 };
            case Character.BLACK_PLAYER: // Hard
                return { scoreToWin: 12, mistakesLimit: 2, fallSpeed: 20 };
            default: // Medium (Sexism)
                return baseSettings;
        }
    }, [character]);

    const [round, setRound] = useState(0);
    const [status, setStatus] = useState<'playing'|'won'|'lost'>('playing');
    const [basketX, setBasketX] = useState(50);
    const [items, setItems] = useState<any[]>([]);
    const [score, setScore] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [isAdvancing, setIsAdvancing] = useState(false);
    // Состояние для экрана предпросмотра, чтобы игрок знал, что ловить.
    const [isPreviewing, setIsPreviewing] = useState(true);

    const currentRound = roundData[round];
    
    // Сброс состояния при начале нового рауунда.
    useEffect(() => {
        setScore(0);
        setMistakes(0);
        setItems([]);
        itemCounter.current = 0;
        setIsAdvancing(false);
        setIsPreviewing(true); // Включаем предпросмотр.

        const timer = setTimeout(() => {
            setIsPreviewing(false); // Выключаем предпросмотр через 3 секунды.
        }, 3000);
        return () => clearTimeout(timer);
    }, [round]);
    
    // Основной игровой цикл.
    useGameLoop(useCallback((deltaTime) => {
        if (hasFinished.current || status !== 'playing' || isAdvancing) return;
        
        // Появление новых "фруктов".
        if (Math.random() < 0.08) {
            const isTarget = Math.random() > 0.4; // 60% шанс на правильный фрукт.
            let itemData;
            if(isTarget) itemData = { ...currentRound, isTarget: true };
            else {
                const decoyData = currentRound.decoys[Math.floor(Math.random() * currentRound.decoys.length)];
                itemData = { ...decoyData, name: currentRound.name, isTarget: false };
            }
            setItems(prev => [...prev, { id: itemCounter.current++, data: itemData, x: 10 + Math.random() * 80, y: -5 }]);
        }
        
        // Движение и проверка столкновений.
        setItems(prevItems => {
            const newItems = [];
            for (const item of prevItems) {
                const newY = item.y + settings.fallSpeed * (deltaTime / 1000); // Скорость падения.
                if (newY > 105) continue; // Удаляем, если улетел за экран.
                
                let hit = false;
                // Проверка столкновения с корзиной.
                if (newY > 85 && newY < 95 && item.x > basketX - 10 && item.x < basketX + 10) {
                   hit = true;
                   const isCorrectCatch = isMinigameInverted ? !item.data.isTarget : item.data.isTarget;

                   if (isCorrectCatch) {
                        playSound(SoundType.ITEM_CATCH_GOOD);
                        setScore(s => s + 1); // +1 очко за правильный фрукт.
                   } else {
                        // If mistake was not forgiven by an ability, apply penalty
                        if (!handleMistake()) {
                            playSound(SoundType.ITEM_CATCH_BAD);
                            setMistakes(m => m + 1); // +1 ошибка за неправильный.
                        }
                   }
                }
                if (!hit) newItems.push({ ...item, y: newY });
            }
            return newItems;
        });
    }, [basketX, status, currentRound, isAdvancing, playSound, isMinigameInverted, handleMistake, settings.fallSpeed]), status === 'playing' && !isPreviewing); // Цикл работает только когда игра идет и предпросмотр выключен.

    // Проверка условий победы/поражения.
    useEffect(() => {
        if (status !== 'playing' || isAdvancing) return;

        if (mistakes >= settings.mistakesLimit) {
            if (hasFinished.current) return;
            hasFinished.current = true;
            setStatus('lost');
            setTimeout(onLose, 2000);
        } else if (score >= settings.scoreToWin) { // Нужно набрать N очков для победы в раунде.
            setIsAdvancing(true);
            setTimeout(() => {
                if (round < roundData.length - 1) {
                    setRound(r => r + 1); // Следующий раунд.
                } else {
                    if (hasFinished.current) return;
                    hasFinished.current = true;
                    setStatus('won'); // Победа в мини-игре.
                }
            }, 500);
        }
    }, [score, mistakes, round, onWin, onLose, status, roundData.length, isAdvancing, settings]);

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameAreaRef.current) {
            e.preventDefault();
            const pointer = 'touches' in e ? e.touches[0] : e;
            const rect = gameAreaRef.current.getBoundingClientRect();
            const x = ((pointer.clientX - rect.left) / rect.width) * 100;
            setBasketX(x);
        }
    };
    
    // Компонент для отображения фрукта/приманки.
    const Fruit = ({ data, isPreview = false }: { data: any; isPreview?: boolean }) => (
        <div style={{ width: isPreview ? '150px' : '50px', height: isPreview ? '150px' : '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: data.shape === 'oval' ? '50% / 70%' : '50%', background: data.color, border: `${isPreview ? 4 : 2}px solid black`, boxShadow: '4px 4px 0px #00000080' }}>
            <span className="text-black font-bold" style={{ fontSize: isPreview ? '5rem' : '1.5rem' }}>{data.letter}</span>
        </div>
    );

    const handleWinContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        onWin();
    };
    
    const previewData = isMinigameInverted ? currentRound.decoys[0] : currentRound;
    const instructionText = isMinigameInverted ? `ИЗБЕГАЙ "${currentRound.name}"` : `Поймай "${currentRound.name}"`

    return (
        <div 
            ref={gameAreaRef} 
            onMouseMove={handlePointerMove} 
            onTouchMove={handlePointerMove}
            onTouchStart={handlePointerMove}
            className="w-full h-full bg-gradient-to-b from-sky-400 to-green-600 flex flex-col items-center p-4 relative overflow-hidden cursor-none"
        >
            {status === 'won' && <FruktoviySporWinScreen onContinue={handleWinContinue} />}
            {status === 'lost' && <div className="absolute inset-0 bg-red-900/80 z-20 flex items-center justify-center text-5xl">СПОР ПРОИГРАН!</div>}
            
            {/* Экран предпросмотра */}
            { isPreviewing && (
                 <div className="absolute inset-0 z-30 bg-black/70 flex flex-col items-center justify-center">
                    <h3 className="text-3xl mb-8 text-white">{isMinigameInverted ? "Запомни, чего ИЗБЕГАТЬ:" : "Запомни этот фрукт:"}</h3>
                    <div className="animate-pulse"><Fruit data={previewData} isPreview={true} /></div>
                </div>
            )}

            {/* Основной игровой интерфейс */}
            {!isPreviewing && (
                <>
                    <MinigameHUD>
                        <h3 className="w-1/2 text-left">Раунд {round+1}/3: {instructionText}</h3>
                        <h3 className="w-1/2 text-right">Счёт: {score}/{settings.scoreToWin} | Ошибки: {mistakes}/{settings.mistakesLimit}</h3>
                    </MinigameHUD>
                    <div className="absolute inset-0">
                        {items.map(item => <div key={item.id} className="absolute" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%)` }}><Fruit data={item.data} /></div>)}
                        <div className="absolute bottom-[5%] w-32 h-16 bg-yellow-900 pixel-border rounded-lg" style={{ left: `${basketX}%`, transform: 'translateX(-50%)' }}></div>
                    </div>
                </>
            )}
        </div>
    );
};