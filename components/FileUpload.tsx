import React, { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import { processExcelData } from '../utils/processor';
import { ProcessedCompany, DatasetStats } from '../types';

interface FileUploadProps {
  onDataProcessed: (data: ProcessedCompany[], stats: DatasetStats) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataProcessed }) => {
  
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });

      // Identify Sheets
      const wsEmpresas = wb.Sheets[wb.SheetNames[0]]; // Assume 1st is Companies
      const wsProfesionales = wb.Sheets[wb.SheetNames[1]]; // Assume 2nd is Pros
      const wsDatos = wb.Sheets[wb.SheetNames[2]]; // Assume 3rd is Eco Data

      const rawCompanies = XLSX.utils.sheet_to_json(wsEmpresas);
      const rawProfessionals = XLSX.utils.sheet_to_json(wsProfesionales);
      const rawEconomics = XLSX.utils.sheet_to_json(wsDatos);

      // Process
      const { processed, stats } = processExcelData(rawCompanies as any[], rawProfessionals as any[], rawEconomics as any[]);
      
      onDataProcessed(processed, stats);
    };
    reader.readAsBinaryString(file);
  }, [onDataProcessed]);

  return (
    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-colors">
      <FileSpreadsheet className="w-16 h-16 text-blue-500 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Cargar archivo Excel</h3>
      <p className="text-gray-500 text-sm mb-6 text-center max-w-md">
        El archivo debe contener tres pestañas: Empresas, Profesionales y Datos Económicos según la estructura definida.
      </p>
      
      <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md flex items-center gap-2 transition-transform active:scale-95">
        <UploadCloud className="w-5 h-5" />
        <span>Seleccionar Archivo</span>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
      </label>
    </div>
  );
};