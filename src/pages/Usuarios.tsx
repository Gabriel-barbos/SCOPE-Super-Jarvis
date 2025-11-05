import { useState } from "react";
import { UserPlus } from "lucide-react"
import  CreateUserTable  from "@/components/CreateUserTable";
import { Users } from "lucide-react"
export default function Usuarios() {

  const handleDownloadTemplate = () => {
    alert("vou add o template mais tarde");
  };
const handleSubmit = async (users) => {
    console.log('Usuários a serem criados:', users);
    // Aqui você faria a chamada à API para criar os usuários
    // await fetch('/api/users/bulk', { method: 'POST', body: JSON.stringify(users) });
    alert(`${users.length} usuários prontos para criação!`);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Criar Usuários</h1>
        </div>
  

      </div>

      <div className="text-muted-foreground">
        <p>Gerenciamento de usuários do sistema.</p>

            <CreateUserTable
            onSubmit={async (users) => {
    // Sua lógica de criação em massa
    await fetch('/api/users/bulk', {
      method: 'POST',
      body: JSON.stringify(users)
    });
  }}
            >
            </CreateUserTable>
      </div>
    </div>
  )
}