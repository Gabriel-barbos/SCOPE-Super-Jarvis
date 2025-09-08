import { useState } from "react";
import { UserCheck, Users } from "lucide-react";
import { ExcelButtons } from "@/components/ExcelButtons";
import InsertManyTable from "@/components/InsertManyTable";
import { ImportExcelModal } from "@/components/ImportModal";
import DriverService from "@/services/DriverService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function Motoristas() {
  const [openImport, setOpenImport] = useState(false);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);

  const motoristasColumns = [
    { key: "nomeCompleto", label: "Nome Completo", required: true },
    { key: "codigoMzone", label: "Código MZone", required: true },
    { key: "idDriver", label: "ID Driver", required: false },
  ];

  const handleSubmitMotoristas = async (data: any[]) => {
    if (!data.length) return alert("Nenhum motorista para cadastrar.");

    setIsSubmitting(true);
    setOpenDialog(true);
    setProgress(0);
    setTotal(data.length);
    setLog([]);

    try {
      await DriverService.cadastrarMotoristasEmLote(
        data,
        10,
        (sent, total, nome) => {
          setProgress(sent);
          setTotal(total);
          setLog((prev) => [...prev, `Motorista ${nome} criado com sucesso!`]);
        }
      );
    } catch (error: any) {
      console.error("Erro ao cadastrar motoristas:", error);
      setLog((prev) => [...prev, `❌ Erro ao cadastrar motoristas. Veja o console.`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    alert("Aqui você pode gerar e baixar o modelo de motoristas...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Cadastrar Motoristas</h1>
        </div>
        <ExcelButtons
          onDownload={handleDownloadTemplate}
          onImport={() => setOpenImport(true)}
        />
      </div>

      <InsertManyTable
        columns={motoristasColumns}
        initialData={importedData.length ? importedData : []}
        onSubmit={handleSubmitMotoristas}
        submitButtonText={isSubmitting ? "Enviando..." : "Cadastrar Motoristas"}
        icon={Users}
        disabled={isSubmitting}
      />

      <ImportExcelModal
        open={openImport}
        onClose={() => setOpenImport(false)}
        columns={motoristasColumns}
        onImport={setImportedData}
      />

      {/* Dialog de progresso */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Cadastrando motoristas...</DialogTitle>
            <DialogDescription>
              {progress}/{total} motoristas processados
            </DialogDescription>
          </DialogHeader>

          <Progress value={(progress / total) * 100} className="my-4" />

          <ScrollArea className="h-48 border rounded p-2 bg-background">
            {log.map((item, index) => (
              <p key={index} className="text-sm text-foreground">
                {item}
              </p>
            ))}
          </ScrollArea>

          <DialogFooter>
            <Button
              disabled={isSubmitting}
              onClick={() => setOpenDialog(false)}
              variant="secondary"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
