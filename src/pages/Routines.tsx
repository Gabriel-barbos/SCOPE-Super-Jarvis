import { CalendarClock, Zap } from "lucide-react";
import { useState } from "react";
import { AnimatedBeamMultipleOutputDemo } from "@/components/RoutineCard";
import { UploadComponent } from "@/components/UploadComponent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UniversalDrawer } from "@/components/global/UniversalDrawer";
import { CirclePlus, SquarePen } from "lucide-react";
import { RoutineForm } from "@/components/RoutineForm";
import { RoutineList } from "@/components/RoutineList";
import UnidasCard from "@/components/UnidasCard";

export default function Rotinas() {
  const [isAnimationActive, setIsAnimationActive] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  function openCreate() {
    setEditingRoutineId(null);
    setIsDrawerOpen(true);
  }

  function openEdit(routineId: string) {
    setEditingRoutineId(routineId);
    setIsDrawerOpen(true);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <CalendarClock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Rotinas</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie automações, execuções e regras de alocação
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="engine" className="space-y-6 rounded-sm border border-border bg-card p-4">
        <TabsList className="border-b border-border rounded-none justify-start">
          <TabsTrigger value="engine">Motor de Rotinas</TabsTrigger>
          <TabsTrigger value="routines">Gerenciar Rotinas</TabsTrigger>
        </TabsList>

        <TabsContent value="engine">
          <div className="rounded-xl border border-border p-6 shadow-md space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Alocação automática de Grupos e Share
              </h2>
            </div>

            <AnimatedBeamMultipleOutputDemo isActive={isAnimationActive} />

            <UploadComponent
              onExecute={() => setIsAnimationActive(true)}
              isAnimationActive={isAnimationActive}
            />
          </div>
        </TabsContent>

        <TabsContent value="routines" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Rotinas cadastradas</h2>
              <p className="text-sm text-muted-foreground">
                Crie, edite e gerencie as rotinas disponíveis no sistema
              </p>
            </div>

            <Button onClick={openCreate}>
              <CirclePlus className="w-4 h-4 mr-2" />
              Nova Rotina
            </Button>
          </div>

          <UnidasCard />
          <RoutineList onEdit={openEdit} />
        </TabsContent>
      </Tabs>

      <UniversalDrawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) setEditingRoutineId(null);
        }}
        title={editingRoutineId ? "Editar Rotina" : "Cadastrar Rotina"}
        icon={editingRoutineId ? <SquarePen /> : <CirclePlus />}
        styleType={editingRoutineId ? "edit" : "create"}
      >
        <div className="max-h-[calc(100vh-160px)] overflow-y-auto pr-2">
          <RoutineForm
            routineId={editingRoutineId}
            onSuccess={() => setIsDrawerOpen(false)}
            onCancel={() => setIsDrawerOpen(false)}
          />
        </div>
      </UniversalDrawer>
    </div>
  );
}