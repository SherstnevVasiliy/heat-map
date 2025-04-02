import { useEffect, useRef, useState } from 'react';
import styles from './HeatMap.module.css';

interface ClickPoint {
  x: number;
  y: number;
}

interface HeatMapProps {
  imageUrl: string;
  width?: number;
  height?: number;
}

const MAX_COORDINATE = 100;

const HeatMap = ({ imageUrl, width = 800, height = 600 }: HeatMapProps) => {
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const normalizeCoordinates = (x: number, y: number): ClickPoint => {
    const normalizedX = Math.round((x / width) * MAX_COORDINATE);
    const normalizedY = Math.round((y / height) * MAX_COORDINATE);
    return {
      x: Math.min(Math.max(normalizedX, 0), MAX_COORDINATE),
      y: Math.min(Math.max(normalizedY, 0), MAX_COORDINATE)
    };
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const normalizedPoint = normalizeCoordinates(x, y);
    setClicks(prev => [...prev, normalizedPoint]);
  };

  const handleTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = event.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const normalizedPoint = normalizeCoordinates(x, y);
    setClicks(prev => [...prev, normalizedPoint]);
  };

  const drawHeatMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);

    // Создаем временный canvas для накопления интенсивности
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Рисуем каждый клик на временном canvas
    clicks.forEach(point => {
      // Денормализуем координаты для отображения
      const denormalizedX = (point.x / MAX_COORDINATE) * width;
      const denormalizedY = (point.y / MAX_COORDINATE) * height;

      const gradient = tempCtx.createRadialGradient(
        denormalizedX, denormalizedY, 0,
        denormalizedX, denormalizedY, 50
      );

      gradient.addColorStop(0, 'rgba(255, 255, 0, 0.2)'); // Желтый
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

      tempCtx.fillStyle = gradient;
      tempCtx.beginPath();
      tempCtx.arc(denormalizedX, denormalizedY, 50, 0, Math.PI * 2);
      tempCtx.fill();
    });

    // Получаем данные изображения
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Обрабатываем каждый пиксель
    for (let i = 0; i < data.length; i += 4) {
      const intensity = data[i + 3] / 255; // Нормализованная интенсивность (0-1)
      
      if (intensity > 0) {
        // Преобразуем интенсивность в цвет от желтого к фиолетовому
        const hue = 60 + (intensity * 300); // 60 - желтый, 360 - фиолетовый
        const rgb = hslToRgb(hue / 360, 1, 0.5);
        
        data[i] = rgb[0];     // R
        data[i + 1] = rgb[1]; // G
        data[i + 2] = rgb[2]; // B
        data[i + 3] = intensity * 255; // A
      }
    }

    // Рисуем обработанное изображение на основном canvas
    ctx.putImageData(imageData, 0, 0);
  };

  // Функция для конвертации HSL в RGB
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
  };

  useEffect(() => {
    drawHeatMap();
  }, [clicks]);

  return (
    <div 
      className={styles.container}
      onClick={handleClick}
      onTouchStart={handleTouch}
      style={{ width, height }}
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Heat map background"
        className={styles.image}
        style={{ width, height }}
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={styles.canvas}
      />
    </div>
  );
};

export default HeatMap; 