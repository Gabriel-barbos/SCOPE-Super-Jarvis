import { CirclePlus, ContactRound, IdCard, SquarePen, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalDrawer } from "@/components/global/UniversalDrawer";
import { useEffect, useState } from "react";
import { ClientForm } from "@/components/ClientForm";
import { useClients } from "@/hooks/useClients";
import { ClientsDataTable } from "@/components/ClientsTable";
export default function Clients() {

  const [clientId, setClientId] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const { clients, isLoading } = useClients();
  // abrir drawer em modo criar
  function openCreate() {
    setEditingClientId(null);
    setIsDrawerOpen(true);
  }

  // abrir drawer em modo editar para um usuário específico
  function openEdit(clientId: string) {
    setEditingClientId(clientId);
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
            if (!open) setEditingClientId(null);
          }}
          title={editingClientId ? "Editar Cliente" : "Cadastrar Cliente"}
          icon={editingClientId ? <SquarePen /> : <CirclePlus />}
          styleType={editingClientId ? "edit" : "create"}
        >

            <ClientForm clientId={editingClientId} onSuccess={() => setIsDrawerOpen(false)} onCancel={() => setIsDrawerOpen(false)} />
        </UniversalDrawer>

      </div>

            <ClientsDataTable onEdit={openEdit} />
    </div>
  );
}   
