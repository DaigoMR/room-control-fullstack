// src/components/FilterBar.jsx
// Los valores de estado_actual que vienen de la API son:
// "Disponible", "Ocupado", "Limpieza", "Mantenimiento"

const ESTADOS = [
  { key: 'all',            label: 'Todas',          activeClass: 'bg-blue-700 text-white border-blue-700' },
  { key: 'Disponible',     label: 'Disponible',     activeClass: 'bg-green-100 text-green-800 border-green-500' },
  { key: 'Ocupado',        label: 'Ocupado',        activeClass: 'bg-orange-100 text-orange-800 border-orange-400' },
  { key: 'Limpieza',       label: 'Limpieza',       activeClass: 'bg-blue-100 text-blue-800 border-blue-400' },
  { key: 'Mantenimiento',  label: 'Mantenimiento',  activeClass: 'bg-amber-100 text-amber-800 border-amber-400' },
];

const INACTIVE = 'bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-600 hover:border-zinc-400';

export default function FilterBar({ activeFilter, onChange, habitaciones }) {
  // Contar por estado_actual
  const counts = {};
  habitaciones.forEach((h) => {
    const est = h.estado_actual;
    counts[est] = (counts[est] || 0) + 1;
  });

  return (
    <div className="flex flex-wrap gap-2">
      {ESTADOS.map(({ key, label, activeClass }) => {
        const isActive = activeFilter === key;
        const count = key === 'all' ? habitaciones.length : (counts[key] || 0);

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-150
              ${isActive ? activeClass : INACTIVE}
            `}
          >
            {label}
            <span
              className={`
                inline-flex items-center justify-center
                w-4 h-4 rounded-full text-[10px] font-semibold
                ${isActive ? 'bg-black/10' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}
              `}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
