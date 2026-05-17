// backend/server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config(); // ✅ Carga las variables de entorno desde el archivo .env

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Configuración del Pool adaptada para Neon.tech (Usa la URL completa de conexión)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido de forma obligatoria por Neon para conexiones seguras
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('¡Error conectando a PostgreSQL en la nube!', err.stack);
  }
  console.log('Conexión exitosa a la base de datos en Neon.tech');
  release();
});

// ENDPOINT 1: Obtener Catálogo
app.get('/api/habitaciones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM habitaciones ORDER BY numero_habitacion');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT NUEVO: Obtener reserva activa de una habitación (Versión Diagnóstico Robusta)
app.get('/api/reservas/activa/:habitacion_id', async (req, res) => {
  const habitacion_id = parseInt(req.params.habitacion_id, 10);
  
  if (isNaN(habitacion_id)) {
    return res.status(400).json({ error: 'El ID de la habitación debe ser un número válido.' });
  }

  try {
    // Buscamos cualquier reserva de esta habitación, ordenando por la más reciente
    const result = await pool.query(
      `SELECT nombre_huesped, precio_cobrado, estado_reserva 
       FROM reservas 
       WHERE habitacion_id = $1 
       ORDER BY id DESC 
       LIMIT 1`,
      [habitacion_id]
    );

    // Si de verdad la tabla de reservas no tiene NADA para este ID:
    if (result.rows.length === 0) {
      console.log(`[BACKEND] Cero registros en la tabla 'reservas' para la habitacion_id: ${habitacion_id}`);
      return res.status(404).json({ error: 'No se encontraron registros de reservas para esta habitación.' });
    }

    // Si encuentra algo, imprimimos en los logs qué estado tiene
    console.log(`[BACKEND] ¡Match encontrado! Datos reales en BD:`, result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en endpoint activa:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 2: Procesar Check-in
app.post('/api/reservas/checkin', async (req, res) => {
  const { habitacion_id, nombre_huesped, precio_cobrado } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertReservaText = `
      INSERT INTO reservas (habitacion_id, nombre_huesped, precio_cobrado, estado_reserva) 
      VALUES ($1, $2, $3, 'Activa') RETURNING *
    `;
    const reservaRes = await client.query(insertReservaText, [habitacion_id, nombre_huesped, precio_cobrado]);
    const updateHabitacionText = `
      UPDATE habitaciones SET estado_actual = 'Ocupado' WHERE id = $1 RETURNING *
    `;
    const habitacionRes = await client.query(updateHabitacionText, [habitacion_id]);
    await client.query('COMMIT');
    res.status(201).json({ 
      mensaje: 'Check-in procesado exitosamente', 
      reserva: reservaRes.rows[0],
      habitacion: habitacionRes.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al procesar el check-in', detalle: err.message });
  } finally {
    client.release();
  }
});

// ENDPOINT 3: Procesar Check-out
app.put('/api/reservas/checkout/:habitacion_id', async (req, res) => {
  const { habitacion_id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
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
    const pasarALimpiezaText = `
      UPDATE habitaciones SET estado_actual = 'Limpieza' WHERE id = $1 RETURNING *
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

// ENDPOINT 4: Finalizar Limpieza
app.put('/api/habitaciones/:id/limpiar', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE habitaciones SET estado_actual = 'Disponible' WHERE id = $1 AND estado_actual = 'Limpieza' RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'La habitación no estaba en estado de limpieza.' });
    }
    res.json({ mensaje: 'Habitación lista para recibir nuevos huéspedes', habitacion: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 5: Enviar a Mantenimiento
app.put('/api/habitaciones/:id/mantenimiento', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE habitaciones SET estado_actual = 'Mantenimiento' WHERE id = $1 AND estado_actual = 'Disponible' RETURNING *",
      [id]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Solo habitaciones disponibles pueden ir a mantenimiento.' });
    res.json({ mensaje: 'Habitación en mantenimiento', habitacion: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 6: Finalizar Mantenimiento
app.put('/api/habitaciones/:id/fin-mantenimiento', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE habitaciones SET estado_actual = 'Limpieza' WHERE id = $1 AND estado_actual = 'Mantenimiento' RETURNING *",
      [id]
    );
    res.json({ mensaje: 'Mantenimiento finalizado. Habitación enviada a limpieza.', habitacion: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ MODIFICADO PARA VERCEL: Se elimina app.listen y se exporta el módulo app
module.exports = app;