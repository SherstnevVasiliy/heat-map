import HeatMap from './components/HeatMap';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="content">
        <h1>Тепловая карта кликов</h1>
        <HeatMap 
          imageUrl="https://avatars.mds.yandex.net/i?id=656ac61f30ef121f5a0013cebfe7bf93_l-12569575-images-thumbs&n=13"
          width={800}
          height={600}
        />
      </div>
    </div>
  );
}

export default App;
