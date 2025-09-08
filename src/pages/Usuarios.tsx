import { UserPlus } from "lucide-react"
import { ExcelButtons } from "@/components/ExcelButtons"

export default function Usuarios() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
        </div>
        <ExcelButtons />
      </div>
      
      <div className="text-muted-foreground">
        <p>Gerenciamento de usuários do sistema.</p>
      </div>
    </div>
  )
}