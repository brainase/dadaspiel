import React from 'react';
import { useNavigation, useSettings } from '../../context/GameContext';
import { ALL_MINIGAMES } from '../../data/caseData';
import { CHARACTERS } from '../../data/characterData';
import { GameScreen } from '../../../types';
import { SoundType } from '../../utils/AudioEngine';

const animationButtons = [
  { id: 'naley-shampanskogo', name: 'Налей Шампанского' },
  { id: 'kvir-kontrol', name: 'Квир-Контроль' },
  { id: 'tanec-dveri', name: 'Танец у дверей' },
  { id: 'dada-kompliment:shirota', name: 'Комп-т: Широта' },
  { id: 'dada-kompliment:glubina', name: 'Комп-т: Глубина' },
  { id: 'dada-kompliment:timeup', name: 'Комп-т: Время' },
  { id: 'prohod-kino', name: 'Немое кино' },
  { id: 'pereverni-kalendar', name: '3 Сентября' },
  { id: 'soberi-feminitiv', name: 'Собери феминитив' },
  { id: 'boitsovskiy-klub', name: 'Бойцовский клуб' },
  { id: 'prigotovlenie-aladok', name: 'Аладки' },
  { id: 'poceluy-dobra', name: 'Поцелуй Добра' },
  { id: 'fruktoviy-spor', name: 'Фруктовый спор' },
  { id: 'ne-podavis', name: 'Не Подавись' },
  { id: 'zasos-pylesosa', name: 'Засос пылесоса' },
  { id: 'otorvi-pisyun', name: 'Билет (Писюн)' },
];

export const DebugMenu: React.FC = () => {
    const { setScreen, setAnimationToView, jumpToMinigame } = useNavigation();
    const { isLogging, toggleLogging, playSound, debugCharacter, setDebugCharacter } = useSettings();
    
    const handleAnimationClick = (id: string) => {
        playSound(SoundType.BUTTON_CLICK);
        setAnimationToView(id);
        setScreen(GameScreen.DEBUG_ANIMATION_VIEWER);
    };

    const handleActionClick = (action: () => void) => {
        playSound(SoundType.BUTTON_CLICK);
        action();
    }

    return (
        <div className="flex flex-col items-center h-full p-4 overflow-y-auto">
            <h2 className="text-3xl mt-4 mb-4">ДАДА АЛАДКИ</h2>
            <div className="flex gap-4 mb-4">
                 <button onClick={() => handleActionClick(toggleLogging)} className="pixel-button p-2 text-sm">
                    {isLogging ? "Остановить запись" : "Начать запись лога"}
                </button>
                <button onClick={() => handleActionClick(() => setScreen(GameScreen.LOG_VIEW))} className="pixel-button p-2 text-sm">
                    Показать лог
                </button>
                <button onClick={() => handleActionClick(() => setScreen(GameScreen.PROFILE_SELECTION))} className="pixel-button p-2 text-sm bg-red-700">
                    Назад в меню
                </button>
            </div>

            <h3 className="text-2xl mt-6 mb-2">Персонаж для отладки</h3>
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {CHARACTERS.map(charInfo => {
                    const isSelected = debugCharacter === charInfo.name;
                    return (
                        <button
                            key={charInfo.name}
                            onClick={() => handleActionClick(() => setDebugCharacter(charInfo.name))}
                            className={`pixel-button p-2 ${isSelected ? 'bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {charInfo.name}
                        </button>
                    );
                })}
                <button
                    onClick={() => handleActionClick(() => setDebugCharacter(null))}
                    className={`pixel-button p-2 ${!debugCharacter ? 'bg-yellow-600' : 'bg-gray-600'}`}
                    disabled={!debugCharacter}
                    title={!debugCharacter ? "Используется персонаж из профиля (если есть)" : "Сбросить к персонажу из профиля"}
                >
                    Сброс
                </button>
            </div>

            <h3 className="text-2xl mt-6 mb-2">Анимации победы</h3>
            <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {animationButtons.map(btn => (
                    <button key={btn.id} onClick={() => handleAnimationClick(btn.id)} className="pixel-button p-2 bg-teal-700 hover:bg-teal-600">
                        {btn.name}
                    </button>
                ))}
                <button onClick={() => handleActionClick(() => setScreen(GameScreen.FINAL_ENDING))} className="pixel-button p-2 bg-yellow-600 hover:bg-yellow-500">
                    Финальный Экстаз
                </button>
            </div>

            <h3 className="text-2xl mt-6 mb-2">Мини-игры</h3>
            <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {ALL_MINIGAMES.map(mg => (
                    <button key={mg.id} onClick={() => handleActionClick(() => jumpToMinigame(mg.id))} className="pixel-button p-2">
                        {mg.name}
                    </button>
                ))}
            </div>
        </div>
    );
};