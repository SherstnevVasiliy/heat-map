import { useEffect, useRef, useState } from 'react';
import './HeatMap.css';

interface ClickPoint {
  x: number;
  y: number;
  id: string;
}

interface HeatMapProps {
  imageUrl: string;
  aspectRatio?: number;
  points: ClickPoint[];
}

const MAX_COORDINATE = 100;

const HeatMap = ({ imageUrl, aspectRatio = 1, points }: HeatMapProps) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Добавляем константы для настройки интенсивности
  const MIN_POINTS_FOR_NORMAL_INTENSITY = 10;
  const MAX_INTENSITY = 0.8;
  const MIN_INTENSITY = 0.3;

  // Функция для расчета базовой интенсивности
  const calculateBaseIntensity = () => {
    if (points.length <= MIN_POINTS_FOR_NORMAL_INTENSITY) {
      return MAX_INTENSITY;
    }
    return Math.max(
      MIN_INTENSITY,
      MAX_INTENSITY - (points.length - MIN_POINTS_FOR_NORMAL_INTENSITY) * 0.05
    );
  };

  // Обработчик загрузки изображения
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    updateDimensions();
  };

  const updateDimensions = () => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Размеры с учетом соотношения сторон и размеров контейнера
    let newWidth, newHeight;

    if (aspectRatio >= 1) {
      // Изображение шире, чем выше (или квадратное)
      newWidth = containerWidth;
      newHeight = containerWidth / aspectRatio;

      // Если высота больше контейнера, уменьшаем
      if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = containerHeight * aspectRatio;
      }
    } else {
      // Изображение выше, чем шире
      newHeight = containerHeight;
      newWidth = containerHeight * aspectRatio;

      // Если ширина больше контейнера, уменьшаем
      if (newWidth > containerWidth) {
        newWidth = containerWidth;
        newHeight = containerWidth / aspectRatio;
      }
    }

    setDimensions({ width: newWidth, height: newHeight });
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [aspectRatio]);

  const drawHeatMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Проверяем, что у нас есть действительные размеры перед рисованием
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    // Обновляем размеры canvas
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Очищаем canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    if (isSimpleMode) {
      // Простой режим: рисуем красные круги
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      points.forEach((point) => {
        const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
        const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;

        // Рисуем точку на правильной позиции
        const radius = 25;
        ctx.beginPath();
        ctx.arc(denormalizedX, denormalizedY, radius, 0, Math.PI * 2);
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
    const heatRadius = 50; // Радиус тепловой точки

    // Рисуем каждый клик на временном canvas
    points.forEach((point) => {
      const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
      const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;

      const gradient = tempCtx.createRadialGradient(
        denormalizedX,
        denormalizedY,
        0,
        denormalizedX,
        denormalizedY,
        heatRadius
      );

      gradient.addColorStop(0, `rgba(255, 0, 0, ${baseIntensity})`); // Красный
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      tempCtx.fillStyle = gradient;
      tempCtx.beginPath();
      tempCtx.arc(denormalizedX, denormalizedY, heatRadius, 0, Math.PI * 2);
      tempCtx.fill();
    });

    try {
      // Получаем данные изображения (только если размеры положительные)
      if (dimensions.width > 0 && dimensions.height > 0) {
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

            data[i] = red; // R
            data[i + 1] = green; // G
            data[i + 2] = blue; // B
            data[i + 3] = intensity * 255; // A
          }
        }

        // Рисуем обработанное изображение на основном canvas
        ctx.putImageData(imageData, 0, 0);
      }
    } catch (error) {
      console.error('Error processing canvas data:', error);
    }
  };

  const handleToggleMode = () => {
    setIsSimpleMode((prev) => !prev);
  };

  useEffect(() => {
    if (isImageLoaded && dimensions.width > 0 && dimensions.height > 0) {
      drawHeatMap();
    }
  }, [points, dimensions, isSimpleMode, isImageLoaded]);

  return (
    <div className="wrapper">
      <button
        className="toggle-button"
        onClick={handleToggleMode}
        aria-label={
          isSimpleMode ? 'Включить режим тепловой карты' : 'Выключить режим тепловой карты'
        }
      >
        {isSimpleMode ? 'Включить тепловую карту' : 'Выключить тепловую карту'}
      </button>
      <div className="container" ref={containerRef}>
        <div className="image-container">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Тепловая карта"
            className="image"
            style={{
              width: dimensions.width > 0 ? dimensions.width : 'auto',
              height: dimensions.height > 0 ? dimensions.height : 'auto',
            }}
            onLoad={handleImageLoad}
          />
          <canvas
            ref={canvasRef}
            className="canvas"
            style={{
              width: dimensions.width > 0 ? dimensions.width : 0,
              height: dimensions.height > 0 ? dimensions.height : 0,
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
