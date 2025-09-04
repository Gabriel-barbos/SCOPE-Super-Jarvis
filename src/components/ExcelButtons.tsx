import React, { useState } from 'react';
import { FileDown, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExcelImportModal from './ExcelImportModal';

export const ExcelButtons = ({ 
  onImport, 
  onExport, 
  columns = [],
  importTitle = "Importar Excel"
}) => {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Função padrão de exportar template
      console.log('Exportar template Excel');
      alert('Funcionalidade de exportar será implementada');
    }
  };

  const handleImportSubmit = async (data) => {
    if (onImport) {
      await onImport(data);
      setShowImportModal(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Button 
          variant="white" 
          size="sm"
          className="shadow-elegant hover:shadow-card transition-all duration-300 hover:scale-105"
          onClick={handleExport}
        >
          <FileDown className="w-4 h-4" />
          Baixar Modelo
        </Button>
        
        <Button 
          variant="default" 
          size="sm"
          className="bg-gradient-primary hover:opacity-90 shadow-elegant hover:shadow-card transition-all duration-300 hover:scale-105"
          onClick={() => setShowImportModal(true)}
        >
          <FileUp className="w-4 h-4" />
          Importar
        </Button>
      </div>

      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        columns={columns}
        onSubmit={handleImportSubmit}
        title={importTitle}
      />
    </>
  );
};

export default ExcelButtons;