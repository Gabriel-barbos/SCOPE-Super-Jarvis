import { Filter, Loader2, FolderPlus } from "lucide-react"

export default function FilterWithoutGroupTab({ 
  groupId, 
  setGroupId, 
  vehiclesWithoutGroup, 
  isSearching, 
  isAdding,
  onSearch, 
  onAddAll 
}) {
  return (
    <div className="space-y-4">
      {/* ID do Grupo */}
      <div>
        <label htmlFor="group-id-filter" className="block text-sm font-medium mb-2 text-foreground">
          ID do Grupo:
        </label>
        <input
          id="group-id-filter"
          type="text"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          placeholder="Digite o ID do grupo"
          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-fast"
          disabled={isAdding}
        />
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2 text-foreground">Filtrar Veículos Sem Grupo</h3>
        <p className="text-sm text-muted-foreground">
          Busque todos os veículos que não pertencem a nenhum grupo no Mzone
        </p>
      </div>
      
      <button
        onClick={onSearch}
        disabled={isSearching || isAdding}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
      >
        {isSearching ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Filter className="w-4 h-4" />
        )}
        {isSearching ? "Buscando..." : "Filtrar Sem Grupo"}
      </button>

      {/* Lista de veículos sem grupo */}
      {vehiclesWithoutGroup.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Veículos Encontrados</h3>
            <span className="text-sm text-muted-foreground">{vehiclesWithoutGroup.length} veículos</span>
          </div>

          <div className="max-h-80 overflow-y-auto border border-border rounded-lg bg-card">
            <div className="divide-y divide-border">
              {vehiclesWithoutGroup.map((vehicle) => (
                <div key={vehicle.id} className="p-3 hover:bg-muted/50 transition-fast">
                  <p className="font-medium text-sm text-foreground">{vehicle.vin || "VIN não informado"}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.description}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onAddAll}
            disabled={isAdding || !groupId.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
          >
            <FolderPlus className="w-4 h-4" />
            Adicionar Todos ao Grupo ({vehiclesWithoutGroup.length})
          </button>
        </div>
      )}
    </div>
  )
}