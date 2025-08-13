
import React from 'react';

export const Title: React.FC<{ onTitleClick: () => void }> = ({ onTitleClick }) => (
    <h1 onClick={onTitleClick} className="text-6xl md:text-8xl font-bold text-center cursor-pointer my-8 animate-pulse text-yellow-300">
        ДАДАШПИЛЬ
    </h1>
);
