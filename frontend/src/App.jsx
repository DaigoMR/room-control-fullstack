// src/App.jsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import TableroPage from "./components/TableroPage.jsx"; 
import DashboardPage from "./components/DashboardPage.jsx";

function Layout() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <h1 className="text-base font-bold uppercase tracking-widest">
          Control de Habitaciones V 1.0
        </h1>
        <nav className="flex gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-blue-700'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`
            }
          >
            Tablero
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-blue-700'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`
            }
          >
            Dashboard
          </NavLink>
        </nav>
        <div className="text-xs font-mono opacity-60">● Localhost conectado</div>
      </header>

      {/* ✅ MODIFICADO: Añadido max-w-6xl (o 7xl) y mx-auto para contener el grid de 10 columnas de forma estética */}
      <main className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <Routes>
          <Route path="/"          element={<TableroPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}