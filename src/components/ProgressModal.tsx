import { Loader2, X } from "lucide-react"

export default function ProgressModal({ show, progress, results, isAdding, onClose }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Adicionando Veículos</h3>
          {!isAdding && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-fast"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Progresso: {progress.current} de {progress.total}</span>
            <span className="text-muted-foreground">
              {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : "0%"
              }}
            ></div>
          </div>
          
          {progress.currentVehicle && (
            <p className="text-xs text-muted-foreground">
              Processando: {progress.currentVehicle}
            </p>
          )}

          {isAdding && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Adicionando...</span>
            </div>
          )}

          {/* Resultados após conclusão */}
          {!isAdding && results.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Resultados:</span>
                <div className="flex gap-4">
                  <span className="text-green-400">✅ {results.filter(r => r.success).length}</span>
                  <span className="text-destructive">❌ {results.filter(r => !r.success).length}</span>
                </div>
              </div>
              
              <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                {results.slice(0, 5).map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded ${result.success ? 'bg-green-900/30' : 'bg-destructive/20'}`}
                  >
                    <span className={result.success ? 'text-green-400' : 'text-destructive'}>
                      {result.success ? '✅' : '❌'} {result.vehicleInfo}
                    </span>
                    {result.error && (
                      <div className="text-destructive text-xs mt-1">{result.error}</div>
                    )}
                  </div>
                ))}
                {results.length > 5 && (
                  <p className="text-muted-foreground text-center">
                    ... e mais {results.length - 5} resultados
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}