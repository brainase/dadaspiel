
import React from 'react';

interface ConfirmationModalProps {
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
  // To prevent clicks on the modal content from closing it.
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div 
      className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center animate-[fadeIn_0.3s]"
      onClick={onCancel} // Allow closing by clicking the overlay
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div 
        className="bg-[#1a1a1a] p-8 pixel-border text-center flex flex-col items-center gap-6 max-w-lg"
        onClick={stopPropagation}
      >
        <h2 id="confirmation-title" className="text-4xl text-yellow-300">{title}</h2>
        <div className="text-xl text-white">{message}</div>
        <div className="flex gap-8 mt-4">
          <button onClick={onCancel} className="pixel-button p-4 text-2xl bg-gray-600 hover:bg-gray-700">
            ОТМЕНА
          </button>
          <button onClick={onConfirm} className="pixel-button p-4 text-2xl bg-red-800 hover:bg-red-900">
            УДАЛИТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
