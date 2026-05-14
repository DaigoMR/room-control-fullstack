// src/components/RoomActionModal.jsx
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useState } from 'react';

const RoomActionModal = ({ isOpen, onClose, habitacion, onActionSuccess }) => {
  const { register, handleSubmit, reset } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  if (!isOpen || !habitacion) return null;

  // --- ACCIÓN: CHECK-IN (Disponible -> Ocupado) ---
  const onCheckInSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await axios.post('http://localhost:3001/api/reservas/checkin', {
        habitacion_id: habitacion.id,
        nombre_huesped: data.nombre_huesped,
        precio_cobrado: data.precio_cobrado
      });
      reset();
      onActionSuccess();
      onClose();
    } catch (error) {
      setServerError(error.response?.data?.error || "Error al procesar Check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ACCIÓN: CHECK-OUT (Ocupado -> Limpieza) ---
  const handleCheckOut = async () => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      // Usamos el endpoint PUT que creaste en el paso anterior
      await axios.put(`http://localhost:3001/api/reservas/checkout/${habitacion.id}`);
      onActionSuccess();
      onClose();
    } catch (error) {
      setServerError(error.response?.data?.error || "Error al procesar Check-out");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ACCIÓN: FINALIZAR LIMPIEZA (Limpieza -> Disponible) ---
  const handleFinishCleaning = async () => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await axios.put(`http://localhost:3001/api/habitaciones/${habitacion.id}/limpiar`);
      onActionSuccess();
      onClose();
    } catch (error) {
      setServerError(error.response?.data?.error || "Error al actualizar limpieza");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ACCIÓN: ENVIAR A MANTENIMIENTO (Disponible -> Mantenimiento) ---
  const handleSendToMaintenance = async () => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await axios.put(`http://localhost:3001/api/habitaciones/${habitacion.id}/mantenimiento`);
      onActionSuccess();
      onClose();
    } catch (error) {
      setServerError(error.response?.data?.error || "Error al enviar a mantenimiento");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ACCIÓN: FINALIZAR MANTENIMIENTO (Mantenimiento -> Limpieza) ---
  const handleFinishMaintenance = async () => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await axios.put(`http://localhost:3001/api/habitaciones/${habitacion.id}/fin-mantenimiento`);
      onActionSuccess();
      onClose();
    } catch (error) {
      setServerError(error.response?.data?.error || "Error al finalizar mantenimiento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-1 text-gray-800">
          Habitación {habitacion.numero_habitacion}
        </h2>
        <p className="text-sm font-semibold text-gray-500 mb-4 uppercase">
          Estado actual: <span className="text-gray-800">{habitacion.estado_actual}</span>
        </p>

        {serverError && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
            {serverError}
          </div>
        )}

        {/* --- RENDER CONDICIONAL: SI ESTÁ DISPONIBLE --- */}
        {habitacion.estado_actual === 'Disponible' && (
          <form onSubmit={handleSubmit(onCheckInSubmit)} className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Huésped</label>
              <input type="text" {...register("nombre_huesped", { required: true })} className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tarifa ($)</label>
              <input type="number" step="0.01" defaultValue={habitacion.precio_base} {...register("precio_cobrado", { required: true })} className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              {/* Nuevo botón para mantenimiento */}
              <button type="button" onClick={handleSendToMaintenance} disabled={isSubmitting} className="text-sm text-cyan-600 hover:text-cyan-800 underline">
                Bloquear por avería
              </button>
              
              <div className="space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">Confirmar Ingreso</button>
              </div>
            </div>
          </form>
        )}

        {/* --- RENDER CONDICIONAL: SI ESTÁ EN MANTENIMIENTO --- */}
        {habitacion.estado_actual === 'Mantenimiento' && (
          <div className="space-y-4">
             <p className="text-gray-700">Esta habitación está bloqueada por mantenimiento. ¿Se ha resuelto el problema?</p>
             <div className="flex justify-end space-x-3 pt-4 border-t">
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button onClick={handleFinishMaintenance} disabled={isSubmitting} className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600">
                Reparada (Enviar a Limpieza)
              </button>
            </div>
          </div>
        )}

        {/* --- RENDER CONDICIONAL: SI ESTÁ OCUPADA --- */}
        {habitacion.estado_actual === 'Ocupado' && (
          <div className="space-y-4">
            <p className="text-gray-700">¿Deseas finalizar la estadía y enviar esta habitación a limpieza?</p>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button onClick={handleCheckOut} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Procesar Check-out</button>
            </div>
          </div>
        )}

        {/* --- RENDER CONDICIONAL: SI ESTÁ EN LIMPIEZA --- */}
        {habitacion.estado_actual === 'Limpieza' && (
          <div className="space-y-4">
            <p className="text-gray-700">¿El personal de limpieza ha terminado?</p>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button onClick={handleFinishCleaning} disabled={isSubmitting} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Marcar como Disponible</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomActionModal;