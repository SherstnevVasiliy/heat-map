import { useEffect, useRef, useState } from 'react';
import styles from './HeatMap.module.css';

interface ClickPoint {
  x: number;
  y: number;
  id: string;
}

interface HeatMapProps {
  imageUrl: string;
  width?: number;
  height?: number;
  points: ClickPoint[];
}

const MAX_COORDINATE = 100;
const ASPECT_RATIO = 1/1; // Соотношение сторон по умолчанию

const HeatMap = ({ imageUrl, width = 600, height = 600, points }: HeatMapProps) => {
  const [dimensions, setDimensions] = useState({ width, height });
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Добавляем константы для настройки интенсивности
  const MIN_POINTS_FOR_NORMAL_INTENSITY = 10;
  const MAX_INTENSITY = 0.8;
  const MIN_INTENSITY = 0.3;

  // Функция для расчета базовой интенсивности
  const calculateBaseIntensity = () => {
    if (points.length <= MIN_POINTS_FOR_NORMAL_INTENSITY) {
      return MAX_INTENSITY;
    }
    return Math.max(MIN_INTENSITY, MAX_INTENSITY - (points.length - MIN_POINTS_FOR_NORMAL_INTENSITY) * 0.05);
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const newWidth = Math.min(containerWidth, width);
      const newHeight = newWidth / ASPECT_RATIO;
      
      setDimensions({ width: newWidth, height: newHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [width]);

  const drawHeatMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очищаем canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    if (isSimpleMode) {
      // Простой режим: рисуем красные круги
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      points.forEach(point => {
        const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
        const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;
        
        ctx.beginPath();
        ctx.arc(denormalizedX, denormalizedY, 25, 0, Math.PI * 2);
        ctx.fill();
      });
      return;
    }

    // Создаем временный canvas для накопления интенсивности
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = dimensions.width;
    tempCanvas.height = dimensions.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const baseIntensity = calculateBaseIntensity();

    // Рисуем каждый клик на временном canvas
    points.forEach(point => {
      const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
      const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;

      const gradient = tempCtx.createRadialGradient(
        denormalizedX, denormalizedY, 0,
        denormalizedX, denormalizedY, 50
      );

      gradient.addColorStop(0, `rgba(255, 0, 0, ${baseIntensity})`); // Красный
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      tempCtx.fillStyle = gradient;
      tempCtx.beginPath();
      tempCtx.arc(denormalizedX, denormalizedY, 50, 0, Math.PI * 2);
      tempCtx.fill();
    });

    // Получаем данные изображения
    const imageData = tempCtx.getImageData(0, 0, dimensions.width, dimensions.height);
    const data = imageData.data;

    // Обрабатываем каждый пиксель
    for (let i = 0; i < data.length; i += 4) {
      const intensity = data[i + 3] / 255;
      
      if (intensity > 0) {
        // Преобразуем интенсивность в цвет от красного к желтому
        const red = 255;
        const green = Math.floor(255 * intensity);
        const blue = 0;
        
        data[i] = red;     // R
        data[i + 1] = green; // G
        data[i + 2] = blue; // B
        data[i + 3] = intensity * 255; // A
      }
    }

    // Рисуем обработанное изображение на основном canvas
    ctx.putImageData(imageData, 0, 0);
  };

  const handleToggleMode = () => {
    setIsSimpleMode(prev => !prev);
  };

  useEffect(() => {
    drawHeatMap();
  }, [points, dimensions, isSimpleMode]);

  return (
    <div className={styles.wrapper}>
      <button 
        onClick={handleToggleMode}
        className={styles.toggleButton}
        aria-label={isSimpleMode ? "Переключить в режим тепловой карты" : "Переключить в простой режим"}
      >
        {isSimpleMode ? "Режим тепловой карты" : "Простой режим"}
      </button>
      <div 
        ref={containerRef}
        className={styles.container}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Heat map background"
          className={styles.image}
          style={{ width: dimensions.width, height: dimensions.height }}
        />
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className={styles.canvas}
        />
      </div>
    </div>
  );
};

export default HeatMap; 