import React from 'react';

export const OtorviPisyunWinScreen: React.FC<{ pisyunImage?: React.ReactNode }> = ({ pisyunImage }) => (
    <div className="w-96 h-60 bg-stone-200 p-3 relative flex flex-col items-center justify-center transform -rotate-[3deg] shadow-2xl border-2 border-black overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="priapic-pattern" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="scale(1.5) rotate(45)">
                        <path d="M0 0h40v40H0z" fill="none"/>
                        <path d="M-10,20h20v-20h20v40h-20v-20h-20" stroke="#000" strokeWidth="4" fill="none"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#priapic-pattern)"/>
            </svg>
        </div>

        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold p-1 transform rotate-12 z-10">ДА!</div>

        <h3 className="text-4xl font-bold tracking-widest text-black z-10" style={{fontFamily: `'Courier New', Courier, monospace`}}>АНТИ-БИЛЕТ</h3>
        
        <div className="my-2 w-full flex justify-between items-center px-4 z-10">
            <span className="text-sm font-semibold transform -rotate-12 text-gray-700">Фестиваль Имени Приапа</span>
            <div className="w-16 h-16">{pisyunImage}</div>
             <span className="text-lg font-bold text-gray-800">x1</span>
        </div>
        
        <div className="text-center text-black font-semibold text-lg z-10" style={{fontFamily: `'Times New Roman', serif`, fontStyle: 'italic'}}>Вход разрешён только при выходе</div>
        
    </div>
);