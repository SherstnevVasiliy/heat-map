import { useEffect, useRef, useState, useMemo } from 'react';
import './HeatMap.css';

// Встроенные точки для демонстрации
const defaultPoints = [
  { x: 47, y: 42, id: 'point-1' },
  { x: 54, y: 48, id: 'point-2' },
  { x: 68, y: 29, id: 'point-3' },
  { x: 45, y: 23, id: 'point-4' },
  { x: 26, y: 44, id: 'point-5' },
  { x: 47, y: 21, id: 'point-6' },
  { x: 69, y: 27, id: 'point-7' },
  { x: 52, y: 47, id: 'point-8' },
  { x: 28, y: 45, id: 'point-9' },
  { x: 59, y: 55, id: 'point-10' },
  { x: 43, y: 26, id: 'point-11' },
  { x: 68, y: 28, id: 'point-12' },
  { x: 61, y: 38, id: 'point-13' },
  { x: 47, y: 37, id: 'point-14' },
  { x: 52, y: 50, id: 'point-15' },
  { x: 22, y: 42, id: 'point-16' },
  { x: 29, y: 47, id: 'point-17' },
  { x: 68, y: 80, id: 'point-18' },
  { x: 52, y: 48, id: 'point-19' },
  { x: 53, y: 63, id: 'point-20' },
  { x: 48, y: 36, id: 'point-21' },
  { x: 60, y: 38, id: 'point-22' },
  { x: 69, y: 28, id: 'point-23' },
  { x: 42, y: 25, id: 'point-24' },
  { x: 26, y: 45, id: 'point-25' },
  { x: 26, y: 91, id: 'point-26' },
  { x: 33, y: 86, id: 'point-27' },
  { x: 42, y: 78, id: 'point-28' },
  { x: 96, y: 91, id: 'point-29' },
  { x: 59, y: 38, id: 'point-30' },
  { x: 48, y: 37, id: 'point-31' },
  { x: 52, y: 50, id: 'point-32' },
  { x: 25, y: 43, id: 'point-33' },
  { x: 33, y: 47, id: 'point-34' },
  { x: 64, y: 79, id: 'point-35' },
  { x: 75, y: 81, id: 'point-36' },
  { x: 71, y: 63, id: 'point-37' },
  { x: 70, y: 50, id: 'point-38' },
  { x: 69, y: 27, id: 'point-39' },
  { x: 41, y: 24, id: 'point-40' },
  { x: 56, y: 27, id: 'point-41' },
];

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

