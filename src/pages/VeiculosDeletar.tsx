import { useState } from "react"
import { Trash2, Filter, Search, Loader2, X, AlertTriangle } from "lucide-react"
import deleteVehicleService, { VehicleSearchResult, DeleteResult } from "../services/DeleteVehicleService"

export default function VeiculosDeletar() {
  const [inputText, setInputText] = useState("")
  const [searchType, setSearchType] = useState<"vin" | "description">("vin")
  const [removedVehicles, setRemovedVehicles] = useState<VehicleSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0, currentVehicle: "" })
  const [deleteResults, setDeleteResults] = useState<DeleteResult[]>([])
  const [activeTab, setActiveTab] = useState<"manual" | "removidos">("manual")

  // Busca veículos removidos
  const handleSearchRemoved = async () => {
    setIsSearching(true)
    try {
      const vehicles = await deleteVehicleService.buscarVeiculosRemovidos()
      setRemovedVehicles(vehicles)
      
      if (vehicles.length === 0) {
        alert("Nenhum veículo com 'REMOVIDO' foi encontrado.")
      }
    } catch (error: any) {
      alert(`Erro ao buscar veículos removidos: ${error.message}`)
    } finally {
      setIsSearching(false)
    }
  }

  // Deleta veículos da lista manual
  const handleManualDelete = async () => {
    if (!inputText.trim()) {
      alert("Digite pelo menos um Chassi ou descrição!")
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

    setDeleteProgress({ current: 0, total: searchTerms.length, currentVehicle: "" })
    setDeleteResults([])
    setShowProgressModal(true)
    setIsDeleting(true)

    try {
      const results = await deleteVehicleService.excluirVeiculosEmLote(
        searchTerms,
        1,
        (processed, total, vehicleInfo, success) => {
          setDeleteProgress({ current: processed, total, currentVehicle: vehicleInfo || "" })
        }
      )
      
      setDeleteResults(results)
      
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length
      
      if (successCount > 0) {
        alert(`${successCount} veículo(s) deletado(s) com sucesso!${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`)
      } else {
        alert("Nenhum veículo foi deletado. Verifique os resultados.")
      }
      
      setInputText("")
    } catch (error: any) {
      alert(`Erro ao deletar veículos: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Deleta veículos removidos
  const handleDeleteRemoved = async () => {
    if (removedVehicles.length === 0) return

    setDeleteProgress({ current: 0, total: removedVehicles.length, currentVehicle: "" })
    setDeleteResults([])
    setShowConfirmModal(false)
    setShowProgressModal(true)
    setIsDeleting(true)

    try {
      const results = await deleteVehicleService.excluirTodosVeiculosRemovidos(
        1, 
        (processed, total, vehicleInfo, success) => {
          setDeleteProgress({ 
            current: processed, 
            total, 
            currentVehicle: vehicleInfo || ""
          })
        }
      )
      
      setDeleteResults(results)
      
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length
      
      if (successCount > 0) {
        alert(`${successCount} veículo(s) removido(s) deletado(s) com sucesso!${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`)
        
        setRemovedVehicles([])
      } else {
        alert("Nenhum veículo foi deletado. Verifique os resultados.")
      }
      
    } catch (error: any) {
      alert(`Erro ao deletar veículos removidos: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const itemCount = inputText.split('\n').filter(line => line.trim().length > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-elegant">
            <Trash2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Deletar Veículos</h1>
        </div>
      </div>

      <div className="text-muted-foreground">
        <p>Excluir carros do Mzone de forma automatica</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-4 py-2 font-medium border-b-2 transition-fast ${
            activeTab === "manual"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
        Inserir Lista
        </button>
        <button
          onClick={() => setActiveTab("removidos")}
          className={`px-4 py-2 font-medium border-b-2 transition-fast ${
            activeTab === "removidos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Filter className="w-4 h-4 inline mr-2" />
          Filtrar Removidos
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "manual" && (
          <div className="space-y-4">
            {/* Switch para tipo de busca */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">Buscar por:</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="vin"
                    checked={searchType === "vin"}
                    onChange={(e) => setSearchType(e.target.value as "vin")}
                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 bg-input border-border"
                  />
                  <span className="text-sm text-foreground">VIN</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="description"
                    checked={searchType === "description"}
                    onChange={(e) => setSearchType(e.target.value as "description")}
                    className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 bg-input border-border"
                  />
                  <span className="text-sm text-foreground">Descrição</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="vehicle-list" className="block text-sm font-medium mb-2 text-foreground">
                Lista de {searchType === "vin" ? "Chassis" : "Descrições"} (uma por linha):
              </label>
              <textarea
                id="vehicle-list"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Digite ${searchType === "vin" ? "os chassis" : "as descrições dos veículos"}, uma por linha:\n${
                  searchType === "vin" ? "1HGBH41JXMN109186\nWBAFG9C50DD123456" : "Porsche 911 turbo S 2021\nRenault KWID"
                }`}
                className="w-full h-40 px-3 py-2 border border-border bg-background text-foreground rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-fast"
                disabled={isDeleting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {itemCount} {itemCount === 1 ? "item" : "itens"} na lista
              </p>
            </div>
            
            <button
              onClick={handleManualDelete}
              disabled={isDeleting || !inputText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isDeleting ? "Processando..." : "Excluir Lista"}
            </button>
          </div>
        )}

        {activeTab === "removidos" && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2 text-foreground">Filtrar Veículos Removidos</h3>
              <p className="text-sm text-muted-foreground">
                Busque todos os veículos marcados como "REMOVIDO" no Mzone
              </p>
            </div>
            
            <button
              onClick={handleSearchRemoved}
              disabled={isSearching || isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Filter className="w-4 h-4" />
              )}
              {isSearching ? "Buscando..." : "Filtrar Removidos"}
            </button>

            {/* Lista de veículos removidos */}
            {removedVehicles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Veículos Encontrados</h3>
                  <span className="text-sm text-muted-foreground">{removedVehicles.length} veículos</span>
                </div>

                <div className="max-h-80 overflow-y-auto border border-border rounded-lg bg-card">
                  <div className="divide-y divide-border">
                    {removedVehicles.map((vehicle) => (
                      <div key={vehicle.id} className="p-3 hover:bg-muted/50 transition-fast">
                        <p className="font-medium text-sm text-foreground">{vehicle.vin || "VIN não informado"}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Todos ({removedVehicles.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">Confirmar Exclusão</h3>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja excluir {removedVehicles.length} veículos? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted transition-fast"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteRemoved}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-fast"
              >
                Excluir Todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Progresso */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Excluindo Veículos</h3>
              {!isDeleting && (
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-fast"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Progresso: {deleteProgress.current} de {deleteProgress.total}</span>
                <span className="text-muted-foreground">{deleteProgress.total > 0 ? Math.round((deleteProgress.current / deleteProgress.total) * 100) : 0}%</span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: deleteProgress.total > 0 ? `${(deleteProgress.current / deleteProgress.total) * 100}%` : "0%"
                  }}
                ></div>
              </div>
              
              {deleteProgress.currentVehicle && (
                <p className="text-xs text-muted-foreground">
                  Processando: {deleteProgress.currentVehicle}
                </p>
              )}

              {isDeleting && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Excluindo...</span>
                </div>
              )}

              {/* Resultados após conclusão */}
              {!isDeleting && deleteResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Resultados:</span>
                    <div className="flex gap-4">
                      <span className="text-green-400">✅ {deleteResults.filter(r => r.success).length}</span>
                      <span className="text-destructive">❌ {deleteResults.filter(r => !r.success).length}</span>
                    </div>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                    {deleteResults.slice(0, 5).map((result, index) => (
                      <div key={index} className={`p-2 rounded ${result.success ? 'bg-green-900/30' : 'bg-destructive/20'}`}>
                        <span className={result.success ? 'text-green-400' : 'text-destructive'}>
                          {result.success ? '✅' : '❌'} {result.vehicleInfo}
                        </span>
                        {result.error && (
                          <div className="text-destructive text-xs mt-1">{result.error}</div>
                        )}
                      </div>
                    ))}
                    {deleteResults.length > 5 && (
                      <p className="text-muted-foreground text-center">... e mais {deleteResults.length - 5} resultados</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}