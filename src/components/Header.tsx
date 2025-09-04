import { ChevronDown, Settings, LogOut, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"

const clientes = [
  { id: 1, name: "LM Frotas", active: true },
  { id: 2, name: "Equatorial", active: false },
  { id: 3, name: "Unidas", active: false },
]

export function Header() {
  const clienteAtivo = clientes.find(c => c.active) || clientes[0]

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-foreground hover:bg-accent" />
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Cliente:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground"
              >
                <Building2 className="w-4 h-4 mr-2" />
                {clienteAtivo.name}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-64 bg-popover border-border shadow-card"
            >
              <DropdownMenuLabel className="text-popover-foreground">
                Selecionar Cliente
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {clientes.map((cliente) => (
                <DropdownMenuItem
                  key={cliente.id}
                  className={`
                    cursor-pointer transition-colors
                    ${cliente.active 
                      ? "bg-primary text-primary-foreground" 
                      : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                  `}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {cliente.name}
                  {cliente.active && (
                    <span className="ml-auto text-xs opacity-75">Ativo</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Settings className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}