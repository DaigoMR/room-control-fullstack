// backend/server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hotel_control',
  password: 'password', // ¡Cambia esto por tu contraseña!
  port: 5432,
});

// ==========================================
// ENDPOINT 1: Obtener Catálogo (Método GET)
// ==========================================
// Devuelve las 50 habitaciones ordenadas para armar la cuadrícula en React
app.get('/api/habitaciones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM habitaciones ORDER BY numero_habitacion');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ENDPOINT 2: Procesar Check-in (Método POST)
// ==========================================
// Registra la estadía y actualiza el estado de la habitación en un solo movimiento
app.post('/api/reservas/checkin', async (req, res) => {
  const { habitacion_id, nombre_huesped, precio_cobrado } = req.body;
  
  // Iniciamos un cliente dedicado para la transacción
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN'); // Inicia la transacción

    // 1. Insertamos en la tabla de reservas
    const insertReservaText = `
      INSERT INTO reservas (habitacion_id, nombre_huesped, precio_cobrado, estado_reserva) 
      VALUES ($1, $2, $3, 'Activa') RETURNING *
    `;
    const reservaRes = await client.query(insertReservaText, [habitacion_id, nombre_huesped, precio_cobrado]);

    // 2. Actualizamos el estado de la habitación en el catálogo
    const updateHabitacionText = `
      UPDATE habitaciones 
      SET estado_actual = 'Ocupado' 
      WHERE id = $1 RETURNING *
    `;
    const habitacionRes = await client.query(updateHabitacionText, [habitacion_id]);

    await client.query('COMMIT'); // Confirmamos los cambios

    res.status(201).json({ 
      mensaje: 'Check-in procesado exitosamente', 
      reserva: reservaRes.rows[0],
      habitacion: habitacionRes.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK'); // Si algo falla, deshacemos todo
    res.status(500).json({ error: 'Error al procesar el check-in', detalle: err.message });
  } finally {
    client.release(); // Liberamos el cliente
  }
});

// ==========================================
// ENDPOINT 3: Procesar Check-out (Método PUT)
// ==========================================
app.put('/api/reservas/checkout/:habitacion_id', async (req, res) => {
  const { habitacion_id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Finalizar la reserva activa para esa habitación
    // Establecemos la fecha de salida y cambiamos el estado
    const finalizarReservaText = `
      UPDATE reservas 
      SET estado_reserva = 'Finalizada', fecha_checkout = CURRENT_TIMESTAMP 
      WHERE habitacion_id = $1 AND estado_reserva = 'Activa'
      RETURNING *
    `;
    const reservaRes = await client.query(finalizarReservaText, [habitacion_id]);

    if (reservaRes.rows.length === 0) {
        throw new Error('No se encontró una reserva activa para esta habitación.');
    }

    // 2. Cambiar el estado de la habitación a 'Limpieza'
    // Siguiendo el flujo lógico: Ocupado -> Limpieza -> Disponible
    const pasarALimpiezaText = `
      UPDATE habitaciones 
      SET estado_actual = 'Limpieza' 
      WHERE id = $1 RETURNING *
    `;
    const habitacionRes = await client.query(pasarALimpiezaText, [habitacion_id]);

    await client.query('COMMIT');

    res.json({
      mensaje: 'Check-out realizado. Habitación enviada a limpieza.',
      reserva_finalizada: reservaRes.rows[0],
      habitacion_actualizada: habitacionRes.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// ENDPOINT 4: Finalizar Limpieza (Método PUT)
// ==========================================
// Extra: Para que la habitación vuelva a estar 'Disponible' (Azul)
app.put('/api/habitaciones/:id/limpiar', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE habitaciones SET estado_actual = 'Disponible' WHERE id = $1 AND estado_actual = 'Limpieza' RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "La habitación no estaba en estado de limpieza." });
        }
        res.json({ mensaje: "Habitación lista para recibir nuevos huéspedes", habitacion: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ENDPOINT 5: Enviar a Mantenimiento (PUT)
// ==========================================
app.put('/api/habitaciones/:id/mantenimiento', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE habitaciones SET estado_actual = 'Mantenimiento' WHERE id = $1 AND estado_actual = 'Disponible' RETURNING *",
      [id]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: "Solo habitaciones disponibles pueden ir a mantenimiento." });
    res.json({ mensaje: "Habitación en mantenimiento", habitacion: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ENDPOINT 6: Finalizar Mantenimiento (PUT)
// ==========================================
app.put('/api/habitaciones/:id/fin-mantenimiento', async (req, res) => {
  const { id } = req.params;
  try {
    // La pasamos a limpieza por protocolo
    const result = await pool.query(
      "UPDATE habitaciones SET estado_actual = 'Limpieza' WHERE id = $1 AND estado_actual = 'Mantenimiento' RETURNING *",
      [id]
    );
    res.json({ mensaje: "Mantenimiento finalizado. Habitación enviada a limpieza.", habitacion: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});