import * as XLSX from "xlsx"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Column = { key: string; label: string; required?: boolean; unique?: boolean }

export function ImportExcelModal({
  open,
  onClose,
  columns = [],
  onImport
}: {
  open: boolean
  onClose: () => void
  columns?: Column[]
  onImport: (rows: any[]) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const normalize = (s: any) =>
    String(s || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[\s_]+/g, "")
      .toLowerCase()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile)
    }
  }

  const handleProcess = async () => {
    if (!file) return
    if (!columns || columns.length === 0) {
      console.warn("Nenhuma coluna definida para importação")
      return
    }

    try {
      setLoading(true)
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]

      // Ler com header pegar colunas
      const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })
      
      if (rawData.length < 2) {
        alert("A planilha deve conter pelo menos um cabeçalho e uma linha de dados.")
        setLoading(false)
        return
      }

      const headers = rawData[0] as string[]
      const dataRows = rawData.slice(1)

      // Criar mapeamento de headers do Excel para keys esperadas
      const headerMap: Record<string, string> = {}
      
      headers.forEach((header, index) => {
        const normalizedHeader = normalize(header)
        
        // Tentar mapear para cada coluna definida
        columns.forEach((col) => {
          const normalizedKey = normalize(col.key)
          const normalizedLabel = normalize(col.label)
          
          if (normalizedHeader === normalizedKey || normalizedHeader === normalizedLabel) {
            headerMap[index] = col.key
          }
        })
      })

      // Converter linhas de dados para objetos
      const aligned = dataRows
        .filter(row => row.some(cell => cell !== "")) // Remover linhas vazias
        .map((row) => {
          const obj: any = {}
          
          // Preencher usando o mapeamento de headers
          Object.entries(headerMap).forEach(([colIndex, key]) => {
            const value = row[parseInt(colIndex)]
            obj[key] = value ? String(value).trim() : ""
          })
          
          return obj
        })

      console.log("Dados importados:", aligned)
      console.log("Mapeamento de headers:", headerMap)

      if (aligned.length === 0) {
        alert("Nenhum dado válido encontrado na planilha.")
        setLoading(false)
        return
      }

      onImport(aligned)
      setFile(null)
      onClose()
    } catch (err) {
      toast.error("Erro ao processar Excel:", err)
      toast.error("Não consegui ler o arquivo. Verifique o formato e o cabeçalho da planilha.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Importar planilha</DialogTitle>
        </DialogHeader>

        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer hover:border-green-400 hover:bg-green-50/50 ${
            dragOver ? 'border-green-400 bg-green-50/50 scale-105' : file ? 'border-green-500 bg-green-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <FileSpreadsheet 
                className={`w-12 h-12 transition-all duration-300 ${
                  file ? 'text-green-600 scale-110' : 'text-gray-400'
                }`} 
              />
              {!file && (
                <Upload className="w-5 h-5 text-blue-500 absolute -top-1 -right-1 animate-bounce" />
              )}
            </div>
            
            {file ? (
              <div className="animate-in fade-in-0 duration-300">
                <p className="font-medium text-green-700 mb-1">{file.name}</p>
                <p className="text-xs text-green-600">Arquivo selecionado ✓</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-700 mb-1">
                  Clique ou arraste seu arquivo
                </p>
                <p className="text-xs text-gray-500">
                  Formatos: .xlsx, .xls, .csv
                </p>
              </div>
            )}
          </div>
        </div>

        {columns.length > 0 && (
          <div className="text-center animate-in slide-in-from-bottom-2 duration-500">
            <p className="text-xs text-gray-500 mb-2">
              Colunas esperadas no template:
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              {columns.map((col) => (
                <span
                  key={col.key}
                  className="text-xs bg-black-100 px-2 py-1 rounded"
                >
                  {col.label}
                  {col.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="transition-all hover:scale-105"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleProcess} 
            disabled={!file || loading}
            className="transition-all hover:scale-105 disabled:scale-100"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </div>
            ) : (
              "Importar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}