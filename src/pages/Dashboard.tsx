import { Home } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Home</h1>
        </div>
      </div>
      
      <div className="text-muted-foreground">
        <p>Página principal do sistema </p>
      </div>
    </div>
  )
}