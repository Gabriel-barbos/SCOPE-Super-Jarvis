import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Check, X, SendHorizontal, RefreshCw, ChevronDown } from "lucide-react";
import CreateUserService from "@/services/CreateUserService";

const CreateUserTable = ({ 
  onSubmit,
  submitButtonText = "Criar Usuários",
  initialData = []
}) => {
  const PAGE_SIZE = 50;
  const CARGO_OPTIONS = ['Básico', 'Gestor', 'Master'];

  const [securityGroups, setSecurityGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [data, setData] = useState(() => 
    initialData.length > 0 ? addIds(initialData) : [createEmptyRow()]
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const pasteAreaRef = useRef(null);

  useEffect(() => {
    carregarUserGroups();
  }, []);

  useEffect(() => {
    if (initialData?.length > 0) {
      setData(addIds(initialData));
      setCurrentPage(1);
    }
  }, [initialData]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atualiza posição do dropdown quando aberto
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [showDropdown, editingCell]);

  function createEmptyRow() {
    return {
      id: Date.now(),
      email: '',
      descricao: '',
      login: '',
      senha: '',
      cargo: '',
      grupoSeguranca: ''
    };
  }

  function addIds(rows) {
    return rows.map((row, index) => ({ id: Date.now() + index, ...row }));
  }

  const carregarUserGroups = async () => {
    setLoadingGroups(true);
    try {
      const grupos = await CreateUserService.listarSecurityGroups();
      setSecurityGroups(grupos);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const addRow = () => setData([...data, createEmptyRow()]);

  const removeRow = (id) => {
    if (data.length > 1) {
      setData(data.filter(row => row.id !== id));
    }
  };

  const startEditing = (rowId, columnKey, currentValue) => {
    setEditingCell({ rowId, columnKey });
    setEditValue(currentValue);
    if (columnKey === 'grupoSeguranca') {
      setSearchTerm('');
      setTimeout(() => setShowDropdown(true), 50);
    }
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
    setShowDropdown(false);
    setSearchTerm('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handlePaste = useCallback((pastedText) => {
    try {
      const lines = pastedText.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) return;

      const newData = lines.map((line, index) => {
        const values = line.split(/\t|,|;/).map(val => val.trim().replace(/["']/g, ''));
        return {
          id: Date.now() + index,
          email: values[0] || '',
          descricao: values[1] || '',
          login: values[2] || '',
          senha: values[3] || '',
          cargo: values[4] || '',
          grupoSeguranca: values[5] || ''
        };
      });

      setData(newData);
      setCurrentPage(1);
    } catch (error) {
      console.error('Erro ao processar dados colados:', error);
    }
  }, []);

  const handleSubmit = async () => {
    const validData = data.filter(row => 
      row.email?.trim() && 
      row.login?.trim() && 
      row.senha?.trim() && 
      row.cargo?.trim() && 
      row.grupoSeguranca?.trim()
    );

    if (validData.length === 0) {
      alert('Nenhum registro válido para envio.');
      return;
    }

    const cleanData = validData.map(({ id, ...row }) => row);

    if (onSubmit) {
      try {
        await onSubmit(cleanData);
        setData([createEmptyRow()]);
        setCurrentPage(1);
      } catch (error) {
        console.error('Erro ao enviar dados:', error);
      }
    }
  };

  const getGroupLabel = (groupId) => {
    const group = securityGroups.find(g => g.id === groupId);
    return group?.description || group?.nome || groupId;
  };

  const filteredGroups = securityGroups.filter(group => {
    const label = group.description || group.nome || group.id || '';
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginatedData = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const validCount = data.filter(row => 
    row.email?.trim() && row.login?.trim() && row.senha?.trim() && row.cargo?.trim() && row.grupoSeguranca?.trim()
  ).length;

  const columns = [
    { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'usuario@exemplo.com' },
    { key: 'descricao', label: 'Descrição', type: 'text', placeholder: 'Descrição do usuário' },
    { key: 'login', label: 'Login', type: 'text', required: true, placeholder: 'nome.usuario' },
    { key: 'senha', label: 'Senha', type: 'password', required: true, placeholder: 'Senha123!' },
    { key: 'cargo', label: 'Cargo', type: 'select', required: true, options: CARGO_OPTIONS },
    { key: 'grupoSeguranca', label: 'Grupo de Segurança', type: 'autocomplete', required: true }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Controles */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-border rounded-lg transition-smooth shadow-sm">
          <Plus size={16} /> Nova Linha
        </button>
        <button onClick={() => { setData([createEmptyRow()]); setCurrentPage(1); }} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-border rounded-lg transition-smooth shadow-sm">
          <X size={16} /> Limpar Tudo
        </button>
        <button 
          onClick={carregarUserGroups} 
          disabled={loadingGroups}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-border rounded-lg transition-smooth shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={loadingGroups ? 'animate-spin' : ''} /> 
          Atualizar Grupos
        </button>
        <button onClick={handleSubmit} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-smooth shadow-sm">
          <SendHorizontal size={16} /> {submitButtonText} ({validCount})
        </button>
      </div>

      {/* Área de colagem */}
      <div className="mb-6">
        <textarea 
          ref={pasteAreaRef} 
          onChange={(e) => {
            if (e.target.value) {
              handlePaste(e.target.value);
              e.target.value = '';
            }
          }} 
          placeholder="Cole os dados do Excel aqui...&#10;Formato: Email    Descrição    Login    Senha    Cargo    Grupo de Segurança" 
          className="w-full h-24 p-3 bg-background border border-border rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground transition-fast"
        />
        <p className="text-xs text-muted-foreground mt-2">
          💡 Copie dados do Excel (Ctrl+C) e cole aqui (Ctrl+V).
        </p>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {col.label}{col.required && <span className="text-destructive ml-1">*</span>}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedData.map((row, rowIndex) => (
                <tr key={row.id} className="hover:bg-muted/20 transition-fast">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {(currentPage - 1) * PAGE_SIZE + rowIndex + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={`${row.id}-${col.key}`} className="px-4 py-2 relative">
                      {editingCell?.rowId === row.id && editingCell?.columnKey === col.key ? (
                        <div className="flex items-center gap-2">
                          {col.type === 'select' ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              autoFocus
                              className="flex-1 px-3 py-2 bg-background border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground"
                            >
                              <option value="">Selecione...</option>
                              {col.options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : col.type === 'autocomplete' ? (
                            <div className="flex-1 relative">
                              <div className="flex items-center">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={searchTerm || getGroupLabel(editValue)}
                                  onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                  }}
                                  onFocus={() => setShowDropdown(true)}
                                  placeholder="Pesquisar grupo..."
                                  autoFocus
                                  className="w-full px-3 py-2 pr-8 bg-background border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground"
                                />
                                <ChevronDown size={16} className="absolute right-2 text-muted-foreground pointer-events-none" />
                              </div>
                            </div>
                          ) : (
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
                              className="flex-1 px-3 py-2 bg-background border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground"
                            />
                          )}
                          <button onClick={saveEdit} className="p-1 text-green-400 hover:bg-green-950/30 rounded transition-fast">
                            <Check size={16} />
                          </button>
                          <button onClick={cancelEdit} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-fast">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => startEditing(row.id, col.key, row[col.key])} 
                          className="cursor-pointer p-3 rounded-md hover:bg-muted/30 min-h-[40px] flex items-center transition-fast"
                        >
                          {row[col.key] ? (
                            col.type === 'password' ? '••••••••' : 
                            col.key === 'grupoSeguranca' ? getGroupLabel(row[col.key]) :
                            row[col.key]
                          ) : (
                            <span className="text-muted-foreground italic text-sm">
                              {col.placeholder || `Digite ${col.label.toLowerCase()}`}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => removeRow(row.id)} 
                      disabled={data.length === 1} 
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown Portal - Renderizado fora da tabela */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999
          }}
          className="mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => {
                  setEditValue(group.id);
                  setSearchTerm('');
                  setShowDropdown(false);
                }}
                className="px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm text-popover-foreground transition-fast"
              >
                {group.description || group.nome || group.id}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {loadingGroups ? 'Carregando grupos...' : 'Nenhum grupo encontrado'}
            </div>
          )}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)} 
            className="px-3 py-1 bg-card border border-border rounded disabled:opacity-50 hover:bg-muted/20 transition-fast text-foreground"
          >
            Anterior
          </button>
          <span className="text-sm text-foreground">Página {currentPage} de {totalPages}</span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)} 
            className="px-3 py-1 bg-card border border-border rounded disabled:opacity-50 hover:bg-muted/20 transition-fast text-foreground"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Estatísticas */}
      <div className="mt-6 bg-muted/20 border border-border rounded-lg p-4">
        <div className="flex justify-between items-center text-sm">
          <div className="flex gap-6 text-muted-foreground">
            <span>Total: <strong className="text-foreground">{data.length}</strong></span>
            <span className="text-green-400">Completos: <strong>{validCount}</strong></span>
            <span className="text-destructive">Incompletos: <strong>{data.length - validCount}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUserTable;