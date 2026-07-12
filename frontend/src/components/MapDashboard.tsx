import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import MapHUD from './MapHUD';
import api from '../api';

// Icono animado del Almacén (Depósito)
const depotHtml = `
  <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
    <div style="position: absolute; width: 100%; height: 100%; background: rgba(99, 102, 241, 0.4); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    <div style="background: #4f46e5; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; z-index: 10; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">HQ</div>
  </div>
`;
const depotIcon = L.divIcon({ html: depotHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });

// Creador de iconos secuenciales (1, 2, 3)
const createStopIcon = (number: number) => L.divIcon({
  html: `<div style="background: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">${number}</div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const truckSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6366f1" width="36" height="36" style="filter: drop-shadow(0px 5px 8px rgba(0,0,0,0.6));">
  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
</svg>`;
const truckIcon = L.divIcon({ html: truckSvg, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });

const depotPos: [number, number] = [39.4699, -0.3774]; // Almacén Central Fijo

const MapDashboard = ({ routeData }: { routeData?: any }) => {
  const [streetRoute, setStreetRoute] = useState<[number, number][]>([]);
  const [truckPos, setTruckPos] = useState<[number, number]>(depotPos);
  const [etaStr, setEtaStr] = useState<string>('');
  const [distanceStr, setDistanceStr] = useState<string>('');
  
  // Estados para Firma Digital
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [currentStopId, setCurrentStopId] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [deliveredStops, setDeliveredStops] = useState<number[]>([]);

  // Extraer las paradas y el orden matemático
  const stops = routeData?.customStops || [];
  
  // 1. Obtener la ruta real de calles con OSRM respetando el TSP/CVRP
  useEffect(() => {
    const fetchOSRMRoute = async () => {
      // Por defecto, si no hay ruta, solo nos quedamos en el almacén
      if (!routeData) return;

      // El backend devuelve el orden óptimo en routeData.routeData["0"].route (ej. [0, 2, 1, 0])
      // 0 es el depot, 1 es stops[0], 2 es stops[1]
      const vehicleRoute = routeData.routeData["0"]?.route;
      
      let orderedWaypoints: [number, number][] = [];
      if (vehicleRoute) {
        orderedWaypoints = vehicleRoute.map((index: number) => {
          if (index === 0) return depotPos;
          return [stops[index - 1].lat, stops[index - 1].lng] as [number, number];
        });
      } else {
        // Fallback si falla algo
        orderedWaypoints = [depotPos, ...stops.map((s:any) => [s.lat, s.lng] as [number, number]), depotPos];
      }

      // Construir URL OSRM: lng,lat;lng,lat...
      const coordinates = orderedWaypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');
      
      try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`);
        const data = await response.json();
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const leafletCoords = route.geometry.coordinates.map((coord: any) => [coord[1], coord[0]]);
          setStreetRoute(leafletCoords);
          setTruckPos(leafletCoords[0]); // Empezar al principio
          
          // Formatear Tiempo y Distancia
          const durMin = Math.round(route.duration / 60);
          const distM = route.distance;
          setEtaStr(`${Math.floor(durMin / 60) > 0 ? `${Math.floor(durMin / 60)}h ` : ''}${durMin % 60} min`);
          setDistanceStr(distM > 1000 ? `${(distM / 1000).toFixed(1)} km` : `${Math.round(distM)} m`);
        }
      } catch (error) {
        console.error("Error cargando OSRM", error);
      }
    };
    fetchOSRMRoute();
  }, [routeData]);

  // 2. Animar el camión
  useEffect(() => {
    if (streetRoute.length === 0) return;
    let step = 0;
    const interval = setInterval(() => {
      if (step < streetRoute.length - 1) {
        step++;
        setTruckPos(streetRoute[step]);
      } else {
        step = 0;
      }
    }, 200); // 200ms por vértice para un movimiento súper fluido
    return () => clearInterval(interval);
  }, [streetRoute]);

  // Lógica del Lienzo de Firma Digital
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Obtener coordenadas relativas al canvas (soporta mouse y touch)
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const handleSaveSignature = async () => {
    if (!canvasRef.current || currentStopId === null) return;
    const signatureBase64 = canvasRef.current.toDataURL("image/png");
    
    try {
      await api.patch(`/stops/${currentStopId}/deliver`, {
        delivered: true,
        signature_data: signatureBase64
      });
      setDeliveredStops([...deliveredStops, currentStopId]);
      setSignatureModalOpen(false);
      setCurrentStopId(null);
    } catch (err) {
      alert("Error guardando comprobante.");
    }
  };

  return (
    <div className="relative w-full h-full animate-[fadeIn_0.5s_ease-out]">
      {/* ETA HUD Flotante */}
      {etaStr && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-black/80 text-white px-6 py-3 rounded-full border border-indigo-500/50 shadow-[0_10px_30px_rgba(99,102,241,0.5)] flex items-center gap-4 backdrop-blur-md animate-[slideInDown_0.5s_ease-out]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <span className="font-bold tracking-wider">{etaStr}</span>
          </div>
          <div className="w-px h-5 bg-white/20"></div>
          <div className="flex items-center gap-2 text-indigo-300">
            <span className="text-xl">🛣️</span>
            <span className="font-bold tracking-wider">{distanceStr}</span>
          </div>
        </div>
      )}

      <MapHUD truckPos={truckPos} />

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <MapContainer center={depotPos} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        {streetRoute.length > 0 && (
          <Polyline positions={streetRoute} color="#4f46e5" weight={5} opacity={0.8} dashArray="10, 10" />
        )}
        
        <Marker position={depotPos} icon={depotIcon}>
          <Popup><strong>Almacén Central</strong><br/>Origen de operaciones</Popup>
        </Marker>
        
        {stops.map((stop: any, idx: number) => {
          const isDelivered = deliveredStops.includes(stop.id);
          return (
            <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={createStopIcon(idx + 1)}>
              <Popup>
                <div className="min-w-[150px]">
                  <strong>{stop.name}</strong><br/>
                  {stop.tracking_number && <div className="text-xs font-mono text-indigo-600 font-bold bg-indigo-50 p-1 rounded mt-1">Guía: {stop.tracking_number}</div>}
                  <span className="text-xs text-gray-500">{stop.address}</span><br/>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs">Peso: {stop.weight}kg</span>
                    {stop.price && <span className="text-sm font-bold text-emerald-600">${stop.price}</span>}
                  </div>
                  
                  {isDelivered ? (
                    <div className="mt-3 bg-green-100 text-green-700 p-2 rounded text-center text-xs font-bold border border-green-300">
                      ✓ ENTREGADO Y FIRMADO
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => window.open(`https://www.waze.com/ul?ll=${stop.lat},${stop.lng}&navigate=yes`)} 
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded text-xs font-bold shadow transition-colors"
                      >
                        📍 Waze
                      </button>
                      <button 
                        onClick={() => { setCurrentStopId(stop.id); setSignatureModalOpen(true); }}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-2 rounded text-xs font-bold shadow transition-colors"
                      >
                        ✍️ Entregar
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {streetRoute.length > 0 && (
          <Marker position={truckPos} icon={truckIcon} />
        )}
      </MapContainer>

      {/* Modal de Firma Digital (POD) */}
      {signatureModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[2000] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md flex flex-col shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-1 mt-2 text-center">Firma Electrónica</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">Por favor firme para conformar la recepción del paquete.</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden shadow-inner touch-none">
              <canvas
                ref={canvasRef}
                width={400}
                height={250}
                className="w-full bg-white cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
                style={{ touchAction: 'none' }}
              />
            </div>
            
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => { setSignatureModalOpen(false); setCurrentStopId(null); }} 
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveSignature} 
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.4)] transition-all"
              >
                Guardar y Entregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapDashboard;
