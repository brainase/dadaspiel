
import React from 'react';

interface ShapeRendererProps {
  path: string;
  color: string;
  stroke?: string;
}

const SolidRenderer: React.FC<ShapeRendererProps> = ({ path, color, stroke = '#000' }) => (
  React.createElement('svg', { width: "60", height: "60", viewBox: "-5 -5 60 60" },
    React.createElement('path', { d: path, fill: color, stroke: stroke, strokeWidth: "2" })
  )
);

const StripedRenderer: React.FC<ShapeRendererProps> = ({ path, color, stroke = '#000' }) => {
  const patternId = `stripes-${color.replace('#', '')}`;
  return (
    React.createElement('svg', { width: "60", height: "60", viewBox: "-5 -5 60 60" },
      React.createElement('defs', null,
        React.createElement('pattern', { id: patternId, patternUnits: "userSpaceOnUse", width: "8", height: "8", patternTransform: "rotate(45)" },
          React.createElement('path', { d: "M 0,0 l 8,0", stroke: color, strokeWidth: "4" }),
          React.createElement('path', { d: "M 0,4 l 8,0", stroke: "rgba(0,0,0,0.4)", strokeWidth: "4" })
        )
      ),
      React.createElement('path', { d: path, fill: `url(#${patternId})`, stroke: stroke, strokeWidth: "2" })
    )
  );
};

const DottedRenderer: React.FC<ShapeRendererProps> = ({ path, color, stroke = '#000' }) => {
  const patternId = `dots-${color.replace('#', '')}`;
  return (
    React.createElement('svg', { width: "60", height: "60", viewBox: "-5 -5 60 60" },
      React.createElement('defs', null,
        React.createElement('pattern', { id: patternId, patternUnits: "userSpaceOnUse", width: "12", height: "12" },
          React.createElement('circle', { cx: "6", cy: "6", r: "2.5", fill: color })
        )
      ),
      React.createElement('path', { d: path, fill: `url(#${patternId})`, stroke: stroke, strokeWidth: "2" })
    )
  );
};

const PulsingRenderer: React.FC<ShapeRendererProps> = ({ path, color, stroke = '#000' }) => {
  return (
    React.createElement('svg', { width: "60", height: "60", viewBox: "-5 -5 60 60" },
      React.createElement('style', null, `
        @keyframes dada-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `),
      React.createElement('path', { d: path, fill: color, stroke: stroke, strokeWidth: "2", style: { animation: 'dada-pulse 2s ease-in-out infinite' }})
    )
  );
};


const DADA_SHAPE_PATHS = [
  // 1. Была симметричная арка
  "M 5 45 C 15 5, 40 10, 45 45 L 38 45 L 30 35 L 20 45 L 10 45 Z",
  // 2. Асимметричная трапеция
  "M 10 10 L 40 10 L 45 40 L 5 40 L 15 20 Z",
  // 3. Было симметричное сердце
  "M 25 5 C 40 0, 45 20, 25 50 C 5 25, 10 -5, 25 5 Z",
  // 4. Асимметричный ромб
  "M 0 25 L 25 5 L 50 25 L 30 50 Z",
  // 5. Асимметричный X
  "M 0 10 L 10 0 L 25 15 L 45 5 L 50 10 L 30 25 L 50 45 L 45 50 L 25 30 L 5 50 L 0 45 L 20 25 Z",
  // 6. Асимметричный треугольник
  "M 5,5 L 45,5 L 25,45 L 10 25 Z",
  // Уже асимметричный
  "M 10 0 L 50 5 L 40 25 L 20 20 L 0 20 Z",
  // Уже асимметричный
  "M 10,50 C 30,0 40,0 50,20 S 40,50 20,50 S 10,50 10,50 Z",
  // 7. Асимметричный восьмиугольник
  "M 0 10 L 10 0 L 40 0 L 50 10 L 50 20 L 45 25 L 50 30 L 50 40 L 40 50 L 10 50 L 0 40 Z",
  // Уже асимметричный
  "M 0 0 L 30 0 L 50 20 L 50 50 L 20 50 L 0 30 Z",
  // 8. Была почти симметричная звезда
  "M 25,0 L 35,15 L 55,15 L 40,30 L 48,40 L 25,35 L 5,45 L 10,30 L 0,15 L 15,15 Z",
  // Уже асимметричный
  "M 0,25 C 25,0 25,0 25,0 L 25,50 C 25,50 25,50 50,25 L 25,25 Z",
  // 9. Была симметричная снежинка
  "M 25,5 L 30,15 L 45,15 L 45,25 L 30,25 L 42,30 L 35,40 L 15,40 L 10,35 L 20,25 L 5,25 L 5,15 L 20,15 Z",
  // 10. Асимметричный ромб
  "M 0 20 L 20 0 L 40 20 Q 30 45 20 40 Z",
  // Уже асимметричный
  "M 10,10 C 20,25 40,0 40,0 L 45,45 C 20,30 0,45 0,45 Z",
  // Был точечно-симметричный
  "M 50 0 L 20 20 L 50 50 L 30 50 L 5 15 L 30 0 Z",
  // 11. Асимметричные песочные часы
  "M 0 0 L 50 0 L 30 20 L 55 45 L 5 45 L 25 25 Z",
  // 12. Был симметричный изогнутый прямоугольник
  "M 10 10 L 20 10 C 25 0 30 0 35 10 L 40 10 Q 55 30 40 40 L 10 40 Q 0 25 10 10 Z",
  // 13. Асимметричные концентрические круги
  "M 0,25 a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0 M 15,20 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0",
  // 14. Асимметричная стрелка
  "M 0,50 L 25,0 L 35,5 L 25,10 L 50,50 L 40,50 L 25,20 L 10,50 Z"
];

