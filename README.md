# Sistema de Control de Habitaciones - Full Stack

Este proyecto es una aplicación de gestión hotelera (PMS) construida bajo la metodología **Bottom-Up**. Permite el control de estados de habitaciones (Disponible, Ocupado, Limpieza, Mantenimiento) con persistencia en base de datos relacional y una interfaz reactiva.

## 🛠️ Tecnologías
- **Base de Datos:** Neon.tech (PostgreSQL)
- **Backend:** Node.js + Express
- **Frontend:** React + Vite + Tailwind CSS
- **Estado/Formularios:** React Hook Form + Axios

---

## 🚀 Guía de Despliegue desde Cero

### 1. Clonar o Inicializar el Proyecto
Si estás descargando este código, abre una terminal en la carpeta raíz.
```bash
git init
```

### 2. Configuración de la Base de Datos (PostgreSQL)

#### En Linux (Ubuntu 24.04)

1. Instalar Postgres: `sudo apt update && sudo apt install postgresql`
2. Acceder a la terminal: `sudo -u postgres psql`
3. Crear la base de datos:
```sql
CREATE DATABASE hotel_control;
\c hotel_control;
```

4. Ejecutar el script de tablas y población (ver sección **Esquema SQL** abajo).

#### En Windows

1. Abrir **pgAdmin 4** o el **SQL Shell (psql)**.
2. Si usas Shell, ingresa tu contraseña y ejecuta:
```sql
CREATE DATABASE hotel_control;
\c hotel_control;
```

3. Pega el script SQL de creación.

#### Esquema SQL (Ejecutar en la base de datos)

```sql
CREATE TABLE habitaciones (
    id SERIAL PRIMARY KEY,
    numero_habitacion VARCHAR(10) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    estado_actual VARCHAR(20) DEFAULT 'Disponible' CHECK (estado_actual IN ('Disponible', 'Ocupado', 'Limpieza', 'Mantenimiento')),
    precio_base NUMERIC(10, 2) NOT NULL
);

CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    habitacion_id INTEGER REFERENCES habitaciones(id),
    nombre_huesped VARCHAR(100) NOT NULL,
    fecha_checkin TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_checkout TIMESTAMP,
    precio_cobrado NUMERIC(10, 2) NOT NULL,
    estado_reserva VARCHAR(20) DEFAULT 'Activa'
);

-- Script para 50 habitaciones
DO $$
BEGIN
    FOR i IN 1..50 LOOP
        INSERT INTO habitaciones (numero_habitacion, tipo, precio_base, estado_actual)
        VALUES ('H-' || LPAD(i::text, 2, '0'), 'Estándar', 1200.00, 'Disponible');
    END LOOP;
END $$;
```

---

### 3. Configuración del Backend (Server)

1. Entrar a la carpeta: `cd backend`
2. Instalar dependencias: `npm install`
3. Configurar la conexión:
   - Abre `server.js`.
   - Modifica el objeto `pool` con tus credenciales de PostgreSQL (`user`, `password`, `host`).
4. Iniciar: `node server.js` o `npm run dev` (si configuraste nodemon).
   - El servidor correrá en `http://localhost:3001`.

---

### 4. Configuración del Frontend (Interfaz)

1. Abrir otra terminal en la raíz y entrar a: `cd frontend`
2. Instalar dependencias: `npm install`
3. Iniciar entorno de desarrollo: `npm run dev`
4. Acceder en el navegador: `http://localhost:5173`

---

## 📂 Estructura de Git (.gitignore)

Asegúrate de tener un archivo `.gitignore` en la raíz para evitar subir archivos pesados:

```text
node_modules/
.env
dist/
.DS_Store
```

---

## 📝 Notas de Uso

- **Check-in:** Haz clic en una habitación azul. Completa el formulario.
- **Check-out:** Haz clic en una habitación roja para enviarla a limpieza.
- **Limpieza:** Haz clic en una habitación verde para liberarla.
- **Mantenimiento:** Usa el enlace dentro del modal de habitación disponible.
