import React from 'react';

const InstallAppModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 text-left">
      <div className="bg-bg-card max-w-md w-full border border-white/20 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl font-bold">✕</button>
        <div className="text-5xl text-center mb-4">📲</div>
        <h2 className="text-2xl font-bold text-white text-center mb-6">Obtener la App</h2>
        
        <div className="space-y-4">
          {/* Opción A: Descarga Directa APK */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center">
            <h3 className="text-emerald-400 font-bold mb-2 text-lg">Descarga Directa (Android)</h3>
            <p className="text-emerald-100 text-sm mb-4">Descarga el archivo instalador nativo.</p>
            <a 
              href="https://github.com/escobardeiby21-cmyk/RouteMaster/releases/latest/download/app-debug.apk" 
              className="inline-flex w-full justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:scale-105"
            >
              ⬇️ Descargar RouteMaster.apk
            </a>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase font-bold">O instala sin descargar</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Opción B: Safari */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <h3 className="text-gray-200 font-bold flex items-center gap-2 mb-2">
              <span className="text-xl">
                <svg viewBox="0 0 384 512" fill="currentColor" className="w-5 h-5"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
              </span> 
              En iPhone / Safari
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              1. Toca el ícono de <strong>Compartir</strong> en la barra inferior.<br/>
              2. Selecciona <strong>"Agregar a inicio"</strong> ➕.
            </p>
          </div>
          
          {/* Opción C: Chrome */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <h3 className="text-blue-400 font-bold flex items-center gap-2 mb-2">
              <span className="text-xl">
                <svg viewBox="0 0 576 512" fill="currentColor" className="w-5 h-5"><path d="M420.22 77.29L467.4 3.78a10.84 10.84 0 0 0-3.32-15 10.74 10.74 0 0 0-14.89 3.31L400.91 67.24a275 275 0 0 0-225.82 0L126.81-7.89a10.74 10.74 0 0 0-14.89-3.31 10.84 10.84 0 0 0-3.32 15l47.18 73.51a283.43 283.43 0 0 0-128.53 143.5h521.46a283.42 283.42 0 0 0-128.49-143.52zM193.38 181.75a25.43 25.43 0 1 1 25.43-25.43 25.43 25.43 0 0 1-25.43 25.43zm189.24 0a25.43 25.43 0 1 1 25.43-25.43 25.43 25.43 0 0 1-25.43 25.43zM27.25 244.53v140c0 40 32.41 72.43 72.43 72.43h376.64c40 0 72.43-32.42 72.43-72.43v-140zm421.36 128.18c-30.84 0-55.85-25-55.85-55.84s25-55.84 55.85-55.84 55.84 25 55.84 55.84-25.01 55.84-55.84 55.84zm-222 17.57a151.76 151.76 0 0 1-99.34-37 14.59 14.59 0 0 1 19.33-21.78 122.58 122.58 0 0 0 80 29.59 123.51 123.51 0 0 0 79.52-29.27 14.59 14.59 0 1 1 19.06 22 152.61 152.61 0 0 1-98.57 36.44z"/></svg>
              </span> 
              En Android / Chrome
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              1. Toca los <strong>3 puntitos</strong> ⋮ arriba a la derecha.<br/>
              2. Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a inicio".
            </p>
          </div>
        </div>
        
        <button onClick={onClose} className="w-full bg-transparent border border-white/20 hover:bg-white/10 text-white font-bold py-3 rounded-xl mt-6 transition-colors">
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default InstallAppModal;