const RENDERERS = [SolidRenderer, StripedRenderer, DottedRenderer, PulsingRenderer];
export const ALL_COLORS = ["cyan", "yellow", "magenta", "lime", "orange", "red", "fuchsia", "teal", "gold", "skyblue", "salmon"];

export const generateRoundShapes = (round: number) => {
    const numShapes = round === 1 ? 3 : 5;
    const newShapes: any[] = [];
    const placedTargets: { x: number; y: number; radius: number }[] = [];

    // A robust function to find a non-overlapping position for a target silhouette.
    // It will try many times, and if it fails, it will slightly reduce the required
    // spacing to ensure a valid position is always found, preventing bugs in crowded rounds.
    const getNonOverlappingTargetPos = (scale: number) => {
        let x, y, attempts = 0;
        let currentRadius = 7 * scale; // Start with original radius for spacing
        let hasOverlap;

        while (true) { // Loop until a position is found
            hasOverlap = false;
            // Define search area for the targets
            x = 10 + Math.random() * 80;
            y = 40 + Math.random() * 55;
            
            // Check for overlap with already placed targets
            for (const target of placedTargets) {
                const dx = target.x - x;
                const dy = target.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < target.radius + currentRadius) {
                    hasOverlap = true;
                    break;
                }
            }
            
            if (!hasOverlap) {
                // Found a spot, add it to the list of placed targets and return
                placedTargets.push({ x, y, radius: currentRadius });
                return { x, y };
            }
            
            attempts++;

            // After 200 failed attempts, start reducing the radius to make it easier to fit
            if (attempts > 200 && attempts % 50 === 0) {
                currentRadius *= 0.98; // Reduce radius by 2%
                console.warn(`Could not find a spot. Reducing placement radius to ${currentRadius}. Attempt #${attempts}`);
            }

            // Safety break to prevent infinite loops, though it should not be reached
            if (attempts > 1000) {
                console.error("Infinite loop detected in shape placement. Placing with original fallback.");
                x = 10 + Math.random() * 80;
                y = 80; 
                placedTargets.push({ x, y, radius: currentRadius });
                return { x, y };
            }
        }
    };


    const pathPool = [...DADA_SHAPE_PATHS].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < numShapes; i++) {
        const path = pathPool[i];
        if (!path) continue;

        const renderer = RENDERERS[Math.floor(Math.random() * RENDERERS.length)];
        const targetRotation = [0, 45, 90, 135, 180, 225, 270, 315][Math.floor(Math.random() * 8)];
        const startRotation = [0, 45, 90, 135, 180, 225, 270, 315][Math.floor(Math.random() * 8)];
        const scale = 0.8 + Math.random() * 0.7;
        const targetPos = getNonOverlappingTargetPos(scale);
        const startX = 15 + i * (70 / (numShapes || 1));
        
        const shapeData: any = {
            id: i + round * 100,
            path,
            renderer,
            target: { x: targetPos.x, y: targetPos.y, rotation: targetRotation },
            pos: { x: startX, y: 20 },
            rotation: startRotation,
            isPlaced: false,
            scale,
        };

        const color = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
        shapeData.rendererProps = { color: color };
        shapeData.target.color = color;
        
        // Add movement to targets only in round 3
        if (round === 3) {
            shapeData.target.vx = (Math.random() - 0.5) * 2;
            shapeData.target.vy = (Math.random() - 0.5) * 2;
            shapeData.target.vRot = (Math.random() - 0.5) * 10;
        }
        
        newShapes.push(shapeData);
    }
    return newShapes;
};
