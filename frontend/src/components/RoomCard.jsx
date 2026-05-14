// src/components/RoomCard.jsx
const RoomCard = ({ habitacion, onClick }) => {
  const statusColors = {
    'Disponible': 'bg-blue-500',    
    'Ocupado': 'bg-red-600',       
    'Limpieza': 'bg-green-500',    
    'Mantenimiento': 'bg-cyan-400' 
  };

  return (
    <div 
      // Ahora TODAS las tarjetas ejecutan onClick
      onClick={() => onClick(habitacion)}
      className="flex flex-col border border-gray-300 rounded-md shadow-sm overflow-hidden bg-white transition-all cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-gray-300"
    >
      <div className="text-center py-2 font-bold text-gray-700 bg-gray-100 border-b">
        {habitacion.numero_habitacion}
      </div>
      
      <div className={`${statusColors[habitacion.estado_actual]} text-white text-xs py-1 px-2 text-center font-semibold uppercase tracking-wider`}>
        {habitacion.estado_actual}
      </div>

      <div className="p-2 text-center text-[10px] text-gray-500 uppercase">
        {habitacion.tipo}
      </div>
    </div>
  );
};

export default RoomCard;