import React from 'react';
import { useSession, useProfile, useSettings } from '../../context/GameContext';
import { CASES } from '../../data/caseData';
import { SoundType } from '../../utils/AudioEngine';

export const CaseSelectionScreen: React.FC = () => {
  const { startCase } = useSession();
  const { activeProfile, logout } = useProfile();
  const { playSound } = useSettings();

  if (!activeProfile) {
    return <div className="text-center p-8">Ошибка: Профиль не загружен.</div>;
  }
  const { progress, character, name } = activeProfile;

  // Функция для проверки, завершено ли "Дело".
  const isCaseComplete = (caseId: number) => {
    const caseData = CASES.find(c => c.id === caseId);
    if (!caseData) return false;
    return (progress[caseId] || 0) >= caseData.minigames.length;
  };

  // Функция для проверки, разблокировано ли "Дело".
  const isUnlocked = (caseId: number) => {
    // Первые три "Дела" доступны с самого начала.
    if (caseId <= 3) return true;
    // "Дело" №4 открывается только после прохождения первых трёх.
    if (caseId === 4) return isCaseComplete(1) && isCaseComplete(2) && isCaseComplete(3);
    // "Дело" №5 открывается после прохождения "Дела" №4.
    if (caseId === 5) return isCaseComplete(4);
    // "Дело" №6 (финальное) открывается после прохождения "Дела" №5.
    if (caseId === 6) return isCaseComplete(5);
    return false;
  };
  
  const handleStartCase = (caseId: number) => {
    playSound(SoundType.BUTTON_CLICK);
    startCase(caseId);
  }

  const handleLogout = () => {
      playSound(SoundType.BUTTON_CLICK);
      logout();
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h2 className="text-4xl mb-2">ВЫБОР ДЕЛА</h2>
      <p className="text-lg mb-8">Игрок: {name} ({character})</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {CASES.map((c) => {
            const unlocked = isUnlocked(c.id);
            const currentProgress = progress[c.id] || 0;
            const totalMinigames = c.minigames.length;
            const completed = currentProgress >= totalMinigames;
            
            // Определяем стиль кнопки в зависимости от её состояния.
            let btnClass = "pixel-button-locked"; // По умолчанию заблокирована.
            if (unlocked) btnClass = "pixel-button"; // Если разблокирована, но не пройдена.
            if (completed) btnClass = "pixel-button-completed"; // Если пройдена.
            
            return (
              <button 
                key={c.id}
                // Начать "Дело" можно только если оно разблокировано.
                onClick={() => unlocked && handleStartCase(c.id)} 
                disabled={!unlocked}
                className={`${btnClass} p-4 text-lg w-full h-24 flex flex-col items-center justify-center text-center`}
              >
                <span>{c.title}</span>
                <span className="text-sm opacity-80 mt-1">
                  {completed ? "✓ ЗАВЕРШЕНО" : unlocked ? `(${currentProgress}/${totalMinigames})` : "🔒"}
                </span>
              </button>
            );
        })}
      </div>
      <button onClick={handleLogout} className="pixel-button p-3 text-lg mt-8 bg-red-800">
          Сменить игрока
      </button>
    </div>
  );
};