import React, { useState, useEffect } from 'react';

export interface AddressData {
  geocodeAddress: string;
  details: string;
}

interface Props {
  title: string;
  icon: string;
  onChange: (data: AddressData) => void;
  accentColor: 'blue' | 'purple';
}

const AddressForm: React.FC<Props> = ({ title, icon, onChange, accentColor }) => {
  const [provincia, setProvincia] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [via, setVia] = useState('');
  const [numero, setNumero] = useState('');
  const [km, setKm] = useState('');
  const [hm, setHm] = useState('');
  const [bloque, setBloque] = useState('');
  const [portal, setPortal] = useState('');
  const [escalera, setEscalera] = useState('');
  const [planta, setPlanta] = useState('');
  const [puerta, setPuerta] = useState('');
  const [otros, setOtros] = useState('');

  useEffect(() => {
    // String limpio para GPS (solo via, numero, ciudad y provincia)
    const geocodeParts = [];
    if (via) geocodeParts.push(`${via} ${numero}`.trim());
    if (ciudad) geocodeParts.push(ciudad);
    if (provincia) geocodeParts.push(provincia);
    const geocode = geocodeParts.join(', ');
    
    // String detallado para el chofer
    const parts = [];
    if (provincia) parts.push(`Provincia: ${provincia}`);
    if (ciudad) parts.push(`Ciudad: ${ciudad}`);
    if (km) parts.push(`Km: ${km}`);
    if (hm) parts.push(`Hm: ${hm}`);
    if (bloque) parts.push(`Bloque: ${bloque}`);
    if (portal) parts.push(`Portal: ${portal}`);
    if (escalera) parts.push(`Esc: ${escalera}`);
    if (planta) parts.push(`Planta: ${planta}`);
    if (puerta) parts.push(`Puerta: ${puerta}`);
    if (otros) parts.push(`Otros: ${otros}`);
    
    const detailsStr = parts.join(' | ');

    onChange({
      geocodeAddress: geocode,
      details: detailsStr
    });
  }, [provincia, ciudad, via, numero, km, hm, bloque, portal, escalera, planta, puerta, otros]);

  const borderColor = accentColor === 'blue' ? 'border-blue-500/30' : 'border-purple-500/30';
  const bgColor = accentColor === 'blue' ? 'bg-blue-500/10' : 'bg-purple-500/10';
  const textColor = accentColor === 'blue' ? 'text-blue-400' : 'text-purple-400';
  const inputFocus = accentColor === 'blue' ? 'focus:border-blue-500' : 'focus:border-purple-500';

  const InputHeader = ({ label }: { label: string }) => (
    <div className={`bg-black/20 text-center text-[9px] uppercase tracking-wider text-gray-400 py-1 border-b ${borderColor} font-bold`}>
      {label}
    </div>
  );

  return (
    <div className={`${bgColor} border ${borderColor} p-4 rounded-xl shadow-inner mb-4 animate-[slideInDown_0.3s_ease-out]`}>
      <h3 className={`${textColor} font-bold mb-3 border-b ${borderColor} pb-2 flex items-center gap-2`}>
        <span className="text-xl">{icon}</span> {title}
      </h3>
      
      <div className={`border ${borderColor} rounded-lg overflow-hidden bg-bg-main/40`}>
        {/* Provincia y Ciudad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          <div>
            <InputHeader label="Provincia / Estado" />
            <input 
              className={`w-full bg-transparent px-3 py-2 text-white outline-none text-sm ${inputFocus}`}
              placeholder="Ej. Madrid"
              value={provincia}
              onChange={e => setProvincia(e.target.value)}
              required
            />
          </div>
          <div>
            <InputHeader label="Ciudad / Municipio" />
            <input 
              className={`w-full bg-transparent px-3 py-2 text-white outline-none text-sm ${inputFocus}`}
              placeholder="Ej. Alcalá de Henares"
              value={ciudad}
              onChange={e => setCiudad(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Vía */}
        <div className={`border-t ${borderColor}`}>
          <InputHeader label="Vía (Calle, Avenida, Plaza...)" />
          <input 
            className={`w-full bg-transparent px-3 py-2 text-white outline-none text-sm ${inputFocus} border-b ${borderColor}`}
            placeholder="Ej. Gran Vía"
            value={via}
            onChange={e => setVia(e.target.value)}
            required
          />
        </div>

        {/* Casillas */}
        <div className="grid grid-cols-4 sm:grid-cols-8 divide-x divide-y sm:divide-y-0 divide-white/10">
          <div className="flex flex-col">
            <InputHeader label="Número" />
            <input className={`w-full bg-transparent px-2 py-2 text-center text-white outline-none text-sm ${inputFocus}`} value={numero} onChange={e => setNumero(e.target.value)} required placeholder="Ej. 15" />
          </div>
          <div className="flex flex-col">
            <InputHeader label="Km" />
            <input className={`w-full bg-transparent px-2 py-2 text-center text-white outline-none text-sm ${inputFocus}`} value={km} onChange={e => setKm(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <InputHeader label="Hm" />
            <input className={`w-full bg-transparent px-2 py-2 text-center text-white outline-none text-sm ${inputFocus}`} value={hm} onChange={e => setHm(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <InputHeader label="Bloque" />
            <input className={`w-full bg-transparent px-2 py-2 text-center text-white outline-none text-sm ${inputFocus}`} value={bloque} onChange={e => setBloque(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <InputHeader label="Portal" />
            <input className={`w-full bg-transparent px-2 py-2 text-center text-white outline-none text-sm ${inputFocus}`} value={portal} onChange={e => setPortal(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <InputHeader label="Escalera" />
            <input className={`w-full bg-transparent px-2 py-2 text-center text-white outline-none text-sm ${inputFocus}`} value={escalera} onChange={e => setEscalera(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <InputHeader label="Planta" />
            <input className={`w-full bg-transparent px-2 py-2 text-center text-white outline-none text-sm ${inputFocus}`} value={planta} onChange={e => setPlanta(e.target.value)} placeholder="P03" />
          </div>
          <div className="flex flex-col">
            <InputHeader label="Puerta" />
            <input className={`w-full bg-transparent px-2 py-2 text-center text-white outline-none text-sm ${inputFocus}`} value={puerta} onChange={e => setPuerta(e.target.value)} placeholder="0006" />
          </div>
        </div>

        {/* Otros */}
        <div className={`border-t ${borderColor}`}>
          <InputHeader label="Otros (Indicaciones Extras)" />
          <input 
            className={`w-full bg-transparent px-3 py-2 text-white outline-none text-sm ${inputFocus}`}
            placeholder="Ej. Dejar en recepción, casa de rejas negras..."
            value={otros}
            onChange={e => setOtros(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
