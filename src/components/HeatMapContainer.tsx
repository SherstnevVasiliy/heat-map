import { useState } from 'react';
import InteractiveHeatMap from './InteractiveHeatMap';
import HeatMap from './HeatMap';
import styles from './HeatMap.module.css';

interface ClickPoint {
  x: number;
  y: number;
  id: string;
}

interface HeatMapContainerProps {
  imageUrl: string;
  width?: number;
  height?: number;
}

const HeatMapContainer = ({ imageUrl, width = 800, height = 600 }: HeatMapContainerProps) => {
  const [points, setPoints] = useState<ClickPoint[]>([]);

  const handlePointsChange = (newPoints: ClickPoint[]) => {
    setPoints(newPoints);
  };

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.mapSection}>
        <h2>Интерактивная карта</h2>
        <InteractiveHeatMap
          imageUrl={imageUrl}
          width={width}
          height={height}
          onPointsChange={handlePointsChange}
        />
      </div>
      <div className={styles.mapSection}>
        <h2>Тепловая карта</h2>
        <HeatMap
          imageUrl={imageUrl}
          width={width}
          height={height}
          points={points}
        />
      </div>
    </div>
  );
};

export default HeatMapContainer; 