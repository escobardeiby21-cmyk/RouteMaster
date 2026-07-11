import React, { useState, useEffect } from 'react';
import api from '../api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const LocationMarker = ({ position, setPosition }: any) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position && position.lat && position.lng) {
      map.flyTo([position.lat, position.lng], 16, { animate: true, duration: 1.5 });
    }
  }, [position.lat, position.lng, map]);

  const icon = L.divIcon({
    html: `<div class="w-10 h-10 -ml-5 -mt-10 flex items-center justify-center text-4xl drop-shadow-xl animate-bounce">📍</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true} 
      icon={icon}
      eventHandlers={{
        dragend: (e) => setPosition(e.target.getLatLng())
      }}
    />
  );
};

const ClientPortal = ({ onBack }: { onBack: () => void }) => {
  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [weight, setWeight] = useState(10);
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Verificación de Mapa (Live)
  const [tempLat, setTempLat] = useState<number>(39.4699); // Inicia en Valencia
  const [tempLng, setTempLng] = useState<number>(-0.3774);
  
  // Live Geocoding con Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (address.length > 5) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${address}, España`)}&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            setTempLat(parseFloat(data[0].lat));
            setTempLng(parseFloat(data[0].lon));
          }
        } catch(e) {
          console.error("Error geocoding", e);
        }
      }
    }, 1000); // 1 segundo de retraso para no bloquear el API

    return () => clearTimeout(delayDebounceFn);
  }, [address]);
  
  // Nuevos estados para Pricing y Tracking
  const [activeTab, setActiveTab] = useState<'order' | 'track'>('order');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [price, setPrice] = useState(0);
  
  // Estados para Tracking View
  const [searchTrack, setSearchTrack] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState('');
  
  // Simulador Holográfico de SMS
  const [showNotification, setShowNotification] = useState(false);

  const confirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempLat || !tempLng) return;
    setGeocoding(true);
    try {
      const res = await api.post('/public/order', {
        client_name: clientName,
        address: address,
        lat: tempLat,
        lng: tempLng,
        weight,
        phone,
        details
      });
      
      setTrackingNumber(res.data.tracking_number);
      setPrice(res.data.price);
      setSuccess(true);
      
      // Disparar la notificación futurista 1.5 segundos después
      setTimeout(() => setShowNotification(true), 1500);
    } catch (err) {
      alert("Hubo un error guardando el pedido.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackResult(null);
    try {
      const res = await api.get(`/public/track/${searchTrack}`);
      setTrackResult(res.data);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setTrackError("Número de guía no encontrado.");
      } else {
        setTrackError("Error de conexión.");
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-12 px-4 bg-bg-main bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-y-auto h-screen w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-bg-main via-bg-main to-primary/10 opacity-90"></div>
      
      <div className="z-10 w-full max-w-lg">
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 mb-8 backdrop-blur-sm">
          <button 
            onClick={() => { setActiveTab('order'); setSuccess(false); }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'order' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            📦 Enviar Paquete
          </button>
          <button 
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'track' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            📍 Rastrear Paquete
          </button>
        </div>

        {activeTab === 'order' ? (
          success ? (
            <div className="bg-white/5 backdrop-blur-xl border border-green-500/30 p-10 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.2)] text-center relative z-10 max-w-md w-full">
              <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 border border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.4)]">✓</div>
              <h2 className="text-3xl font-bold text-white mb-2">¡Solicitud Recibida!</h2>
              <p className="text-gray-400 mb-8">Nuestra Inteligencia Artificial ha registrado tu paquete. Un camión será asignado para pasar a recogerlo pronto.</p>
              <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-6 text-left">
                <p className="text-sm text-gray-300 mb-2">Guarda este número para rastrear tu envío:</p>
                <div className="text-3xl font-mono font-bold text-white tracking-widest bg-black/30 p-3 rounded-lg text-center border border-primary/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  {trackingNumber}
                </div>
                <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-4">
                  <span className="text-gray-300">Costo Estimado:</span>
                  <span className="text-2xl font-bold text-emerald-400">${price.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => { setSuccess(false); setTrackingNumber(''); setShowNotification(false); setAddress(''); setDetails(''); setPhone(''); setWeight(10); }} className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-all">Hacer otro envío</button>
              <button onClick={onBack} className="w-full mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold py-3 rounded-xl border border-red-500/30 transition-colors">Volver al Menú Principal (Administrador)</button>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10 max-w-lg w-full">
              <button onClick={onBack} className="w-full bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold py-4 px-4 rounded-xl border border-indigo-500/30 mb-8 flex items-center justify-center gap-3 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:-translate-y-1">
                <span className="text-2xl">⬅</span> Volver al Menú Principal
              </button>
              <h1 className="text-3xl font-bold text-white mb-2">Portal de Clientes</h1>
              <p className="text-gray-400 mb-8">Registra la dirección de entrega de tu pedido. El mapa rastreará tu ubicación en tiempo real.</p>
              <form onSubmit={confirmOrder} className="flex flex-col gap-5">
                <div>
                  <label className="text-xs text-primary mb-1 block uppercase tracking-wider font-bold">Tu Nombre / Empresa</label>
                  <input required className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Ej. Juan Pérez" />
                </div>
                
                <div>
                  <label className="text-xs text-primary mb-1 block uppercase tracking-wider font-bold">Dirección Completa</label>
                  <input required className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Ej. Calle Gran Vía 15, Requena, Valencia" />
                </div>
                
                {/* Mapa Interactivo Inline */}
                <div className="h-48 w-full rounded-xl overflow-hidden border border-white/20 relative z-0 shadow-inner">
                  <MapContainer center={[tempLat, tempLng]} zoom={16} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <LocationMarker position={{ lat: tempLat, lng: tempLng }} setPosition={(pos: any) => { setTempLat(pos.lat); setTempLng(pos.lng); }} />
                  </MapContainer>
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs p-2 rounded-lg z-[1000] text-center border border-white/10 pointer-events-none">
                    Arrastra el mapa si el Pin 📍 no coincide con tu casa
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-primary mb-1 block uppercase tracking-wider font-bold">Peso (kg)</label>
                  <input required type="number" min="1" className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" value={weight} onChange={e=>setWeight(parseInt(e.target.value) || 0)} />
                </div>
                
                <div>
                  <label className="text-xs text-primary mb-1 block uppercase tracking-wider font-bold">Piso, Puerta o Indicaciones Extras</label>
                  <input className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" value={details} onChange={e=>setDetails(e.target.value)} placeholder="Ej. Piso 3. Dejar en recepción." />
                </div>

                <div>
                  <label className="text-xs text-primary mb-1 block uppercase tracking-wider font-bold">Teléfono de Contacto</label>
                  <input required type="tel" className="w-full px-4 py-3 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Ej. 614 46 04 67" />
                </div>
                <button type="submit" disabled={geocoding} className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-medium py-4 mt-2 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex justify-center items-center">
                  {geocoding ? <span className="animate-pulse">Calculando ruta de entrega...</span> : "Programar Entrega de Paquete"}
                </button>
              </form>
            </div>
          )
        ) : (
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-6">📍</div>
              <h2 className="text-3xl font-bold mb-2 text-white">Rastreo Satelital</h2>
              <p className="text-gray-400">Ingresa tu número de guía para conocer el estado y costo de tu envío.</p>
            </div>
            <form onSubmit={handleTrack} className="flex gap-2 mb-6">
              <input required className="flex-1 px-6 py-4 bg-bg-main/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary font-mono text-lg uppercase" value={searchTrack} onChange={e=>setSearchTrack(e.target.value.toUpperCase())} placeholder="Ej. RM-ABCD12" />
              <button type="submit" className="bg-primary hover:bg-blue-600 text-white font-bold px-8 rounded-xl shadow-lg transition-all">Buscar</button>
            </form>
            {trackError && <div className="text-red-400 text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">{trackError}</div>}
            {trackResult && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-4">Detalles del Envío</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase font-bold">Guía</span>
                    <span className="text-white font-mono font-bold bg-white/10 px-3 py-1 rounded">{trackResult.tracking_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase font-bold">Estado</span>
                    <span className={`px-3 py-1 rounded font-bold text-sm ${trackResult.status === 'Entregado' ? 'bg-green-500/20 text-green-400' : trackResult.status === 'En Ruta' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{trackResult.status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase font-bold">Chofer Asignado</span>
                    <span className="text-gray-200">{trackResult.driver}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase font-bold">A Pagar</span>
                    <span className="text-emerald-400 font-bold text-xl">${trackResult.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simulador Holográfico de Notificación (Celular) */}
      {showNotification && (
        <div className="fixed top-8 right-8 z-[3000] w-80 animate-[slideInDown_0.6s_ease-out]">
          <style>{`
            @keyframes slideInDown {
              0% { transform: translateY(-100%) scale(0.9); opacity: 0; }
              50% { transform: translateY(10%) scale(1.05); }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            .glass-panel {
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 20px rgba(255,255,255,0.05);
            }
          `}</style>
          
          <div className="glass-panel rounded-3xl p-5 relative overflow-hidden">
            {/* Brillo dinámico en el cristal */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent transform -translate-x-full animate-[shimmer_2s_infinite]"></div>
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/20 flex-shrink-0 animate-pulse">
                📱
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
                  Mensaje Nuevo
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Hola <strong className="text-indigo-300">{clientName.split(" ")[0]}</strong>. RouteMaster ha procesado tu orden. Rastréala con la guía: <br/>
                  <span className="inline-block mt-2 font-mono font-bold text-white bg-black/40 px-2 py-1 rounded border border-white/10">{trackingNumber}</span>
                </p>
                <button 
                  onClick={() => setShowNotification(false)}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
