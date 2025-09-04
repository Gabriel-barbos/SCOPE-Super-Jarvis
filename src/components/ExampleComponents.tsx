import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Download, Filter } from "lucide-react"

export function ExampleComponents() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Exemplo de Componentes</h2>
        <p className="text-muted-foreground mb-6">
          Demonstração dos componentes usando o design system com tema dark.
        </p>
      </div>

      {/* Exemplo de Botões */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-foreground">Botões do Sistema</CardTitle>
          <CardDescription>
            Diferentes variantes de botões usando o design system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="default">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
            
            <Button variant="white">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            
            <Button variant="ghost">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exemplo de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-elegant transition-smooth hover:shadow-elegant">
          <CardHeader>
            <CardTitle className="text-primary">Total de Veículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">245</div>
            <p className="text-muted-foreground">+12% este mês</p>
          </CardContent>
        </Card>

        <Card className="card-elegant transition-smooth hover:shadow-elegant">
          <CardHeader>
            <CardTitle className="text-primary">Motoristas Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">89</div>
            <p className="text-muted-foreground">+5% este mês</p>
          </CardContent>
        </Card>

        <Card className="card-elegant transition-smooth hover:shadow-elegant">
          <CardHeader>
            <CardTitle className="text-primary">Usuários Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">156</div>
            <p className="text-muted-foreground">+8% este mês</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}