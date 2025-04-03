import { useEffect, useRef, useState, useMemo } from 'react';
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

  // Конфигурация тепловой карты
  const heatmapConfig = useMemo(
    () => ({
      radius: 60, // Больший радиус для более плавного отображения
      blur: 0.9, // Уровень размытия для более гладкого перехода
      maxOpacity: 0.7, // Максимальная непрозрачность тепловой карты
      minOpacity: 0.2, // Минимальная непрозрачность
      intensityDivisor: 15, // Делитель для расчета интенсивности (больше значение = меньше насыщенность)
      threshold: {
        low: 0.2, // Порог низкой активности
        medium: 0.5, // Порог средней активности
        high: 0.8, // Порог высокой активности
      },
      adaptiveIntensity: true, // Автоматически адаптировать интенсивность в зависимости от количества точек
    }),
    []
  );

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

  // Создание интенсивностой карты для расчета цветов
  const createIntensityMap = (width: number, height: number) => {
    // Используем типизированный массив для лучшей производительности и меньшего расхода памяти
    const intensityMap = new Float32Array(width * height);

    points.forEach((point) => {
      const x = Math.floor((point.x / MAX_COORDINATE) * width);
      const y = Math.floor((point.y / MAX_COORDINATE) * height);

      // Проверка валидности координат
      if (x < 0 || x >= width || y < 0 || y >= height) return;

      const radius = Math.min(heatmapConfig.radius, Math.min(width, height) / 4);
      const radiusSquared = radius * radius;

      // Ограничиваем область обработки, чтобы избежать переполнения стека
      const startX = Math.max(0, x - radius);
      const endX = Math.min(width - 1, x + radius);
      const startY = Math.max(0, y - radius);
      const endY = Math.min(height - 1, y + radius);

      // Оптимизированный цикл
      for (let i = startX; i <= endX; i++) {
        for (let j = startY; j <= endY; j++) {
          const distSquared = (i - x) * (i - x) + (j - y) * (j - y);

          if (distSquared <= radiusSquared) {
            // Гауссовое распределение для более естественного затухания
            const factor = Math.exp(-distSquared / (2 * (radius / 2.5) * (radius / 2.5)));
            const index = j * width + i;
            if (index >= 0 && index < intensityMap.length) {
              intensityMap[index] += factor;
            }
          }
        }
      }
    });

    return intensityMap;
  };

  // Функция для расчета адаптивной интенсивности
  const calculateAdaptiveIntensity = () => {
    const basePointsCount = 10;
    const points_count = points.length;

    if (points_count <= basePointsCount) {
      return 1.0;
    }

    // Логарифмическое уменьшение интенсивности при увеличении количества точек
    return Math.max(0.3, 1.0 - Math.log10(points_count / basePointsCount) * 0.3);
  };

  // Обработчик загрузки изображения
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    updateDimensions();
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [aspectRatio]);

  // Функция получения цвета в зависимости от интенсивности
  const getHeatMapColor = (value: number) => {
    // Нормализованное значение от 0 до 1
    const normalized = Math.min(1, Math.max(0, value));

    // Переходы цветов как в Яндекс Метрике:
    // Темно-синий -> голубой -> зеленый -> желтый -> красный
    if (normalized < 0.2) {
      // Темно-синий к голубому
      const ratio = normalized / 0.2;
      return {
        r: Math.floor(0 + ratio * 0),
        g: Math.floor(0 + ratio * 144),
        b: Math.floor(255),
        a:
          heatmapConfig.minOpacity +
          normalized * (heatmapConfig.maxOpacity - heatmapConfig.minOpacity),
      };
    } else if (normalized < 0.4) {
      // Голубой к зеленому
      const ratio = (normalized - 0.2) / 0.2;
      return {
        r: Math.floor(0),
        g: Math.floor(144 + ratio * (255 - 144)),
        b: Math.floor(255 - ratio * 255),
        a:
          heatmapConfig.minOpacity +
          normalized * (heatmapConfig.maxOpacity - heatmapConfig.minOpacity),
      };
    } else if (normalized < 0.6) {
      // Зеленый к желтому
      const ratio = (normalized - 0.4) / 0.2;
      return {
        r: Math.floor(0 + ratio * 255),
        g: Math.floor(255),
        b: Math.floor(0),
        a:
          heatmapConfig.minOpacity +
          normalized * (heatmapConfig.maxOpacity - heatmapConfig.minOpacity),
      };
    } else if (normalized < 0.8) {
      // Желтый к оранжевому
      const ratio = (normalized - 0.6) / 0.2;
      return {
        r: Math.floor(255),
        g: Math.floor(255 - ratio * 165),
        b: Math.floor(0),
        a:
          heatmapConfig.minOpacity +
          normalized * (heatmapConfig.maxOpacity - heatmapConfig.minOpacity),
      };
    } else {
      // Оранжевый к красному
      const ratio = (normalized - 0.8) / 0.2;
      return {
        r: Math.floor(255),
        g: Math.floor(90 - ratio * 90),
        b: Math.floor(0),
        a:
          heatmapConfig.minOpacity +
          normalized * (heatmapConfig.maxOpacity - heatmapConfig.minOpacity),
      };
    }
  };

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

    // Если нет точек, просто выходим
    if (points.length === 0) return;

    // Расчет адаптивной интенсивности
    const adaptiveIntensity = heatmapConfig.adaptiveIntensity ? calculateAdaptiveIntensity() : 1.0;

    // Создаем временный canvas для накопления интенсивности с большим размером для лучшего размытия
    const tempCanvas = document.createElement('canvas');
    // Уменьшаем масштаб для производительности, если точек много
    const scaleFactor = points.length > 100 ? 0.5 : 1;
    tempCanvas.width = Math.floor(dimensions.width * scaleFactor);
    tempCanvas.height = Math.floor(dimensions.height * scaleFactor);

    // Проверяем, что размеры валидные
    if (tempCanvas.width <= 0 || tempCanvas.height <= 0) return;

    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    try {
      // Получаем карту интенсивности
      const intensityMap = createIntensityMap(tempCanvas.width, tempCanvas.height);

      // Находим максимальную интенсивность для нормализации
      let maxIntensity = 0;
      for (let i = 0; i < intensityMap.length; i++) {
        maxIntensity = Math.max(maxIntensity, intensityMap[i]);
      }
      // Если макс. интенсивность слишком мала, устанавливаем значение по умолчанию
      maxIntensity = maxIntensity || 1;

      // Создаем изображение данных
      const imageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      // Заполняем данные пикселей на основе интенсивности
      for (let i = 0; i < intensityMap.length; i++) {
        const intensity = (intensityMap[i] / maxIntensity) * adaptiveIntensity;

        if (intensity > 0.05) {
          // Игнорируем очень низкую интенсивность
          const color = getHeatMapColor(intensity);

          const idx = i * 4;
          data[idx] = color.r; // R
          data[idx + 1] = color.g; // G
          data[idx + 2] = color.b; // B
          data[idx + 3] = Math.floor(255 * color.a); // A
        }
      }

      // Рисуем данные интенсивности
      tempCtx.putImageData(imageData, 0, 0);

      // Применяем размытие для более гладкого эффекта
      if (heatmapConfig.blur > 0) {
        tempCtx.globalAlpha = 1;
        const blurValue = heatmapConfig.blur * 4;

        // Ограничиваем количество проходов размытия
        const blurPasses = Math.min(2, Math.ceil(points.length / 50));
        for (let i = 0; i < blurPasses; i++) {
          tempCtx.filter = `blur(${blurValue}px)`;
          tempCtx.drawImage(tempCanvas, 0, 0);
        }
        tempCtx.filter = 'none';
      }

      // Нарисуем финальный результат на основном canvas
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height,
        0,
        0,
        dimensions.width,
        dimensions.height
      );
    } catch (error) {
      console.error('Ошибка при рисовании тепловой карты:', error);
      // В случае ошибки нарисуем простые точки
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      points.forEach((point) => {
        const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
        const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;
        ctx.beginPath();
        ctx.arc(denormalizedX, denormalizedY, 15, 0, Math.PI * 2);
        ctx.fill();
      });
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
