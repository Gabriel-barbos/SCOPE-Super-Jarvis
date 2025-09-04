import { Car } from "lucide-react"
import { ExcelButtons } from "@/components/ExcelButtons"

export default function Veiculos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Car className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Veículos</h1>
        </div>
        <ExcelButtons />
      </div>
      
      <div className="text-muted-foreground">
        <p>Gerenciamento de veículos da frota.</p>
      </div>
    </div>
  )
}