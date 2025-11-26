import { UserPlus, Mail, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputWithIcon } from "@/components/InputWithIcon";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Usuarios() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Criar Usuários</h1>
        </div>

  
      </div>

      <p className="text-muted-foreground text-sm">
        Preencha os dados abaixo para criar um novo usuário no sistema.
      </p>

      {/* Form Card */}
      <Card className="p-8 shadow-lg border border-border rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <InputWithIcon
              icon={<Mail className="h-4 w-4" />}
              placeholder="email@dominio.com"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição do Usuário</Label>
            <InputWithIcon
              icon={<User className="h-4 w-4" />}
              placeholder="Ex: Usuário do setor X"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label>Username</Label>
            <InputWithIcon
              icon={<User className="h-4 w-4" />}
              placeholder="scope.gabriel"
            />
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label>Senha</Label>
            <InputWithIcon
              icon={<Lock className="h-4 w-4" />}
              placeholder="Cliente@2025"
              type="password"
            />
          </div>

          {/* Nivel de acesso */}
          <div className="space-y-2">
            <Label>Nível de Acesso</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Cargos</SelectLabel>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Grupo de segurança */}
          <div className="space-y-2">
            <Label>Grupo de Segurança</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Grupos</SelectLabel>
                  <SelectItem value="grupo1">Grupo 1</SelectItem>
                  <SelectItem value="grupo2">Grupo 2</SelectItem>
                  <SelectItem value="grupo3">Grupo 3</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Botão final */}
        <div className="flex justify-end mt-8">
          <Button className="px-8 py-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            Salvar Usuário
          </Button>
        </div>
      </Card>
    </div>
  );
}
