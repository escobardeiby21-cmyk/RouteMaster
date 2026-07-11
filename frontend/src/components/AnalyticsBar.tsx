import React, { useEffect, useState } from 'react';
import api from '../api';
import ExportButton from './ExportButton';

const AnalyticsBar = () => {
  const [stats, setStats] = useState<any>(null);
  const [allStops, setAllStops] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/');
        setStats(res.data);
        
        const resStops = await api.get('/all_stops');
        setAllStops(resStops.data);
      } catch (err) {
        console.error("No se pudo cargar la analítica", err);
      }
    };
    
    // Obtener stats inmediatamente y luego cada 5 segundos
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="w-full bg-bg-main border-b border-border-color p-4 flex justify-around items-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative z-30">
      
      {/* Estilos para las animaciones suaves */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes radar {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .anim-float { animation: float 3s ease-in-out infinite; }
        .anim-radar { animation: radar 4s linear infinite; }
      `}</style>

      <div className="text-center flex flex-col items-center">
        <div className="text-indigo-400 mb-2 anim-radar">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v10"></path><path d="M12 12l4.6 4.6"></path></svg>
        </div>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Rutas Optimizadas</p>
        <p className="text-2xl font-bold text-white">{stats.total_routes}</p>
      </div>
      
      <div className="w-px h-10 bg-gradient-to-b from-transparent via-border-color to-transparent"></div>
      
      <div className="text-center flex flex-col items-center">
        <div className="text-green-400 mb-2 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </div>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Estado Entregas Hoy</p>
        <p className="text-2xl font-bold text-white">
          <span className="text-green-400">{stats.delivered_stops}</span> 
          <span className="text-gray-500 text-lg"> / {stats.delivered_stops + stats.pending_stops}</span>
        </p>
      </div>
      
      <div className="w-px h-10 bg-gradient-to-b from-transparent via-border-color to-transparent"></div>
      
      <div className="text-center flex flex-col items-center">
        <div className="text-blue-400 mb-2 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="21.17" y1="8" x2="12" y2="8"></line><line x1="3.95" y1="6.06" x2="8.54" y2="14"></line><line x1="10.88" y1="21.94" x2="15.46" y2="14"></line></svg>
        </div>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Choferes en Flota</p>
        <p className="text-2xl font-bold text-blue-400">{stats.active_drivers}</p>
      </div>

      <div className="w-px h-10 bg-gradient-to-b from-transparent via-border-color to-transparent"></div>
      
      <div className="text-center bg-green-500/10 px-6 py-2 rounded-xl border border-green-500/20 flex flex-col items-center">
        <div className="text-green-500 mb-1 anim-float">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22v-8c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v8"></path><path d="M6 12v-5a6 6 0 0 1 12 0v5"></path><path d="M15 15h.01"></path><path d="M12 9v1"></path><path d="M12 18v1"></path></svg>
        </div>
        <p className="text-xs text-green-500 uppercase tracking-wider font-bold mb-1">Combustible Ahorrado</p>
        <p className="text-2xl font-bold text-green-400">~{stats.fuel_saved_liters} Litros</p>
      </div>

      <div className="w-px h-10 bg-gradient-to-b from-transparent via-border-color to-transparent"></div>
      
      <div className="flex items-center">
        <ExportButton data={allStops} filename={`Reporte_Financiero_RouteMaster`} />
      </div>
    </div>
  );
};

export default AnalyticsBar;
