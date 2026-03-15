import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { socket } from './store/gameStore';
import Home from './pages/Home';
import Room from './pages/Room';
import './index.css';

function App() {
  useEffect(() => {
    socket.connect();
    
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
