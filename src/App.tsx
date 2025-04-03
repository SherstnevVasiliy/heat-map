import HeatMapContainer from './components/HeatMapContainer';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="content">
        <h1>Тепловая карта кликов</h1>
        <HeatMapContainer imageUrl="sample-image.webp" aspectRatio={1} />
      </div>
    </div>
  );
}

export default App;
