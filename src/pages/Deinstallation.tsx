import { useEffect, useState } from "react";
import { OctagonX, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import SelectGroup from "../components/share/SelectGroup";
import ConfirmModal from "../components/share/ConfirmModal";
import ResultModal from "../components/share/ResultModal";
import ResultDialog from "../components/share/ResultModal";
import ConfirmDialog
    from "@/components/global/ConfirmDialog";
import vehicleService from "@/services/RemocaoService";
import type { SearchType, VehicleGroup, OperationResult } from "@/services/RemocaoService";

interface ProgressState {
    sent: number;
    total: number;
    success: number;
    errors: string[];
    current?: string;
}

export default function Remocao() {
    const [identifiers, setIdentifiers] = useState("");
    const [searchType, setSearchType] = useState<SearchType>("unit_Description");
    const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<VehicleGroup | null>(null);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // Opções de remoção
    const [removerDeGrupos, setRemoverDeGrupos] = useState(false);
    const [moverParaGrupo, setMoverParaGrupo] = useState(false);

    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState<ProgressState>({
        sent: 0,
        total: 0,
        success: 0,
        errors: [],
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultSuccess, setResultSuccess] = useState(false);

    useEffect(() => {
        carregarGrupos();
    }, []);

    const carregarGrupos = async () => {
        setLoadingGroups(true);
        try {
            const groups = await vehicleService.listarGrupos();
            setVehicleGroups(groups);
        } catch (error) {
            console.error("Erro ao carregar grupos:", error);
        } finally {
            setLoadingGroups(false);
        }
    };

    const handleRemover = () => {
        if (!identifiers.trim() || (moverParaGrupo && !selectedGroup)) return;
        setShowConfirmModal(true);
    };

    const confirmarRemocao = async () => {
        setShowConfirmModal(false);
        setProcessing(true);
        setProgress({ sent: 0, total: 0, success: 0, errors: [] });

        const dataArray = identifiers
            .split("\n")
            .map((id) => id.trim())
            .filter((id) => id.length > 0);

        try {
            const results = await vehicleService.processarRemocaoEmLote(
                dataArray,
                searchType,
                {
                    removerDeGrupos,
                    moverParaGrupoId: moverParaGrupo ? selectedGroup?.id : undefined,
                },
                (sent, total, currentResult) => {
                    setProgress((prev) => ({
                        sent,
                        total,
                        success: currentResult.success ? prev.success + 1 : prev.success,
                        errors: currentResult.error
                            ? [...prev.errors, `${currentResult.identifier}: ${currentResult.error}`]
                            : prev.errors,
                        current: currentResult.identifier,
                    }));
                }
            );

            setResultSuccess(results.some((r) => r.success));
        } catch (err) {
            console.error("Erro na remoção:", err);
            setResultSuccess(false);
        } finally {
            setProcessing(false);
            setShowResultModal(true);
        }
    };

    const resetForm = () => {
        setIdentifiers("");
        setSelectedGroup(null);
        setRemoverDeGrupos(false);
        setMoverParaGrupo(false);
        setProgress({ sent: 0, total: 0, success: 0, errors: [] });
        setShowResultModal(false);
    };

    const identifiersCount = identifiers.split("\n").filter((id) => id.trim().length > 0).length;
    const progressPercentage = progress.total > 0 ? (progress.sent / progress.total) * 100 : 0;
    const isFormValid = identifiers.trim() && (!moverParaGrupo || selectedGroup);

    return (
        <div className="space-y-6">


            <div className="flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--gradient-primary)" }}
                >
                    <OctagonX className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">Remoção Mzone</h1>
            </div>

            <div className="p-6 space-y-6 shadow-md border border-border">
                {/* Botão principal */}
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-foreground">
                        Remoção em lote de veículos do sistema
                    </h2>

                    <Button onClick={handleRemover} disabled={!isFormValid || processing}>
                        {processing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <OctagonX className="w-4 h-4" />
                                Remover Veículos
                            </>
                        )}
                    </Button>
                </div>

                {/* Opções de Remoção */}
                <div className="space-y-4 p-4 border border-border rounded-md bg-muted/30">
                    <h3 className="text-sm font-semibold text-foreground">Opções de Remoção</h3>

                    {/* Tipo de pesquisa */}
                    <div className="space-y-2">
                        <Label>Tipo de pesquisa</Label>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="searchType"
                                    value="vin"
                                    checked={searchType === "vin"}
                                    onChange={() => setSearchType("vin")}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-foreground">Chassi </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="searchType"
                                    value="unit_Description"
                                    checked={searchType === "unit_Description"}
                                    onChange={() => setSearchType("unit_Description")}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-foreground">ID do dispositivo</span>
                            </label>
                        </div>
                    </div>

                    {/* Switch 1: Remover de todos os grupos */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="remover-grupos" className="cursor-pointer">
                            Retirar de todos os grupos?
                        </Label>
                        <Switch
                            id="remover-grupos"
                            checked={removerDeGrupos}
                            onCheckedChange={setRemoverDeGrupos}
                            disabled={processing}
                        />
                    </div>

                    {/* Switch 2: Mover para grupo removidos
          <div className="flex items-center justify-between">
            <Label htmlFor="mover-grupo" className="cursor-pointer">
              Mover para grupo removidos?
            </Label>
            <Switch
              id="mover-grupo"
              checked={moverParaGrupo}
              onCheckedChange={setMoverParaGrupo}
              disabled={processing}
            />
          </div> */}

                    {/* SelectGroup condicional */}
                    {moverParaGrupo && (
                        <div className="pt-2 border-t border-border">
                            <SelectGroup
                                userGroups={vehicleGroups}
                                selectedGroup={selectedGroup}
                                loading={loadingGroups}
                                onSelect={setSelectedGroup}
                                onReload={carregarGrupos}
                            />
                        </div>
                    )}
                </div>

                {/* Textarea */}
                <div className="space-y-2">
                    <Label>
                        {searchType === "unit_Description" ? "IDs dos Dispositivos" : "Chassis dos Veículos"}
                    </Label>
                    <Textarea
                        value={identifiers}
                        onChange={(e) => setIdentifiers(e.target.value)}
                        placeholder={
                            searchType === "unit_Description"
                                ? "Cole os IDs aqui, um por linha"
                                : "Cole os chassis aqui, um por linha"
                        }
                        className="min-h-[120px] font-mono"
                        disabled={processing}
                    />
                    {identifiersCount > 0 && (
                        <p className="text-sm text-muted-foreground">
                            {identifiersCount} veículo(s) para remover
                        </p>
                    )}
                </div>

                {/* Progresso */}
                {processing && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Removendo veículos...</span>
                            <span>
                                {progress.success}/{progress.total} sucessos
                            </span>
                        </div>
                        <Progress value={progressPercentage} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            {progress.current && <span>Processando: {progress.current}</span>}
                            <span>
                                {progress.sent}/{progress.total} processados
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Modais */}
            <ConfirmDialog
                open={showConfirmModal}
                onOpenChange={setShowConfirmModal}
                onConfirm={() => {
                    confirmarRemocao();
                    setShowConfirmModal(false);
                }}
                vehicleCount={identifiersCount}
                identifierType="description" // 
                groupName={selectedGroup?.description || "Mzone"}
                actionType="remove"
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