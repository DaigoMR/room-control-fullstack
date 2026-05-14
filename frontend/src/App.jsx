// src/App.jsx (Actualizado)
import { useEffect, useState } from 'react';
import axios from 'axios';
import RoomCard from './components/RoomCard';
import RoomActionModal from './components/RoomActionModal'; // Importamos el modal

function App() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para controlar el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/habitaciones');
      setHabitaciones(response.data);
    } catch (error) {
      console.error("Error cargando habitaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Función que se dispara al hacer clic en una tarjeta
  const handleRoomClick = (habitacion) => {
    setSelectedRoom(habitacion);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-10 text-center">Cargando tablero...</div>;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="bg-blue-600 text-white p-4 mb-8 rounded-lg shadow-lg flex justify-between items-center">
        <h1 className="text-2xl font-bold uppercase tracking-widest">Control de Habitaciones V 1.0</h1>
        <div className="text-sm font-mono">Status: Localhost Conectado</div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-4">
        {habitaciones.map((hab) => (
          <RoomCard 
            key={hab.id} 
            habitacion={hab} 
            onClick={handleRoomClick} // Pasamos la función de clic
          />
        ))}
      </div>

      {/* Renderizamos el modal fuera del grid */}
      <RoomActionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        habitacion={selectedRoom}
        onActionSuccess={fetchRooms} // Se refresca la cuadrícula tras cualquier acción
      />
    </div>
  );
}

export default App;