import HeatMapContainer from './components/HeatMapContainer';
import DeckGLHeatmap from './components/DeckGLHeatmap';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="content">
        <h1>Тепловая карта кликов</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <HeatMapContainer imageUrl="sample-image.webp" aspectRatio={1} />
          <div>
            <h2>Тепловая карта с deck.gl</h2>
            <DeckGLHeatmap imageUrl="sample-image.webp" aspectRatio={1} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
