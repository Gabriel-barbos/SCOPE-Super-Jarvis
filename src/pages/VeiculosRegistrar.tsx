import { useState } from "react"
import { FolderPlus, Filter, Search } from "lucide-react"
import ManualAddTab from "../components/ManualAddTab"
import FilterWithoutGroupTab from "../components/FilterWithoutGroupTab"
import ConfirmModal from "../components/ConfirmModal"
import ProgressModal from "../components/ProgressModal"

// Mock service - você deve substituir pelo seu serviço real
const addToGroupService = {
  buscarVeiculosSemGrupo: async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return [
      { id: 1, vin: "1HGBH41JXMN109186", description: "Honda Accord 2021" },
      { id: 2, vin: "WBAFG9C50DD123456", description: "BMW 330i 2020" },
      { id: 3, vin: "5YJSA1E14HF000001", description: "Tesla Model S 2017" }
    ]
  },
  
  adicionarVeiculosEmLote: async (searchTerms, searchType, groupId, onProgress) => {
    const results = []
    for (let i = 0; i < searchTerms.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      const success = Math.random() > 0.2
      results.push({
        success,
        vehicleInfo: searchTerms[i],
        error: success ? null : "Veículo não encontrado ou já pertence a um grupo"
      })
      onProgress(i + 1, searchTerms.length, searchTerms[i], success)
    }
    return results
  },
  
  adicionarTodosVeiculosSemGrupo: async (groupId, onProgress) => {
    const vehicles = await addToGroupService.buscarVeiculosSemGrupo()
    const results = []
    for (let i = 0; i < vehicles.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      const success = Math.random() > 0.15
      results.push({
        success,
        vehicleInfo: `${vehicles[i].vin} - ${vehicles[i].description}`,
        error: success ? null : "Erro ao adicionar ao grupo"
      })
      onProgress(i + 1, vehicles.length, `${vehicles[i].vin} - ${vehicles[i].description}`, success)
    }
    return results
  }
}

export default function VeiculosAdicionarGrupo() {
  
  const [vehiclesWithoutGroup, setVehiclesWithoutGroup] = useState([])
  const [groupId, setGroupId] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [addProgress, setAddProgress] = useState({ current: 0, total: 0, currentVehicle: "" })
  const [addResults, setAddResults] = useState([])
  const [activeTab, setActiveTab] = useState("manual")

  const handleSearchWithoutGroup = async () => {
    setIsSearching(true)
    try {
      const vehicles = await addToGroupService.buscarVeiculosSemGrupo()
      setVehiclesWithoutGroup(vehicles)
      
      if (vehicles.length === 0) {
        alert("Nenhum veículo sem grupo foi encontrado.")
      }
    } catch (error) {
      alert(`Erro ao buscar veículos sem grupo: ${error.message}`)
    } finally {
      setIsSearching(false)
    }
  }

  const handleManualAdd = async (inputText, searchType) => {
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

    setAddProgress({ current: 0, total: searchTerms.length, currentVehicle: "" })
    setAddResults([])
    setShowProgressModal(true)
    setIsAdding(true)

    try {
      const results = await addToGroupService.adicionarVeiculosEmLote(
        searchTerms,
        searchType,
        groupId,
        (processed, total, vehicleInfo, success) => {
          setAddProgress({ current: processed, total, currentVehicle: vehicleInfo || "" })
        }
      )
      
      setAddResults(results)
      
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length
      
      if (successCount > 0) {
        alert(`${successCount} veículo(s) adicionado(s) com sucesso!${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`)
      } else {
        alert("Nenhum veículo foi adicionado. Verifique os resultados.")
      }
    } catch (error) {
      alert(`Erro ao adicionar veículos: ${error.message}`)
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddWithoutGroup = async () => {
    if (vehiclesWithoutGroup.length === 0) return

    if (!groupId.trim()) {
      alert("Digite o ID do grupo!")
      return
    }

    setAddProgress({ current: 0, total: vehiclesWithoutGroup.length, currentVehicle: "" })
    setAddResults([])
    setShowConfirmModal(false)
    setShowProgressModal(true)
    setIsAdding(true)

    try {
      const results = await addToGroupService.adicionarTodosVeiculosSemGrupo(
        groupId,
        (processed, total, vehicleInfo, success) => {
          setAddProgress({ 
            current: processed, 
            total, 
            currentVehicle: vehicleInfo || ""
          })
        }
      )
      
      setAddResults(results)
      
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length
      
      if (successCount > 0) {
        alert(`${successCount} veículo(s) adicionado(s) ao grupo com sucesso!${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`)
        setVehiclesWithoutGroup([])
      } else {
        alert("Nenhum veículo foi adicionado. Verifique os resultados.")
      }
      
    } catch (error) {
      alert(`Erro ao adicionar veículos ao grupo: ${error.message}`)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-elegant">
            <FolderPlus className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Adicionar ao Grupo</h1>
        </div>
      </div>

      <div className="text-muted-foreground">
        <p>Adicionar veículos a grupos do Mzone de forma automática</p>
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
          Inserir Carros
        </button>
        <button
          onClick={() => setActiveTab("sem-grupo")}
          className={`px-4 py-2 font-medium border-b-2 transition-fast ${
            activeTab === "sem-grupo"
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
          <ManualAddTab
            groupId={groupId}
            setGroupId={setGroupId}
            isAdding={isAdding}
            onAdd={handleManualAdd}
          />
        )}

        {activeTab === "sem-grupo" && (
          <FilterWithoutGroupTab
            groupId={groupId}
            setGroupId={setGroupId}
            vehiclesWithoutGroup={vehiclesWithoutGroup}
            isSearching={isSearching}
            isAdding={isAdding}
            onSearch={handleSearchWithoutGroup}
            onAddAll={() => setShowConfirmModal(true)}
          />
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        show={showConfirmModal}
        vehicleCount={vehiclesWithoutGroup.length}
        groupId={groupId}
        onConfirm={handleAddWithoutGroup}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ProgressModal
        show={showProgressModal}
        progress={addProgress}
        results={addResults}
        isAdding={isAdding}
        onClose={() => setShowProgressModal(false)}
      />
    </div>
  )
}