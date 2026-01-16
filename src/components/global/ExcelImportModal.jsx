import React, { useState, useCallback } from 'react';
import { Upload, X, FileSpreadsheet, Eye, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';


const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-background rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children }) => <div className="p-0">{children}</div>;
const DialogHeader = ({ children }) => <div className="p-6 border-b">{children}</div>;
const DialogTitle = ({ children }) => <h2 className="text-lg font-semibold">{children}</h2>;

const Button = ({ children, onClick, disabled, variant = "default", size = "default", className = "", ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8"
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Table = ({ children }) => <div className="w-full overflow-auto"><table className="w-full caption-bottom text-sm">{children}</table></div>;
const TableHeader = ({ children }) => <thead className="[&_tr]:border-b">{children}</thead>;
const TableBody = ({ children }) => <tbody className="[&_tr:last-child]:border-0">{children}</tbody>;
const TableRow = ({ children }) => <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">{children}</tr>;
const TableHead = ({ children }) => <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{children}</th>;
const TableCell = ({ children }) => <td className="p-4 align-middle">{children}</td>;

const Card = ({ children, className = "" }) => <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>;
const CardContent = ({ children, className = "" }) => <div className={`p-6 ${className}`}>{children}</div>;

const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "text-foreground border border-input"
  };
  return <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]}`}>{children}</div>;
};

const ExcelImportModal = ({ 
  isOpen, 
  onClose, 
  columns, 
  onSubmit,
  title = "Importar Excel" 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('upload'); 
  const itemsPerPage = 10;

  // Resetar estado quando modal fecha
  React.useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setData([]);
      setCurrentPage(1);
      setStep('upload');
      setDragActive(false);
    }
  }, [isOpen]);

  // Processar arquivo Excel
  const processFile = useCallback((file) => {
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Mapear dados baseado nas colunas configuradas
        const mappedData = jsonData.map((row, index) => {
          const mappedRow = { _id: index + 1 };
          columns.forEach(column => {
            // Tentar encontrar a coluna no Excel (case-insensitive)
            const excelKey = Object.keys(row).find(key => 
              key.toLowerCase().trim() === column.label.toLowerCase().trim() ||
              key.toLowerCase().trim() === column.key.toLowerCase().trim()
            );
            mappedRow[column.key] = excelKey ? row[excelKey] : '';
          });
          return mappedRow;
        });
        
        setData(mappedData);
        setStep('preview');
      } catch (error) {
        alert('Erro ao processar arquivo: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  }, [columns]);

  // Handlers de drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          droppedFile.type === 'application/vnd.ms-excel') {
        setFile(droppedFile);
        processFile(droppedFile);
      } else {
        alert('Por favor, selecione apenas arquivos Excel (.xlsx, .xls)');
      }
    }
  }, [processFile]);

  const handleFileInput = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      processFile(selectedFile);
    }
  }, [processFile]);

  // Paginação
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // Validação dos dados
  const validateData = () => {
    return data.every(row => 
      columns.filter(col => col.required).every(col => 
        row[col.key] && row[col.key].toString().trim() !== ''
      )
    );
  };

  // Submeter dados
  const handleSubmit = async () => {
    if (!validateData()) {
      alert('Existem campos obrigatórios não preenchidos!');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(data);
      setStep('success');
    } catch (error) {
      // Erro já tratado no onSubmit
    } finally {
      setLoading(false);
    }
  };

  // Renderizar conteúdo baseado no step
  const renderContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Arraste seu arquivo Excel aqui</h3>
                  <p className="text-muted-foreground">ou clique para selecionar</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                  id="excel-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('excel-upload').click()}
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? 'Processando...' : 'Selecionar Arquivo'}
                </Button>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Formato esperado:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {columns.map((col) => (
                  <Badge key={col.key} variant={col.required ? "default" : "outline"}>
                    {col.label} {col.required && '*'}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">* Campos obrigatórios</p>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5" />
                  <div>
                    <h3 className="font-semibold">Preview dos Dados</h3>
                    <p className="text-sm text-muted-foreground">
                      {data.length} registro(s) encontrado(s) em "{file?.name}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {validateData() ? (
                    <Badge variant="default">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Dados válidos
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Dados inválidos
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        {columns.map((col) => (
                          <TableHead key={col.key}>
                            {col.label}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentData.map((row, index) => (
                        <TableRow key={row._id}>
                          <TableCell>{startIndex + index + 1}</TableCell>
                          {columns.map((col) => (
                            <TableCell key={col.key}>
                              <div className={`${!row[col.key] && col.required ? 'text-red-500' : ''}`}>
                                {row[col.key] || (col.required ? ' Obrigatório' : '-')}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, data.length)} de {data.length} registros
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Importação Concluída!</h3>
                <p className="text-muted-foreground">
                  {data.length} registro(s) foram importados com sucesso.
                </p>
              </div>
              <Button onClick={onClose}>Fechar</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {title}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {renderContent()}

        {step === 'preview' && (
          <div className="p-6 border-t bg-muted/30">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
                disabled={loading}
                className="shadow-elegant hover:shadow-card transition-all duration-300"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !validateData()}
                className="bg-gradient-primary hover:opacity-90 shadow-elegant hover:shadow-card transition-all duration-300 hover:scale-105"
              >
                <Database className="w-4 h-4 mr-2" />
                {loading ? 'Cadastrando...' : `Cadastrar ${data.length} Registro(s)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportModal;