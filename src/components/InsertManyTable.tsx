import React, { useState,useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2,  Check, X, AlertCircle,SendHorizontal } from "lucide-react";
import { toast } from 'sonner';

const InsertManyTable = ({ 
  columns, 
  onSubmit,
  submitButtonText = "Cadastrar Registros",
  icon: Icon,
  initialData = []
}) => {
  const PAGE_SIZE = 50;

  function createEmptyRow() {
    const newRow: any = { id: Date.now() };
    columns.forEach(col => newRow[col.key] = '');
    return newRow;
  }
  function addIds(rows: any[]) {
    return rows.map((row, index) => ({ id: Date.now() + index, ...row }));
  }

  const [data, setData] = useState<any[]>(() => 
    initialData.length > 0 ? addIds(initialData) : [createEmptyRow()]
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setData(addIds(initialData));
      setCurrentPage(1);
    }
  }, [initialData]);

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const pasteAreaRef = useRef(null);

  const addRow = () => {
    setData([...data, createEmptyRow()]);
  };

  const removeRow = (id) => {
    if (data.length > 1) {
      setData(data.filter(row => row.id !== id));
    }
  };

  const startEditing = (rowId, columnKey, currentValue) => {
    setEditingCell({ rowId, columnKey });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingCell) {
      setData(data.map(row => 
        row.id === editingCell.rowId 
          ? { ...row, [editingCell.columnKey]: editValue.trim() }
          : row
      ));
    }
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handlePaste = useCallback((pastedText) => {
    try {
      const lines = pastedText.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) return;

      const newData = lines.map((line, index) => {
        const values = line.split(/\t|,|;/).map(val => val.trim().replace(/["']/g, ''));
        const row = { id: Date.now() + index };
        columns.forEach((col, colIndex) => {
          row[col.key] = values[colIndex] || '';
        });
        return row;
      });

      setData(newData);
      setCurrentPage(1);
    } catch (error) {
      console.error('Erro ao processar dados colados:', error);
      alert('Erro ao processar os dados colados. Verifique o formato dos dados.');
    }
  }, [columns]);

  const handlePasteAreaChange = (e) => {
    const pastedText = e.target.value;
    if (pastedText) {
      handlePaste(pastedText);
      e.target.value = '';
    }
  };

  const isRowValid = (row) => {
    return columns.filter(col => col.required).every(col => row[col.key]?.trim());
  };

  const hasDuplicates = () => {
    const uniqueFields = columns.filter(col => col.unique);
    if (uniqueFields.length === 0) return false;
    for (const field of uniqueFields) {
      const values = data.filter(row => row[field.key]?.trim()).map(row => row[field.key].trim());
      if (values.length !== new Set(values).size) return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    const validData = data.filter(isRowValid);
    if (validData.length === 0) {
      toast.error('Nenhum registro válido para envio. Preencha todos os campos obrigatórios.');
      return;
    }
    if (hasDuplicates()) {
      toast.error('Existem valores duplicados em campos únicos. Corrija antes de prosseguir.');
      return;
    }
    const cleanData = validData.map(row => {
      const { id, ...cleanRow } = row;
      return cleanRow;
    });

    if (onSubmit) {
      try {
        await onSubmit(cleanData);
        clearTable();
      } catch (error) {
        console.error('Erro ao enviar dados:', error);
      }
    }
  };

  const clearTable = () => {
    setData([createEmptyRow()]);
    setCurrentPage(1);
  };

  const generatePlaceholder = () => {
    const example = columns.map(col => col.placeholder || col.label).join('    ');
    return `Cole os dados do Excel aqui...\n`;
  };


  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginatedData = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Controles */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-border rounded-lg transition-colors shadow-sm">
          <Plus size={16} /> Nova Linha
        </button>
        <button onClick={clearTable} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-border rounded-lg transition-colors shadow-sm">
          <X size={16} /> Limpar Tudo
        </button>
        <button onClick={handleSubmit} className="flex items-center gap-2 px-4 py-2 bg-gradient-primary hover:bg-blue-700 text-black rounded-lg transition-colors shadow-sm">
          <SendHorizontal size={16} /> {submitButtonText} ({data.filter(isRowValid).length})
        </button>
      </div>

      {/* Área de colagem */}
      <div className="mb-6">
        <textarea ref={pasteAreaRef} onChange={handlePasteAreaChange} placeholder={generatePlaceholder()} className="w-full h-24 p-3 bg-background border border-border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-foreground placeholder:text-muted-foreground"/>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Copie dados do Excel (Ctrl+C) e cole aqui (Ctrl+V).
        </p>
      </div>

      {hasDuplicates() && (
        <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle size={20} />
            <span className="font-medium">Valores duplicados detectados!</span>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {col.label}{col.required && <span className="text-red-500 ml-1">*</span>}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedData.map((row, rowIndex) => (
                <tr key={row.id} className={`hover:bg-muted/20 transition-colors ${isRowValid(row) ? 'bg-green-950/30' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {(currentPage - 1) * PAGE_SIZE + rowIndex + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={`${row.id}-${col.key}`} className="px-4 py-2">
                      {editingCell?.rowId === row.id && editingCell?.columnKey === col.key ? (
                        <div className="flex items-center gap-2">
                          <input
                            type={col.type || "text"}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                            placeholder={col.placeholder}
                            className="flex-1 px-3 py-2 bg-background border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <button onClick={saveEdit} className="p-1 text-green-400 hover:bg-green-950/30 rounded"><Check size={16} /></button>
                          <button onClick={cancelEdit} className="p-1 text-red-400 hover:bg-red-950/30 rounded"><X size={16} /></button>
                        </div>
                      ) : (
                        <div onClick={() => startEditing(row.id, col.key, row[col.key])} className="cursor-pointer p-3 rounded-md hover:bg-muted/30 min-h-[40px] flex items-center">
                          {row[col.key] || <span className="text-muted-foreground italic text-sm">{col.placeholder || `Digite ${col.label.toLowerCase()}`}</span>}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => removeRow(row.id)} disabled={data.length === 1} className="p-2 text-red-400 hover:bg-red-950/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 bg-white border rounded disabled:opacity-50">Anterior</button>
          <span>Página {currentPage} de {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 bg-white border rounded disabled:opacity-50">Próxima</button>
        </div>
      )}

      {/* Estatísticas */}
      <div className="mt-6 bg-muted/20 border border-border rounded-lg p-4">
        <div className="flex justify-between items-center text-sm">
          <div className="flex gap-6 text-muted-foreground">
            <span>Total: <strong>{data.length}</strong></span>
            <span className="text-green-400">Completos: <strong>{data.filter(isRowValid).length}</strong></span>
            <span className="text-red-400">Incompletos: <strong>{data.length - data.filter(isRowValid).length}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsertManyTable;
