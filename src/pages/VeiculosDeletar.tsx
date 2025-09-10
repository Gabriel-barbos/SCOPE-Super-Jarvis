import { useState } from "react"
import { Trash2, Filter, Upload, Loader2 } from "lucide-react"
import deleteVehicleService, { DeleteResult } from "../services/DeleteVehicleService"

export default function VeiculosDeletar() {
  const [inputText, setInputText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ processed: 0, total: 0, current: "" })
  const [results, setResults] = useState<DeleteResult[]>([])
  const [activeTab, setActiveTab] = useState<"manual" | "removidos">("manual")

  // Processa lista manual do textarea
  const handleManualDelete = async () => {
    if (!inputText.trim()) {
      alert("Digite pelo menos um VIN ou descrição!")
      return
    }

    const searchTerms = inputText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (searchTerms.length === 0) {
      alert("Nenhum item válido encontrado!")
      return
    }

    setIsProcessing(true)
    setResults([])
    setProgress({ processed: 0, total: searchTerms.length, current: "" })

    try {
      const deleteResults = await deleteVehicleService.excluirVeiculosEmLote(
        searchTerms,
        3,
        (processed, total, vehicleInfo, success) => {
          setProgress({ processed, total, current: vehicleInfo || "" })
        }
      )
      setResults(deleteResults)
    } catch (error: any) {
      alert(`Erro no processamento: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Processa veículos com "REMOVIDO" automaticamente
  const handleRemovidosDelete = async () => {
    setIsProcessing(true)
    setResults([])
    setProgress({ processed: 0, total: 0, current: "Buscando veículos..." })

    try {
      const deleteResults = await deleteVehicleService.excluirTodosVeiculosRemovidos(
        3,
        (processed, total, vehicleInfo, success) => {
          setProgress({ processed, total, current: vehicleInfo || "" })
        }
      )
      
      if (deleteResults.length === 0) {
        alert("Nenhum veículo com 'REMOVIDO' foi encontrado.")
      }
      
      setResults(deleteResults)
    } catch (error: any) {
      alert(`Erro ao buscar veículos removidos: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const successCount = results.filter(r => r.success).length
  const errorCount = results.filter(r => !r.success).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Deletar Veículos</h1>
        </div>
      </div>

      <div className="text-muted-foreground">
        <p>Excluir veículos do sistema por VIN/Descrição ou automaticamente os marcados como removidos</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "manual"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Lista Manual
        </button>
        <button
          onClick={() => setActiveTab("removidos")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "removidos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Filter className="w-4 h-4 inline mr-2" />
          Filtrar Removidos
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="space-y-4">
        {activeTab === "manual" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="vehicle-list" className="block text-sm font-medium mb-2">
                Lista de VINs ou Descrições (uma por linha):
              </label>
              <textarea
                id="vehicle-list"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Digite os VINs ou descrições dos veículos, uma por linha:&#10;ABC123&#10;VEICULO TESTE&#10;XYZ789"
                className="w-full h-40 px-3 py-2 border border-input bg-background rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {inputText.split('\n').filter(line => line.trim().length > 0).length} itens na lista
              </p>
            </div>
            
            <button
              onClick={handleManualDelete}
              disabled={isProcessing || !inputText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isProcessing ? "Processando..." : "Excluir Lista"}
            </button>
          </div>
        )}

        {activeTab === "removidos" && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Exclusão Automática</h3>
              <p className="text-sm text-muted-foreground">
                Esta função irá buscar automaticamente todos os veículos que possuem a palavra "REMOVIDO" 
                na descrição e excluí-los do sistema.
              </p>
            </div>
            
            <button
              onClick={handleRemovidosDelete}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Filter className="w-4 h-4" />
              )}
              {isProcessing ? "Processando..." : "Buscar e Excluir Removidos"}
            </button>
          </div>
        )}
      </div>

      {/* Progresso */}
      {isProcessing && (
        <div className="space-y-3 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>Progresso: {progress.processed} de {progress.total}</span>
            <span>{progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0}%</span>
          </div>
          
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: progress.total > 0 ? `${(progress.processed / progress.total) * 100}%` : "0%"
              }}
            ></div>
          </div>
          
          {progress.current && (
            <p className="text-xs text-muted-foreground">
              Processando: {progress.current}
            </p>
          )}
        </div>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resultados da Exclusão</h3>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">✅ Sucessos: {successCount}</span>
              <span className="text-red-600">❌ Erros: {errorCount}</span>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <div className="divide-y">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 flex items-start justify-between ${
                    result.success ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {result.success ? "✅" : "❌"} {result.vehicleInfo}
                    </p>
                    {result.error && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}