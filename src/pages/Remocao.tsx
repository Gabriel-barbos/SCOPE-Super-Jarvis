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
        if (!identifiers.trim()) return;
        if (moverParaGrupo && !selectedGroup) return;
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
            const results: OperationResult[] = await vehicleService.processarRemocaoEmLote(
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

            const successCount = results.filter((r) => r.success).length;
            setResultSuccess(successCount > 0);
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

    const identifiersCount = identifiers
        .split("\n")
        .filter((id) => id.trim().length > 0).length;

    const progressPercentage =
        progress.total > 0 ? (progress.sent / progress.total) * 100 : 0;

    const isFormValid = identifiers.trim() && (!moverParaGrupo || selectedGroup);

    return (
        <div className="space-y-6">
            {/* Header */}
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
                    <div className="text-lg font-medium text-foreground">
                        <h1>Remoção em lote de veículos do sistema </h1>
                    </div>

                    <Button
                        onClick={handleRemover}
                        disabled={!isFormValid || processing}
                        className=""
                    >
                        {processing ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processando...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <OctagonX className="w-4 h-4" />
                                Remover Veículos
                            </div>
                        )}
                    </Button>
                </div>


                {/* Opções de Remoção */}
                <div className="space-y-4 p-4 border border-border rounded-md bg-muted/30">
                    <h3 className="text-sm font-semibold text-foreground">Opções de Remoção</h3>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Tipo de pesquisa
                        </label>

                        <div className="flex gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-foreground">Buscar por:</span>
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="searchType"
                                            value="vin"
                                            checked={searchType === "vin"}
                                            onChange={(e) => setSearchType(e.target.value as "vin")}
                                            className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 bg-input border-border"
                                        />
                                        <span className="text-sm text-foreground">Chassi</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="searchType"
                                            value="description"
                                            checked={searchType === "unit_Description"}
                                            onChange={(e) => setSearchType("unit_Description")}
                                            className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 bg-input border-border"
                                        />
                                        <span className="text-sm text-foreground">ID do dispositivo</span>
                                    </label>
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Switch 1 Remover de todos os grupos */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="remover-grupos" className="text-sm font-medium cursor-pointer">
                            Retirar de todos os grupos?
                        </Label>
                        <Switch
                            id="remover-grupos"
                            checked={removerDeGrupos}
                            onCheckedChange={setRemoverDeGrupos}
                            disabled={processing}
                        />
                    </div>

                    {/* Switch 2 Mover para grupo removidos */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="mover-grupo" className="text-sm font-medium cursor-pointer">
                            Mover para grupo removidos?
                        </Label>
                        <Switch
                            id="mover-grupo"
                            checked={moverParaGrupo}
                            onCheckedChange={setMoverParaGrupo}
                            disabled={processing}
                        />
                    </div>

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
                    <label className="text-sm font-medium text-foreground">
                        {searchType === "unit_Description"
                            ? "IDs dos Dispositivos"
                            : "Chassis dos Veículos"}
                    </label>

                    <Textarea
                        value={identifiers}
                        onChange={(e) => setIdentifiers(e.target.value)}
                        placeholder={
                            searchType === "unit_Description"
                                ? "Cole os IDs aqui, uma por linha"
                                : "Cole os chassis aqui, um por linha"
                        }
                        className="min-h-[120px] font-mono"
                        disabled={processing}
                    />

                    {identifiersCount > 0 && (
                        <div className="text-sm text-muted-foreground">
                            {identifiersCount} veículo(s) para remover
                        </div>
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
                            {progress.current && <div>Processando: {progress.current}</div>}
                            <div>
                                {progress.sent}/{progress.total} processados
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modais */}
            <ConfirmModal
                show={showConfirmModal}
                vehicleCount={identifiersCount}
                groupName={selectedGroup?.description || "Sistema"}
                onConfirm={confirmarRemocao}
                onCancel={() => setShowConfirmModal(false)}
            />

            <ResultModal
                open={showResultModal}
                success={resultSuccess}
                groupName={selectedGroup?.description || "Sistema"}
                progress={progress}
                onClose={() => setShowResultModal(false)}
                onReset={resetForm}
            />
        </div>
    );
}