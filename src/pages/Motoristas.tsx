import React from 'react';
import { UserCheck, Users } from "lucide-react";
import { ExcelButtons } from "@/components/ExcelButtons";
import InsertManyTable from "@/components/InsertManyTable";

export default function Motoristas() {
  const motoristasColumns = [
    { 
      key: 'nomeCompleto', 
      label: 'Nome Completo', 
      required: true, 
      placeholder: 'Digite o nome completo do motorista' 
    },
    { 
      key: 'codigoMzone', 
      label: 'Código MZone', 
      required: true, 
      placeholder: 'Ex: MZ001, MZ002...' 
    },
    { 
      key: 'idDriver', 
      label: 'ID Driver', 
      required: false, 
      placeholder: 'ID único do motorista' 
    }
  ];

  // Função para enviar dados para o servidor (inserção manual)
  const handleSubmitMotoristas = async (data) => {
    try {
      // Sua requisição para o servidor
      const response = await api.post('/motoristas/batch', data);
      alert(`${data.length} motorista(s) cadastrado(s) com sucesso!`);
    } catch (error) {
      alert('Erro ao cadastrar motoristas: ' + error.message);
      throw error; // Re-throw para que o componente não limpe a tabela
    }
  };

  // Função para importar dados do Excel
  const handleImportMotoristas = async (data) => {
    try {
      // Preparar dados para envio (remover _id temporário)
      const cleanData = data.map(({ _id, ...rest }) => rest);
      
      const response = await api.post('/motoristas/batch', cleanData);
      alert(`${cleanData.length} motorista(s) importado(s) com sucesso!`);
    } catch (error) {
      alert('Erro ao importar motoristas: ' + error.message);
      throw error;
    }
  };

  // Função para exportar template Excel
  const handleExportTemplate = () => {
    // Implementar export do template baseado nas colunas
    console.log('Exportando template para:', motoristasColumns);
    alert('Template Excel será baixado em breve');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Motoristas</h1>
        </div>
        
        <ExcelButtons 
          columns={motoristasColumns}
          onImport={handleImportMotoristas}
          onExport={handleExportTemplate}
          importTitle="Importar Motoristas"
        />
      </div>
      
      <InsertManyTable 
        columns={motoristasColumns}
        onSubmit={handleSubmitMotoristas}
        submitButtonText="Cadastrar Motoristas"
        icon={Users}
      />
    </div>
  );
}