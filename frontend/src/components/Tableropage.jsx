// src/pages/TableroPage.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import RoomCard from './RoomCard';
import RoomActionModal from './RoomActionModal';
import FilterBar from './Filterbar';

export default function TableroPage() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get('/api/habitaciones');
      setHabitaciones(data);
    } catch (err) {
      console.error('Error cargando habitaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const habitacionesFiltradas = activeFilter === 'all'
    ? habitaciones
    : habitaciones.filter((h) => h.estado_actual === activeFilter);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
      Cargando tablero...
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <FilterBar
        activeFilter={activeFilter}
        onChange={setActiveFilter}
        habitaciones={habitaciones}
      />

      {/* Contador */}
      <p className="text-xs text-zinc-400">
        {habitacionesFiltradas.length === habitaciones.length
          ? `${habitaciones.length} habitaciones`
          : `${habitacionesFiltradas.length} de ${habitaciones.length} habitaciones`}
      </p>

      {/* Grid — Forzado de forma absoluta a filas de 10 */}
      <div
        className="grid gap-3"
        style={{ 
          gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
          display: 'grid' 
        }}
      >
        {habitacionesFiltradas.map((hab) => (
          <RoomCard
            key={hab.id}
            habitacion={hab}
            onClick={() => { setSelectedRoom(hab); setIsModalOpen(true); }}
          />
        ))}
      </div>

      {habitacionesFiltradas.length === 0 && (
        <div className="text-center py-16 text-zinc-400 text-sm">
          No hay habitaciones con estado "{activeFilter}"
        </div>
      )}

      <RoomActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        habitacion={selectedRoom}
        onActionSuccess={fetchRooms}
      />
    </div>
  );
}