
import React from 'react';

interface GenericWinScreenProps {
    title: string;
    text: string;
    buttonText?: string;
    onContinue: () => void;
    children?: React.ReactNode; // For custom background animations
}

export const GenericWinScreen: React.FC<GenericWinScreenProps> = ({ title, text, buttonText = "ПРОДОЛЖИТЬ", onContinue, children }) => {
    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 text-center text-white p-4 animate-[fadeIn_0.5s]">
            {children}
            <div className="z-10">
                <h2 className="text-4xl">{title}</h2>
                <p className="text-xl mt-4">{text}</p>
            </div>
            <button onClick={onContinue} className="pixel-button p-4 text-2xl mt-8 z-10">
                {buttonText}
            </button>
        </div>
    );
};
