import { CirclePlus, ContactRound, IdCard, SquarePen, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalDrawer } from "@/components/global/UniversalDrawer";
import { useEffect, useState } from "react";
import { ClientForm } from "@/components/ClientForm";


export default function Clients() {

  const [users, setUsers] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // abrir drawer em modo criar
  function openCreate() {
    setEditingUserId(null);
    setIsDrawerOpen(true);
  }

  // abrir drawer em modo editar para um usuário específico
  function openEdit(userId: string) {
    setEditingUserId(userId);
    setIsDrawerOpen(true);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow">
            <IdCard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Lista de Credenciais</h1>
        </div>
        <Button className="ml-auto" size="sm" onClick={openCreate}>
          Cadastrar Login <UserRoundPlus />
        </Button>

        <UniversalDrawer
          open={isDrawerOpen}
          onOpenChange={(open) => {
            setIsDrawerOpen(open);
            if (!open) setEditingUserId(null);
          }}
          title={editingUserId ? "Editar Cliente" : "Cadastrar Cliente"}
          icon={editingUserId ? <SquarePen /> : <CirclePlus />}
          styleType={editingUserId ? "edit" : "create"}
        >

            <ClientForm userId={editingUserId} onSuccess={() => setIsDrawerOpen(false)} onCancel={() => setIsDrawerOpen(false)} />
        </UniversalDrawer>

      </div>


    </div>
  );
}   
