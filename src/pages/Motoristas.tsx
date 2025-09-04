import { UserCheck } from "lucide-react"

export default function Motoristas() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
          <UserCheck className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Motoristas</h1>
      </div>
      
      <div className="text-muted-foreground">
        <p>Cadastrar motoristas em massa</p>
        <button></button>
      </div>
    </div>
  )
}