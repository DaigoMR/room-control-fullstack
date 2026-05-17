// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

// Colores por estado_actual
const COLORES = {
  Disponible:    { bg: '#EAF3DE', text: '#3B6D11', bar: '#639922' },
  Ocupado:       { bg: '#FAECE7', text: '#993C1D', bar: '#D85A30' },
  Limpieza:      { bg: '#E6F1FB', text: '#185FA5', bar: '#378ADD' },
  Mantenimiento: { bg: '#FAEEDA', text: '#854F0B', bar: '#EF9F27' },
};

function MetricCard({ label, value, sub, accent }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: accent ? accent + '22' : undefined, border: `1px solid ${accent || '#e5e7eb'}` }}
    >
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      {sub && <p className="text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

function BarChart({ habitaciones }) {
  const total = habitaciones.length || 1;
  const estados = Object.keys(COLORES);

  return (
    <div className="flex flex-col gap-3">
      {estados.map((est) => {
        const count = habitaciones.filter((h) => h.estado_actual === est).length;
        const pct   = Math.round((count / total) * 100);
        return (
          <div key={est}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-500">{est}</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{count} hab. ({pct}%)</span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: COLORES[est].bar }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ habitaciones }) {
  const total = habitaciones.length || 1;
  const estados = Object.keys(COLORES);
  const size = 140;
  const r    = 54;
  const cx   = size / 2;
  const cy   = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const slices = estados.map((est) => {
    const count = habitaciones.filter((h) => h.estado_actual === est).length;
    const pct   = count / total;
    const dash  = pct * circ;
    const slice = { est, count, pct, dash, offset };
    offset += dash;
    return slice;
  });

  const ocupadas = habitaciones.filter((h) => h.estado_actual === 'Ocupado').length;
  const ocupPct  = Math.round((ocupadas / total) * 100);

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map(({ est, dash, offset: off }) => (
          <circle
            key={est}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={COLORES[est].bar}
            strokeWidth="18"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-off + circ / 4}
            style={{ transition: 'stroke-dasharray 0.7s ease' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="600" fill="currentColor">{ocupPct}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#888">ocupación</text>
      </svg>
      <div className="flex flex-col gap-2">
        {slices.map(({ est, count }) => (
          <div key={est} className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORES[est].bar }} />
            {est}: <span className="font-medium text-zinc-700 dark:text-zinc-300">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    // ✅ URL modificada con ruta relativa para producción en Vercel
    axios.get('/api/habitaciones')
      .then(({ data }) => setHabitaciones(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
      Cargando dashboard...
    </div>
  );

  const total     = habitaciones.length;
  const ocupadas  = habitaciones.filter((h) => h.estado_actual === 'Ocupado');
  const libres    = habitaciones.filter((h) => h.estado_actual === 'Disponible');
  const ocupPct   = total ? Math.round((ocupadas.length / total) * 100) : 0;
  const avgTarifa = ocupadas.length
    ? Math.round(ocupadas.reduce((s, h) => s + parseFloat(h.precio_base), 0) / ocupadas.length)
    : 0;
  const ingresos  = Math.round(ocupadas.reduce((s, h) => s + parseFloat(h.precio_base), 0));

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Dashboard</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Resumen en tiempo real del estado del hotel</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total habitaciones"  value={total}                               accent="#378ADD" />
        <MetricCard label="Ocupadas"            value={ocupadas.length} sub={`${ocupPct}% ocupación`} accent="#D85A30" />
        <MetricCard label="Disponibles"         value={libres.length}                     accent="#639922" />
        <MetricCard label="Ingresos estimados"  value={`$${ingresos.toLocaleString()}`}  sub="ocupadas × tarifa" accent="#EF9F27" />
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Donut */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Distribución</p>
          <DonutChart habitaciones={habitaciones} />
        </div>

        {/* Barras */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Por estado</p>
          <BarChart habitaciones={habitaciones} />
        </div>
      </div>

      {/* Tarifa promedio */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Tarifas</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricCard label="Tarifa promedio (ocupadas)" value={`$${avgTarifa.toLocaleString()}`} />
          <MetricCard label="Tarifa base estándar"       value={`$${parseFloat(habitaciones[0]?.precio_base || 0).toLocaleString()}`} />
          <MetricCard label="Potencial máximo (100%)"    value={`$${Math.round(total * parseFloat(habitaciones[0]?.precio_base || 0)).toLocaleString()}`} sub="si todas estuvieran ocupadas" />
        </div>
      </div>
    </div>
  );
}