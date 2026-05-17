// src/components/RoomActionModal.jsx
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useState, useEffect } from 'react';

const RoomActionModal = ({ isOpen, onClose, habitacion, onActionSuccess }) => {
  const { register, handleSubmit, reset } = useForm();
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [serverError, setServerError]     = useState(null);
  const [reservaActiva, setReservaActiva] = useState(null);
  const [loadingReserva, setLoadingReserva] = useState(false);

  // Cuando se abre el modal en una habitación Ocupada, buscamos la reserva activa usando rutas relativas
  useEffect(() => {
    if (isOpen && habitacion?.estado_actual === 'Ocupado') {
      setLoadingReserva(true);
      setReservaActiva(null);
      axios
        .get(`/api/reservas/activa/${habitacion.id}`) // ✅ Actualizado para Vercel
        .then(({ data }) => setReservaActiva(data))
        .catch(() => setReservaActiva(null))
        .finally(() => setLoadingReserva(false));
    }
  }, [isOpen, habitacion]);

  // Limpiar estado al cerrar
  const handleClose = () => {
    setServerError(null);
    setReservaActiva(null);
    reset();
    onClose();
  };

  const onCheckInSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await axios.post('/api/reservas/checkin', { // ✅ Actualizado para Vercel
        habitacion_id:  habitacion.id,
        nombre_huesped: data.nombre_huesped,
        precio_cobrado: habitacion.precio_base, // siempre usa el precio base, sin campo editable
      });
      reset();
      onActionSuccess();
      handleClose();
    } catch (error) {
      setServerError(error.response?.data?.error || 'Error al procesar Check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await axios.put(`/api/reservas/checkout/${habitacion.id}`); // ✅ Actualizado para Vercel
      onActionSuccess();
      handleClose();
    } catch (error) {
      setServerError(error.response?.data?.error || 'Error al procesar Check-out');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishCleaning = async () => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await axios.put(`/api/habitaciones/${habitacion.id}/limpiar`); // ✅ Actualizado para Vercel
      onActionSuccess();
      handleClose();
    } catch (error) {
      setServerError(error.response?.data?.error || 'Error al actualizar limpieza');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendToMaintenance = async () => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await axios.put(`/api/habitaciones/${habitacion.id}/mantenimiento`); // ✅ Actualizado para Vercel
      onActionSuccess();
      handleClose();
    } catch (error) {
      setServerError(error.response?.data?.error || 'Error al enviar a mantenimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishMaintenance = async () => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await axios.put(`/api/habitaciones/${habitacion.id}/fin-mantenimiento`); // ✅ Actualizado para Vercel
      onActionSuccess();
      handleClose();
    } catch (error) {
      setServerError(error.response?.data?.error || 'Error al finalizar mantenimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !habitacion) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">

        {/* Encabezado */}
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

        {/* DISPONIBLE — solo pide nombre del huésped, sin campo de tarifa */}
        {habitacion.estado_actual === 'Disponible' && (
          <form onSubmit={handleSubmit(onCheckInSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del huésped</label>
              <input
                type="text"
                {...register('nombre_huesped', { required: true })}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
                placeholder="Ej: Juan García"
              />
            </div>
            <p className="text-xs text-gray-400">
              Tarifa aplicada: <span className="font-medium text-gray-600">${parseFloat(habitacion.precio_base).toLocaleString()}</span>
            </p>
            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={handleSendToMaintenance}
                disabled={isSubmitting}
                className="text-sm text-cyan-600 hover:text-cyan-800 underline"
              >
                Bloquear por avería
              </button>
              <div className="space-x-3">
                <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">
                  Confirmar ingreso
                </button>
              </div>
            </div>
          </form>
        )}

        {/* OCUPADO — muestra nombre del huésped y opción de checkout */}
        {habitacion.estado_actual === 'Ocupado' && (
          <div className="space-y-4">
            {loadingReserva ? (
              <p className="text-sm text-gray-400">Cargando información del huésped...</p>
            ) : reservaActiva ? (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Huésped actual</p>
                <p className="text-base font-semibold text-gray-800">{reservaActiva.nombre_huesped}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Tarifa: <span className="text-gray-600">${parseFloat(reservaActiva.precio_cobrado).toLocaleString()}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No se encontró información del huésped.</p>
            )}
            <p className="text-gray-700 text-sm">¿Deseas finalizar la estadía y enviar esta habitación a limpieza?</p>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded">
                Cancelar
              </button>
              <button
                onClick={handleCheckOut}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Procesar check-out
              </button>
            </div>
          </div>
        )}

        {/* MANTENIMIENTO */}
        {habitacion.estado_actual === 'Mantenimiento' && (
          <div className="space-y-4">
            <p className="text-gray-700">Esta habitación está bloqueada por mantenimiento. ¿Se ha resuelto el problema?</p>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button
                onClick={handleFinishMaintenance}
                disabled={isSubmitting}
                className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
              >
                Reparada (enviar a limpieza)
              </button>
            </div>
          </div>
        )}

        {/* LIMPIEZA */}
        {habitacion.estado_actual === 'Limpieza' && (
          <div className="space-y-4">
            <p className="text-gray-700">¿El personal de limpieza ha terminado?</p>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button
                onClick={handleFinishCleaning}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Marcar como disponible
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RoomActionModal;