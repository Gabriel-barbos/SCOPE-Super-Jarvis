import { FileDown, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ExcelButtons() {
  return (
    <div className="flex items-center gap-3">
      <Button 
        variant="white" 
        size="sm"
        className="shadow-elegant hover:shadow-card transition-all duration-300 hover:scale-105"
      >
        <FileDown className="w-4 h-4" />
        Baixar Modelo
      </Button>
      
      <Button 
        variant="default" 
        size="sm"
        className="bg-gradient-primary hover:opacity-90 shadow-elegant hover:shadow-card transition-all duration-300 hover:scale-105"
      >
        <FileUp className="w-4 h-4" />
        Importar
      </Button>
    </div>
  )
}