import { CheckCircle } from "lucide-react"

export default function ConfirmModal({ show, vehicleCount, groupId, onConfirm, onCancel }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Confirmar Adição</h3>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Tem certeza que deseja adicionar {vehicleCount} veículos ao grupo {groupId}?
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted transition-fast"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-fast"
          >
            Adicionar Todos
          </button>
        </div>
      </div>
    </div>
  )
}