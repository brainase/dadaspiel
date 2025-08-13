
import React from 'react';

/**
 * Компонент для рендеринга пиксель-арта.
 * Он принимает массив строк (artData), где каждый символ представляет пиксель,
 * и палитру (palette), которая сопоставляет символы с цветами.
 * @param artData - Массив строк, представляющий "холст". Например: [" b ", "bbb", " b "].
 * @param palette - Объект, где ключ - символ из artData, а значение - цвет в формате hex.
 * @param pixelSize - Размер каждого "пикселя" в единицах SVG.
 */
export const PixelArt: React.FC<{
  artData: string[];
  palette: { [key: string]: string };
  pixelSize?: number;
}> = ({ artData, palette, pixelSize = 4 }) => {
  // Если данных для арта нет, ничего не рендерим.
  if (!artData || artData.length === 0) return null;

  // Вычисляем размеры холста на основе данных.
  const height = artData.length;
  const width = artData[0].length;

  return (
    // Используем SVG для рендеринга, так как он хорошо подходит для векторной графики
    // и позволяет легко создавать пиксельные сетки.
    <svg 
      width={width * pixelSize} 
      height={height * pixelSize} 
      viewBox={`0 0 ${width * pixelSize} ${height * pixelSize}`}
      // `imageRendering: 'pixelated'` предотвращает размытие при масштабировании, сохраняя четкие края пикселей.
      style={{ imageRendering: 'pixelated' }}
      // Атрибут для доступности, скрывающий декоративное изображение от скрин-ридеров.
      aria-hidden="true"
    >
      <g>
        {/* Проходимся по каждой строке (координата Y) */}
        {artData.map((row, y) => 
          // Проходимся по каждому символу в строке (координата X)
          row.split('').map((char, x) => {
            // Находим цвет для текущего символа в палитре.
            const color = palette[char];
            // Если цвет не найден или это "прозрачный" пиксель, пропускаем его.
            if (!color || color === 'transparent') {
              return null;
            }
            // Рендерим прямоугольник (пиксель) с нужными координатами и цветом.
            return (
              <rect
                key={`${y}-${x}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={color}
              />
            );
          })
        )}
      </g>
    </svg>
  );
};
