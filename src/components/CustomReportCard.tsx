import { useState } from "react";
import {
    FileCog,
    FilePlus2,
    Loader2,
    CheckCircle2,
    XCircle,
    Locate,
    Car,
    IdCard,
    CarFront,
    MapPin,
    Calendar,
    Gauge
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group";

import vehicleExportService from "@/services/ReportService";

function CustomReportCard() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
    const [result, setResult] = useState<{ success: boolean; message: string; total: number } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

    const handleGerarRelatorioPersonalizado = async () => {
        if (selectedColumns.length === 0) {
            setResult({
                success: false,
                message: "Selecione pelo menos um campo para gerar o relatório",
                total: 0,
            });
            setShowModal(true);
            return;
        }

        setLoading(true);
        setResult(null);
        setShowModal(false);
        setProgress({ current: 0, total: 0, status: "Iniciando análise..." });

        try {
            //Chamando  função do relatório personalizado passando as colunas selecionadas
            const resultado = await vehicleExportService.gerarRelatorioPersonalizado(
                selectedColumns, // Passa o array de strings do ToggleGroup
                (current, total, status) => setProgress({ current, total, status })
            );

            setResult(resultado);
        } catch (error: any) {
            setResult({
                success: false,
                message: error.message || "Erro inesperado durante a exportação.",
                total: 0,
            });
        } finally {
            setLoading(false);
            setShowModal(true);
        }
    };

    //Mantém a função original para relatório padrão
    const handleGerarRelatorio = async () => {
        setLoading(true);
        setResult(null);
        setShowModal(false);
        setProgress({ current: 0, total: 0, status: "Iniciando análise..." });

        try {
            const resultado = await vehicleExportService.exportarVeiculos(
                (current, total, status) => setProgress({ current, total, status })
            );

            setResult(resultado);
        } catch (error: any) {
            setResult({
                success: false,
                message: error.message || "Erro inesperado durante a exportação.",
                total: 0,
            });
        } finally {
            setLoading(false);
            setShowModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setResult(null);
    };

    const progressPercent = progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    return (
        <>
            <Card className="p-6 shadow-md border border-border">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-600 to-blue-400 flex items-center justify-center flex-shrink-0">
                        <FileCog className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-xl font-semibold">Lista de veículos personalizada <Badge className="ml-2 bg-orange-100 text-orange-800 font-medium px-2 py-1 rounded-lg text-sm">Em desenvolvimento</Badge> </h2>
                        <p className="text-sm text-muted-foreground">
                            Extraia uma lista de veículos com os campos desejados.
                        </p>

                        {/* Progresso */}
                        {loading && (
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{progress.status}</span>
                                    {progress.total > 0 && (
                                        <span className="font-medium text-primary">{progressPercent}%</span>
                                    )}
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                                {progress.total > 0 && (
                                    <p className="text-xs text-muted-foreground text-right">
                                        {progress.current.toLocaleString()} / {progress.total.toLocaleString()} veículos
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-shrink-0">
                        <Button
                            variant="default"
                            onClick={handleGerarRelatorioPersonalizado}
                            disabled={loading}
                            className="gap-2 bg-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    Gerar Relatório
                                    <FilePlus2 className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Seletor de colunas */}
                <div className="mt-6">
                    <h2 className="mb-2 text-base font-semibold ">Selecione as informações desejadas:</h2>

                    <ToggleGroup
                        type="multiple"
                        variant="outline"
                        size="sm"
                        className="mb-2 mt-2 flex justify-start left-2"
                        value={selectedColumns}
                        onValueChange={(values) => setSelectedColumns(values)}
                    >
                        <ToggleGroupItem value="unit_Description" aria-label="Unidade"
                            className="data-[state=on]:bg-blue-700 data-[state=on]:text-white-700 data-[state=on]:*:[svg]:fill-red-500 data-[state=on]:*:[svg]:stroke-red-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

                        >
                            <Locate />
                            ID da unidade
                        </ToggleGroupItem>

                        <ToggleGroupItem value="vin" aria-label="Chassi" className="data-[state=on]:bg-blue-700 data-[state=on]:text-white-700 data-[state=on]:*:[svg]:fill-red-500 data-[state=on]:*:[svg]:stroke-red-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <Car />
                            Chassi
                        </ToggleGroupItem>

                        <ToggleGroupItem value="description" aria-label="Descrição" className="data-[state=on]:bg-blue-700 data-[state=on]:text-white-700 data-[state=on]:*:[svg]:fill-red-500 data-[state=on]:*:[svg]:stroke-red-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <IdCard />
                            Descrição
                        </ToggleGroupItem>

                        <ToggleGroupItem value="registration" aria-label="Placa" className="data-[state=on]:bg-blue-700 data-[state=on]:text-white-700 data-[state=on]:*:[svg]:fill-red-500 data-[state=on]:*:[svg]:stroke-red-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <CarFront />
                            Placa
                        </ToggleGroupItem>

                        <ToggleGroupItem value="lastLocation" aria-label="Última localização" className="data-[state=on]:bg-blue-700 data-[state=on]:text-white-700 data-[state=on]:*:[svg]:fill-red-500 data-[state=on]:*:[svg]:stroke-red-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <MapPin />
                            Últ. localização
                        </ToggleGroupItem>

                        <ToggleGroupItem value="lastKnownEventUtcTimestamp" aria-label="Última atualização" className="data-[state=on]:bg-blue-700 data-[state=on]:text-white-700 data-[state=on]:*:[svg]:fill-red-500 data-[state=on]:*:[svg]:stroke-red-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <Calendar />
                            Últ. atualização
                        </ToggleGroupItem>

                        <ToggleGroupItem value="odometer" aria-label="Odômetro" className="data-[state=on]:bg-blue-700 data-[state=on]:text-white-700 data-[state=on]:*:[svg]:fill-red-500 data-[state=on]:*:[svg]:stroke-red-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <Gauge />
                            Odômetro
                        </ToggleGroupItem>

                        
                        <ToggleGroupItem value="utcStartDate" aria-label="StartDate" className="data-[state=on]:bg-blue-700 data-[state=on]:text-white-700 data-[state=on]:*:[svg]:fill-red-500 data-[state=on]:*:[svg]:stroke-red-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <Gauge />
                            Startdate
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </Card>

            {/* Modal de resultado */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            {result?.success ? (
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                            )}
                            <div className="flex-1">
                                <DialogTitle>
                                    {result?.success ? "Relatório Gerado!" : "Erro na Exportação"}
                                </DialogTitle>
                            </div>
                        </div>
                    </DialogHeader>

                    <DialogDescription className="pt-4 space-y-3">
                        <p className="text-base text-foreground">{result?.message}</p>

                        {result?.success && result.total > 0 && (
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total de veículos:</span>
                                    <span className="text-lg font-bold text-primary">
                                        {result.total.toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    O arquivo foi baixado automaticamente para sua pasta de downloads.
                                </p>
                            </div>
                        )}

                        {!result?.success && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800">
                                    {result?.message || "Erro inesperado. Fale com o responsável técnico."}
                                </p>
                            </div>
                        )}
                    </DialogDescription>

                    <DialogFooter className="sm:justify-end">
                        {result?.success ? (
                            <Button onClick={handleCloseModal} className="w-full sm:w-auto">
                                Fechar
                            </Button>
                        ) : (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button variant="outline" onClick={handleCloseModal} className="flex-1">
                                    Fechar
                                </Button>
                                <Button onClick={handleGerarRelatorio} className="flex-1">
                                    Tentar Novamente
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default CustomReportCard;
