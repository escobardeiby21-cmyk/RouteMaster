import React, { useState, useEffect } from 'react';
import api from '../api';

const OrdersPanel = ({ onRouteOptimized }: { onRouteOptimized: (data: any) => void }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      const res = await api.post('/token', formData);
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
    } catch (err) {
      alert("Error al iniciar sesión.");
    }
  };

  const fetchPendingOrders = async () => {
    if (!token) return;
    try {
      const res = await api.get('/pending_orders');
      setPendingOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDrivers = async () => {
    if (!token) return;
    try {
      // Intentar crear un chofer por defecto si no hay ninguno
      await api.post('/drivers/?name=Chofer_1').catch(() => {});
      await api.post('/drivers/?name=Chofer_2').catch(() => {});
      
      const res = await api.get('/drivers/');
      setDrivers(res.data);
      if (res.data.length > 0 && selectedDrivers.length === 0) {
        setSelectedDrivers([res.data[0].id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    fetchDrivers();
    const interval = setInterval(fetchPendingOrders, 3000); // Poll every 3 seconds for new orders
    return () => clearInterval(interval);
  }, [token]);

  const toggleDriver = (driverId: number) => {
    setSelectedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const handleOptimize = async () => {
    if (pendingOrders.length === 0) return alert("No hay pedidos pendientes de clientes.");
    if (selectedDrivers.length === 0) return alert("Debes seleccionar al menos un chofer para despachar.");
    
    setLoading(true);
    try {
      const payload = {
        driver_ids: selectedDrivers,
        vehicle_capacities: selectedDrivers.map(() => 500), // Capacidad estándar para todos
        depot: { id: "depot", name: "Almacén Central", lat: 39.4699, lng: -0.3774, weight: 0 },
        deliveries: pendingOrders,
        use_real_maps: false
      };

      const res = await api.post('/optimize-and-save-multi-route', payload);
      // Tras optimizar, en la vida real estos pedidos pasarían a "asignados".
      // Por ahora, borramos la lista visual y se lo pasamos al mapa.
      setPendingOrders([]);
      onRouteOptimized({ routeData: res.data, customStops: pendingOrders });
    } catch (err: any) {
      alert("Error optimizando: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg-card">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(99,102,241,0.5)] mb-6">🔒</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Acceso Restringido</h2>
        <form onSubmit={handleLogin} className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-4 w-80 mt-6 shadow-xl">
          <input className="px-4 py-3 bg-bg-main border border-border-color rounded-xl text-white outline-none focus:border-primary" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Usuario" />
          <input type="password" className="px-4 py-3 bg-bg-main border border-border-color rounded-xl text-white outline-none focus:border-primary" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" />
          <button type="submit" className="bg-primary hover:bg-blue-600 text-white font-medium py-3 rounded-xl shadow-lg transition-all">Desbloquear Panel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 text-white overflow-y-auto bg-bg-card flex flex-col h-full relative">
      
      {/* Overlay de Carga (IA Procesando) */}
      {loading && (
        <div className="absolute inset-0 bg-bg-main/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center rounded-2xl">
          <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-primary rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(99,102,241,0.5)]"></div>
          <h3 className="text-2xl font-bold text-white mb-2 animate-pulse drop-shadow-lg">Calculando ruta óptima con IA...</h3>
          <p className="text-indigo-300 text-sm tracking-widest uppercase font-bold">Mapeando coordenadas terrestres por satélite</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 border-b border-border-color pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bandeja de Entrada (En Vivo)</h2>
          <p className="text-gray-400 mt-1">Solicitudes entrantes desde el Portal Web Público</p>
        </div>
        <button 
          onClick={handleOptimize} 
          disabled={loading || pendingOrders.length === 0}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-700 px-6 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? "Optimizando con IA..." : "⚡ Asignar Ruta y Despachar"}
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0 justify-center">
        {/* Tabla de Paradas Dinámicas que lee la Base de Datos */}
        <div className="w-2/3 bg-white/5 border border-border-color rounded-2xl p-6 shadow-xl flex flex-col overflow-hidden relative">
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-200 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Paquetes sin asignar
            </h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder="🔍 Buscar por nombre, guía o tlf..." 
                className="bg-bg-main border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary outline-none w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {pendingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <div className="text-4xl mb-4 opacity-50">📭</div>
                <p className="italic">No hay solicitudes pendientes.</p>
                <p className="text-xs mt-2">Abre el Portal Público y haz una petición para verla aparecer aquí.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.filter(stop => 
                  stop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (stop.tracking_number && stop.tracking_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (stop.phone && stop.phone.includes(searchTerm))
                ).map((stop, i) => (
                  <div key={stop.id} className="bg-bg-main border border-border-color p-4 rounded-xl flex justify-between items-center hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-100 text-sm">{stop.name}</h4>
                        <p className="text-xs text-gray-400 line-clamp-1">{stop.address}</p>
                        
                        <div className="mt-2 text-[10px] font-mono flex flex-wrap gap-2">
                          {stop.tracking_number && <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">📦 {stop.tracking_number}</span>}
                          {stop.phone && <span className="bg-white/5 text-gray-300 px-2 py-0.5 rounded border border-white/10">📞 {stop.phone}</span>}
                          {stop.package_type && <span className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">🏷️ {stop.package_type}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {stop.price && <div className="text-emerald-400 font-bold mb-1">${stop.price.toFixed(2)}</div>}
                      <p className="text-xs text-green-400 font-bold mt-2">{stop.weight} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Selección de Choferes (Compacto) */}
        <div className="w-1/3 bg-white/5 border border-border-color rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-2xl">🧠</span> Despacho IA
            </h3>
            <p className="text-xs text-gray-400">Selecciona tu flota disponible y la Inteligencia Artificial se encargará de trazar las rutas óptimas.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar mb-4 border border-white/5 rounded-xl p-2 bg-bg-main/50">
            {drivers.map(driver => (
              <label key={driver.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${selectedDrivers.includes(driver.id) ? 'bg-primary/20 border-primary shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-bg-main border-border-color hover:border-gray-500'}`}>
                <input 
                  type="checkbox" 
                  checked={selectedDrivers.includes(driver.id)}
                  onChange={() => toggleDriver(driver.id)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary bg-bg-card border-gray-600"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-gray-100 text-sm">🚚 {driver.name}</span>
                </div>
              </label>
            ))}
            {drivers.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">No hay choferes en la base de datos.</div>
            )}
          </div>

          <button 
            onClick={handleOptimize} 
            disabled={loading || pendingOrders.length === 0 || selectedDrivers.length === 0}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-500 hover:to-emerald-400 py-4 rounded-xl font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? <span className="animate-pulse">Calculando...</span> : "⚡ Optimizar y Asignar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersPanel;