const HeatMap = ({ imageUrl, aspectRatio = 1, points: propPoints }: HeatMapProps) => {
  // Используем точки из props или дефолтные, если пропсы пустые
  const [pointsToRender, setPointsToRender] = useState<ClickPoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Обновляем точки при изменении props
  useEffect(() => {
    if (propPoints && propPoints.length > 0) {
      setPointsToRender(propPoints);
    } else {
      setPointsToRender(defaultPoints);
    }
  }, [propPoints]);

  // Конфигурация тепловой карты
  const heatmapConfig = useMemo(
    () => ({
      radius: 35, // Увеличенный радиус для лучшего слияния точек
      blur: 1.8, // Увеличенное размытие для более гладкого эффекта
      maxOpacity: 0.95, // Увеличенная непрозрачность
      minOpacity: 0.2, // Низкая непрозрачность для синего
      intensityDivisor: 15, // Делитель для расчета интенсивности
      threshold: {
        low: 0.2, // Порог низкой активности
        medium: 0.5, // Порог средней активности
        high: 0.8, // Порог высокой активности
      },
      adaptiveIntensity: false, // Не адаптировать интенсивность
      useSimpleAlgorithm: true, // Использовать простой алгоритм
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

    // Используем более простой алгоритм, если нужно
    if (heatmapConfig.useSimpleAlgorithm) {
      pointsToRender.forEach((point) => {
        const x = Math.floor((point.x / MAX_COORDINATE) * width);
        const y = Math.floor((point.y / MAX_COORDINATE) * height);

        // Проверка валидности координат
        if (x < 0 || x >= width || y < 0 || y >= height) {
          console.log('Невалидные координаты точки:', point, 'преобразованы в:', x, y);
          return;
        }

        const radius = Math.min(heatmapConfig.radius, Math.min(width, height) / 4);
        const radiusSquared = radius * radius;

        // Ограничиваем область обработки
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
              const factor = Math.exp(-distSquared / (2 * (radius / 2) * (radius / 2)));

              const index = j * width + i;
              if (index >= 0 && index < intensityMap.length) {
                intensityMap[index] += factor;
              }
            }
          }
        }
      });

      return intensityMap;
    }

    // Более сложный алгоритм с эллиптическими формами
    pointsToRender.forEach((point) => {
      const x = Math.floor((point.x / MAX_COORDINATE) * width);
      const y = Math.floor((point.y / MAX_COORDINATE) * height);

      // Проверка валидности координат
      if (x < 0 || x >= width || y < 0 || y >= height) {
        console.log('Невалидные координаты точки:', point, 'преобразованы в:', x, y);
        return;
      }

      const baseRadius = Math.min(heatmapConfig.radius, Math.min(width, height) / 4);

      // Создаем случайные вариации для радиуса в разных направлениях
      const radiusX = baseRadius * (0.8 + Math.random() * 0.5); // 80-130% от основного радиуса
      const radiusY = baseRadius * (0.8 + Math.random() * 0.5);

      // Добавляем небольшой наклон для эффекта капли или растянутости
      const angle = Math.random() * Math.PI * 2; // Случайный угол наклона

      // Определяем максимальный радиус для обработки
      const maxRadius = Math.max(radiusX, radiusY);

      // Убедимся, что радиусы имеют целочисленное значение
      const safeMaxRadius = Math.ceil(maxRadius);

      // Ограничиваем область обработки
      const startX = Math.max(0, x - safeMaxRadius);
      const endX = Math.min(width - 1, x + safeMaxRadius);
      const startY = Math.max(0, y - safeMaxRadius);
      const endY = Math.min(height - 1, y + safeMaxRadius);

      // Генерируем случайные смещения для центра (создает эффект неправильной формы)
      const offsetX = (Math.random() - 0.5) * baseRadius * 0.3;
      const offsetY = (Math.random() - 0.5) * baseRadius * 0.3;

      // Если область обработки слишком мала, пропускаем
      if (startX >= endX || startY >= endY) {
        console.log('Слишком маленькая область обработки для точки:', point);
        return;
      }

      let pixelsProcessed = 0;

      // Оптимизированный цикл
      for (let i = startX; i <= endX; i++) {
        for (let j = startY; j <= endY; j++) {
          // Трансформируем координаты с учетом наклона
          const dx = i - (x + offsetX);
          const dy = j - (y + offsetY);

          // Рассчитываем дистанцию с учетом искажения формы
          const normX = dx * Math.cos(angle) + dy * Math.sin(angle);
          const normY = -dx * Math.sin(angle) + dy * Math.cos(angle);

          // Эллиптическая дистанция вместо круговой
          const distSquared =
            (normX * normX) / (radiusX * radiusX) + (normY * normY) / (radiusY * radiusY);

          if (distSquared <= 1.0) {
            // Внутри эллипса
            // Гауссовое распределение для более естественного затухания с небольшой вариацией
            // Множитель в экспоненте влияет на крутизну затухания
            const variableSigma = (radiusX + radiusY) / (4.0 + Math.random());
            const factor = Math.exp(-distSquared / (2 * variableSigma * variableSigma));

            const index = j * width + i;
            if (index >= 0 && index < intensityMap.length) {
              intensityMap[index] += factor;
              pixelsProcessed++;
            }
          }
        }
      }

      if (pixelsProcessed === 0) {
        console.log('Ни один пиксель не был обработан для точки:', point);
      }
    });

    return intensityMap;
  };

  // Функция для расчета адаптивной интенсивности
  const calculateAdaptiveIntensity = () => {
    const basePointsCount = 10;
    const points_count = pointsToRender.length;

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
    // Темно-синий -> синий -> красный -> желтый
    if (normalized < 0.05) {
      // Синюю зону еще больше сократили (с 0.1 до 0.05)
      // Темно-синий к синему
      const ratio = normalized / 0.05;
      return {
        r: Math.floor(0 + ratio * 0),
        g: Math.floor(0),
        b: Math.floor(150 + ratio * 105),
        a: heatmapConfig.minOpacity * 0.7, // Еще меньше прозрачность для синего
      };
    } else if (normalized < 0.5) {
      // Расширили переход от синего к красному
      // Синий к красному
      const ratio = (normalized - 0.05) / 0.45;
      return {
        r: Math.floor(0 + ratio * 255),
        g: Math.floor(0),
        b: Math.floor(255 - ratio * 255),
        a: heatmapConfig.minOpacity + ratio * (heatmapConfig.maxOpacity - heatmapConfig.minOpacity),
      };
    } else if (normalized < 0.85) {
      // Расширили область желтого цвета
      // Красный к желтому
      const ratio = (normalized - 0.5) / 0.35;
      return {
        r: Math.floor(255),
        g: Math.floor(0 + ratio * 255),
        b: Math.floor(0),
        a: Math.min(
          heatmapConfig.maxOpacity,
          heatmapConfig.minOpacity + ratio * 0.5 + normalized * 0.3
        ),
      };
    } else {
      // Яркий желтый для самых горячих зон
      return {
        r: Math.floor(255),
        g: Math.floor(255),
        b: Math.floor(0),
        a: heatmapConfig.maxOpacity,
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
      pointsToRender.forEach((point) => {
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
    if (pointsToRender.length === 0) {
      console.log('Нет точек для отрисовки тепловой карты');
      return;
    }

    console.log('Отрисовка тепловой карты с', pointsToRender.length, 'точками');

    // Расчет адаптивной интенсивности
    const adaptiveIntensity = heatmapConfig.adaptiveIntensity ? calculateAdaptiveIntensity() : 1.0;

    // Создаем временный canvas для накопления интенсивности с большим размером для лучшего размытия
    const tempCanvas = document.createElement('canvas');
    // Уменьшаем масштаб для производительности, если точек много
    const scaleFactor = pointsToRender.length > 100 ? 0.5 : 1;
    tempCanvas.width = Math.floor(dimensions.width * scaleFactor);
    tempCanvas.height = Math.floor(dimensions.height * scaleFactor);

    // Проверяем, что размеры валидные
    if (tempCanvas.width <= 0 || tempCanvas.height <= 0) {
      console.log('Неверные размеры временного canvas', tempCanvas.width, tempCanvas.height);
      return;
    }

    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    try {
      // Получаем карту интенсивности
      const intensityMap = createIntensityMap(tempCanvas.width, tempCanvas.height);

      // Проверяем, содержит ли карта ненулевые значения
      let hasNonZeroValues = false;
      for (let i = 0; i < intensityMap.length; i++) {
        if (intensityMap[i] > 0) {
          hasNonZeroValues = true;
          break;
        }
      }

      if (!hasNonZeroValues) {
        console.log('Карта интенсивности пуста - все значения равны 0');
      }

      // Находим максимальную интенсивность для нормализации
      let maxIntensity = 0;
      for (let i = 0; i < intensityMap.length; i++) {
        maxIntensity = Math.max(maxIntensity, intensityMap[i]);
      }
      // Если макс. интенсивность слишком мала, устанавливаем значение по умолчанию
      maxIntensity = maxIntensity || 1;

      console.log('Максимальная интенсивность:', maxIntensity);

      // Создаем изображение данных
      const imageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      // Предварительное размытие интенсивности для более плавных переходов
      const smoothedIntensityMap = smoothIntensityMap(
        intensityMap,
        tempCanvas.width,
        tempCanvas.height
      );

      // Заполняем данные пикселей на основе интенсивности
      for (let i = 0; i < smoothedIntensityMap.length; i++) {
        const intensity = (smoothedIntensityMap[i] / maxIntensity) * adaptiveIntensity;

        if (intensity > 0.01) {
          // Уменьшаем порог отображения
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

        // Увеличиваем количество проходов размытия
        const blurPasses = Math.min(3, Math.ceil(pointsToRender.length / 40));
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

      console.log('Тепловая карта отрисована успешно');
    } catch (error) {
      console.error('Ошибка при рисовании тепловой карты:', error);
      // В случае ошибки нарисуем простые точки
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      pointsToRender.forEach((point) => {
        const denormalizedX = (point.x / MAX_COORDINATE) * dimensions.width;
        const denormalizedY = (point.y / MAX_COORDINATE) * dimensions.height;
        ctx.beginPath();
        ctx.arc(denormalizedX, denormalizedY, 15, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };

  // Функция для сглаживания интенсивности для более плавных переходов между точками
  const smoothIntensityMap = (
    intensityMap: Float32Array,
    width: number,
    height: number
  ): Float32Array => {
    const smoothed = new Float32Array(intensityMap.length);
    const radius = 2; // Радиус сглаживания

    // Копируем исходную карту
    for (let i = 0; i < intensityMap.length; i++) {
      smoothed[i] = intensityMap[i];
    }

    // Применяем средний фильтр (box blur) для сглаживания
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (intensityMap[y * width + x] > 0) {
          let sum = 0;
          let count = 0;

          // Суммируем значения соседних пикселей
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                sum += intensityMap[ny * width + nx];
                count++;
              }
            }
          }

          // Вычисляем среднее значение и увеличиваем на 20% для компенсации потери яркости
          if (count > 0) {
            smoothed[y * width + x] = (sum / count) * 1.2;
          }
        }
      }
    }

    return smoothed;
  };

  const handleToggleMode = () => {
    setIsSimpleMode((prev) => !prev);
  };

  useEffect(() => {
    if (isImageLoaded && dimensions.width > 0 && dimensions.height > 0) {
      drawHeatMap();
    }
  }, [pointsToRender, dimensions, isSimpleMode, isImageLoaded]);

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
