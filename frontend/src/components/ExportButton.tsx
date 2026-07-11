import React from 'react';

interface ExportButtonProps {
  data: any[];
  filename: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, filename }) => {
  const exportToCSV = () => {
    if (!data || !data.length) {
      alert("No hay datos para exportar.");
      return;
    }

    // 1. Obtener las cabeceras (nombres de las columnas)
    const headers = Object.keys(data[0]);

    // 2. Crear las filas de texto unidas por comas
    const csvRows = [];
    csvRows.push(headers.join(',')); // Cabecera

    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"'); // Escapar comillas dobles
        return `"${escaped}"`; // Envolver en comillas para evitar problemas con comas en el texto
      });
      csvRows.push(values.join(','));
    }

    // 3. Crear el archivo (Blob)
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // 4. Descargar forzadamente el archivo
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={exportToCSV}
      className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2"
    >
      <span>📊</span> Exportar a Excel
    </button>
  );
};

export default ExportButton;
