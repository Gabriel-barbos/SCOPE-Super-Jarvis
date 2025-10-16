import { useState, useEffect } from "react";
import { Share2, Search, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ShareService from "@/services/ShareService";

interface UserGroup {
  id: string;
  description: string;
}

interface ProgressState {
  sent: number;
  total: number;
  success: number;
  errors: string[];
  current?: string;
}

type ShareType = "description" | "vin";

export default function VeiculosShare() {
  const [descriptions, setDescriptions] = useState("");
  const [shareType, setShareType] = useState<ShareType>("description");
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({ sent: 0, total: 0, success: 0, errors: [] });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultSuccess, setResultSuccess] = useState(false);
  const [open, setOpen] = useState(false);

  // Carregar grupos de usuário
  useEffect(() => {
    carregarUserGroups();
  }, []);

  const carregarUserGroups = async () => {
    setLoadingGroups(true);
    try {
      const grupos = await ShareService.listarUserGroups();
      setUserGroups(grupos);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleShare = () => {
    if (!descriptions.trim() || !selectedGroup) return;
    setShowConfirmModal(true);
  };

  const confirmarShare = async () => {
    setShowConfirmModal(false);
    setProcessing(true);
    setProgress({ sent: 0, total: 0, success: 0, errors: [] });

    const dataArray = descriptions
      .split('\n')
      .map(desc => desc.trim())
      .filter(desc => desc.length > 0);

    try {
      await ShareService.compartilharVeiculosEmLote(
        dataArray,
        selectedGroup!.id,
        (sent, total, current, success, error) => {
          setProgress(prev => ({
            sent,
            total,
            success: success || prev.success,
            errors: error ? [...prev.errors, error] : prev.errors,
            current
          }));
        },
        shareType 
      );
      setResultSuccess(true);
    } catch (error) {
      console.error("Erro no compartilhamento:", error);
      setResultSuccess(false);
    } finally {
      setProcessing(false);
      setShowResultModal(true);
    }
  };

  const resetForm = () => {
    setDescriptions("");
    setSelectedGroup(null);
    setProgress({ sent: 0, total: 0, success: 0, errors: [] });
    setShowResultModal(false);
  };

  const descriptionsCount = descriptions.split('\n').filter(desc => desc.trim().length > 0).length;
  const progressPercentage = progress.total > 0 ? (progress.success / progress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <Share2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Share de Veículos</h1>
        </div>
      </div>

      <div className="p-6 space-y-6 shadow-md border border-border">
        <div className="text-muted-foreground">
          <div className="flex justify-between items-center mb-4">
            <p>Compartilhamento de veículos entre contas em lote</p>

            <Button
              onClick={handleShare}
              disabled={!descriptions.trim() || !selectedGroup || processing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-smooth"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span>Compartilhar Veículos</span>
                </div>
              )}
            </Button>
          </div>
        </div>


        {/* Seleção de Grupo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Grupo de Destino
            </label>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between transition-smooth"
                disabled={loadingGroups}
              >
                {loadingGroups ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Carregando grupos...</span>
                  </div>
                ) : selectedGroup ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{selectedGroup.description}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Selecione um grupo...</span>
                )}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Buscar grupo..." />
                <CommandList>
                  <CommandEmpty>Nenhum grupo encontrado.</CommandEmpty>
                  <CommandGroup>
                    {userGroups.map((group) => (
                      <CommandItem
                        key={group.id}
                        onSelect={() => {
                          setSelectedGroup(group);
                          setOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{group.description}</p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button
            variant="default"
            size="sm"
            onClick={carregarUserGroups}
            disabled={loadingGroups}
            className="bg-white hover:bg-primary/90 text-primary-foreground transition-smooth"
          >
            {loadingGroups ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Search className="w-3 h-3 mr-1" />
            )}
            Atualizar
          </Button>
        </div>

            
        {/* Tipo de Compartilhamento */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tipo de Identificação
          </label>
          <Select 
            value={shareType} 
            onValueChange={(value: ShareType) => setShareType(value)}
            disabled={processing}
          >
            <SelectTrigger className="w-full transition-smooth">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="description">Descrição do Veículo</SelectItem>
              <SelectItem value="vin">Chassi </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {shareType === "description" 
              ? "Use a descrição completa do veículo para identificá-lo" 
              : "Use o chassi para compartilhar"}
          </p>
        </div>


        {/* Textarea para descrições/VINs */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {shareType === "description" ? "Descrições dos Veículos" : "Chassi dos Veículos"}
          </label>
          <Textarea
            placeholder={shareType === "description" 
              ? "Cole as descrições dos veículos aqui (uma por linha)" 
              : "Cole os chassis dos veículos aqui (um por linha)"}
            value={descriptions}
            onChange={(e) => setDescriptions(e.target.value)}
            className="min-h-[120px] transition-smooth font-mono"
          />
          {descriptionsCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {descriptionsCount} veículo{descriptionsCount !== 1 ? 's' : ''} para compartilhar
            </p>
          )}
        </div>

        {/* Barra de Progresso */}
        {processing && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                Compartilhando veículos...
              </span>
              <span className="text-sm text-muted-foreground">
                {progress.success}/{progress.total} sucessos
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {progress.current && (
                <p>Processando: {progress.current}</p>
              )}
              <p>{progress.sent}/{progress.total} processados</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Confirmar Share
            </DialogTitle>
            <DialogDescription>
              Você está prestes a fazer o share de <strong>{descriptionsCount} veículo{descriptionsCount !== 1 ? 's' : ''}</strong> por <strong>{shareType === "description" ? "Descrição" : "VIN"}</strong> com o grupo:
              <br />
              <strong className="text-foreground">{selectedGroup?.description}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarShare} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Resultado */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resultSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              {resultSuccess ? "Compartilhamento Concluído!" : "Erro no Compartilhamento"}
            </DialogTitle>
            <DialogDescription>
              {resultSuccess ? (
                <div className="space-y-2">
                  <p>
                    Os veículos foram processados com o grupo <strong>{selectedGroup?.description}</strong>.
                  </p>
                  <div className="text-green-600">
                    ✅ {progress.success}/{progress.total} veículos compartilhados com sucesso
                  </div>
                  {progress.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-red-700 dark:text-red-400 font-medium mb-2">
                        ❌ Erros encontrados ({progress.errors.length}):
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {progress.errors.map((error, index) => (
                          <p key={index} className="text-xs text-red-600 dark:text-red-400">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  Ocorreu um erro durante o compartilhamento.
                  <span className="text-red-600"> {progress.success}/{progress.total} veículos processados</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={resetForm} variant="outline">
              Limpar Dados
            </Button>
            <Button onClick={() => setShowResultModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}