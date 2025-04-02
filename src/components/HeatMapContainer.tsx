import { useState } from 'react';
import InteractiveHeatMap from './InteractiveHeatMap';
import HeatMap from './HeatMap';
import './HeatMap.css';

interface ClickPoint {
  x: number;
  y: number;
  id: string;
}

interface HeatMapContainerProps {
  imageUrl: string;
  aspectRatio?: number;
}

const HeatMapContainer = ({ imageUrl, aspectRatio = 1 }: HeatMapContainerProps) => {
  const [points, setPoints] = useState<ClickPoint[]>([]);
  console.log(points);

  const handlePointsChange = (newPoints: ClickPoint[]) => {
    setPoints(newPoints);
  };

  return (
    <div className="container-wrapper">
      <div className="map-section">
        <h2>Интерактивная карта</h2>
        <InteractiveHeatMap
          imageUrl={imageUrl}
          aspectRatio={aspectRatio}
          onPointsChange={handlePointsChange}
        />
      </div>
      <div className="map-section">
        <h2>Тепловая карта</h2>
        <HeatMap
          imageUrl={imageUrl}
          aspectRatio={aspectRatio}
          points={points}
        />
      </div>
    </div>
  );
};

export default HeatMapContainer; 