import React from 'react';

const MapHUD = ({ truckPos }: { truckPos: [number, number] }) => {
  return (
    <div className="absolute top-4 right-4 z-[400] bg-bg-card/80 backdrop-blur-md border border-border-color p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-72">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <h3 className="text-primary font-bold tracking-wider text-sm uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          Telemetría en Vivo
        </h3>
        <span className="text-xs bg-primary/20 text-blue-300 px-2 py-1 rounded-md border border-primary/30 font-mono">
          CVRP-TW
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Vehículo</span>
          <span className="text-white font-medium text-sm">Camión 1 (Refrigerado)</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Próx. Parada</span>
          <span className="text-white font-medium text-sm">Cliente A</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Coord. GPS</span>
          <span className="text-blue-400 font-mono text-xs">{truckPos[0].toFixed(4)}, {truckPos[1].toFixed(4)}</span>
        </div>
        
        <div className="pt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Capacidad (Carga Total)</span>
            <span className="text-green-400 font-bold">80%</span>
          </div>
          <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden shadow-inner">
            <div className="w-[80%] h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapHUD;
