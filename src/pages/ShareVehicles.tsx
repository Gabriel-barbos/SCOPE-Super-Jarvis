
import { useEffect, useState } from "react";
import { Share2, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import SelectGroup from "../components/share/SelectGroup";
import ConfirmModal from "../components/share/ConfirmModal";
import ResultDialog from "../components/share/ResultModal";
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

type ShareType = "description" | "vin" | "unit_description";

export default function VeiculosShare() {

  const [descriptions, setDescriptions] = useState("");
  const [shareType, setShareType] = useState<ShareType>("description");

  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    sent: 0, total: 0, success: 0, errors: []
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultSuccess, setResultSuccess] = useState(false);

  useEffect(() => {
    carregarUserGroups();
  }, []);

  const carregarUserGroups = async () => {
    setLoadingGroups(true);
    try {
      const groups = await ShareService.listarUserGroups();
      setUserGroups(groups);
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
      .split("\n")
      .map((desc) => desc.trim())
      .filter((desc) => desc.length > 0);

    try {
      await ShareService.compartilharVeiculosEmLote(
        dataArray,
        selectedGroup!.id,
        (sent, total, current, success, error) => {
          setProgress((prev) => ({
            sent,
            total,
            success: success || prev.success,
            errors: error ? [...prev.errors, error] : prev.errors,
            current,
          }));
        },
        shareType
      );

      setResultSuccess(true);
    } catch (err) {
      console.error("Erro no compartilhamento:", err);
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

  const descriptionsCount = descriptions
    .split("\n")
    .filter((d) => d.trim().length > 0).length;

  const progressPercentage =
    progress.total > 0 ? (progress.success / progress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Share2 className="w-4 h-4 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-foreground">Share de Veículos</h1>
      </div>

      <div className="p-6 space-y-6 shadow-md border border-border">

        {/* Botão principal */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Compartilhamento de veículos entre contas em lote
          </p>

          <Button
            onClick={handleShare}
            disabled={!descriptions.trim() || !selectedGroup || processing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {processing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Compartilhar Veículos
              </div>
            )}
          </Button>
        </div>

        {/* Grupo */}
        <SelectGroup
          userGroups={userGroups}
          selectedGroup={selectedGroup}
          loading={loadingGroups}
          onSelect={setSelectedGroup}
          onReload={carregarUserGroups}
        />

        {/* Tipo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tipo de Identificação
          </label>

          <select
            value={shareType}
            disabled={processing}
            onChange={(e) => setShareType(e.target.value as ShareType)}
            className="w-full p-2 border border-border rounded-md bg-background"
          >
            <option value="description">Descrição do Veículo</option>
            <option value="vin">Chassi (VIN)</option>
            <option value="unit_description">ID do dispositivo</option>

          </select>
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {shareType === "description"
              ? "Descrições dos Veículos"
              : "Chassis dos Veículos"}
          </label>

          <Textarea
            value={descriptions}
            onChange={(e) => setDescriptions(e.target.value)}
            placeholder={
              shareType === "description"
                ? "Cole as descrições aqui, uma por linha"
                : "Cole os chassis aqui, um por linha"
            }
            className="min-h-[120px] font-mono"
          />

          {descriptionsCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {descriptionsCount} veículo(s) para compartilhar
            </p>
          )}
        </div>

        {/* Progresso */}
        {processing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Compartilhando veículos...</span>
              <span>{progress.success}/{progress.total} sucessos</span>
            </div>

            <Progress value={progressPercentage} />

            <div className="flex justify-between text-xs text-muted-foreground">
              {progress.current && <p>Processando: {progress.current}</p>}
              <p>{progress.sent}/{progress.total} processados</p>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <ConfirmModal
        show={showConfirmModal}
        vehicleCount={descriptionsCount}
        groupName={selectedGroup?.description || ""}
        onConfirm={confirmarShare}
        onCancel={() => setShowConfirmModal(false)}
      />

        <ResultDialog
                      open={showResultModal}
                      status={progress.errors.length > 0 ? "partial" : "success"}
                      title="Processamento concluído"
                      description={`Grupo: ${selectedGroup?.description}`}
                      summary={{
                          success: progress.success,
                          total: progress.total,
                      }}
                      errors={progress.errors}
                      onClose={() => setShowResultModal(false)}
                      onReset={resetForm}
                  />
    </div>
  );
}
