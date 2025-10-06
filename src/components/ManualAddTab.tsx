import { useState } from "react"
import { FolderPlus, Loader2 } from "lucide-react"

export default function ManualAddTab({ groupId, setGroupId, isAdding, onAdd }) {
  const [inputText, setInputText] = useState("")
  const [searchType, setSearchType] = useState("vin")

  const itemCount = inputText.split('\n').filter(line => line.trim().length > 0).length

  const handleAdd = () => {
    onAdd(inputText, searchType)
    setInputText("")
  }

  return (
    <div className="space-y-4">
      {/* ID do Grupo */}
      <div>
        <label htmlFor="group-id" className="block text-sm font-medium mb-2 text-foreground">
          ID do Grupo:
        </label>
        <input
          id="group-id"
          type="text"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          placeholder="Digite o ID do grupo"
          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-fast"
          disabled={isAdding}
        />
      </div>

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
              onChange={(e) => setSearchType(e.target.value)}
              className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 bg-input border-border"
            />
            <span className="text-sm text-foreground">Chassi</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="searchType"
              value="description"
              checked={searchType === "description"}
              onChange={(e) => setSearchType(e.target.value)}
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
          disabled={isAdding}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {itemCount} {itemCount === 1 ? "item" : "itens"} na lista
        </p>
      </div>
      
      <button
        onClick={handleAdd}
        disabled={isAdding || !inputText.trim() || !groupId.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
      >
        {isAdding ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FolderPlus className="w-4 h-4" />
        )}
        {isAdding ? "Processando..." : "Adicionar ao Grupo"}
      </button>
    </div>
  )
}