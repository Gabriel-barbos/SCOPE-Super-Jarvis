import { useState } from "react";
import { Upload, Play, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";


export interface SpreadsheetData {
  name: string;
  routines: number;
  installations: number;
}

interface UploadComponentProps {
  onExecute: () => void;
  isAnimationActive: boolean;
}



export function UploadComponent({   
  onExecute,
  isAnimationActive,
}: UploadComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SpreadsheetData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    // Simulação de processamento
    setTimeout(() => {
      setData({
        name: "Planilha de Instalação",
        routines: 8,
        installations: 244,
      });
      setIsLoading(false);
    }, 2000);
  };

  const handleReset = () => {
    setFile(null);
    setData(null);
  };

  const hasData = Boolean(file && data);

  return (
    <div
      className={cn(
        "gap-6",
        hasData ? "grid grid-cols-2" : "grid grid-cols-1"
      )}
    >
      <UploadSection
        file={file}
        isLoading={isLoading}
        data={data}
        onFileChange={handleFileChange}
        onReset={handleReset}
        onExecute={onExecute}
        isAnimationActive={isAnimationActive}
      />

      {hasData && <DataSummary data={data!} />}
    </div>
  );
}



interface UploadSectionProps {
  file: File | null;
  isLoading: boolean;
  data: SpreadsheetData | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onExecute: () => void;
  isAnimationActive: boolean;
}

function UploadSection({
  file,
  isLoading,
  data,
  onFileChange,
  onReset,
  onExecute,
  isAnimationActive,
}: UploadSectionProps) {
  return (
    <div className="space-y-4">
      {!file ? (
        <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-400 rounded-lg cursor-pointer hover:border-slate-300 hover:bg-slate-900/30 transition-all">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">
                Selecione uma planilha
              </p>
              <p className="text-xs text-slate-400">
                Formatos: .xlsx, .xls, .csv
              </p>
            </div>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFileChange}
            className="hidden"
          />
        </label>
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <FileLoadedState
          data={data}
          onReset={onReset}
          onExecute={onExecute}
          isAnimationActive={isAnimationActive}
        />
      )}
    </div>
  );
}


function LoadingState() {
  return (
    <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg">
      <div className="animate-spin">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
      <span className="text-sm text-slate-300">
        Carregando planilha...
      </span>
    </div>
  );
}



interface FileLoadedStateProps {
  data: SpreadsheetData | null;
  onReset: () => void;
  onExecute: () => void;
  isAnimationActive: boolean;
}

function FileLoadedState({
  data,
  onReset,
  onExecute,
  isAnimationActive,
}: FileLoadedStateProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-sm font-medium text-white">
            {data?.name}
          </p>
        </div>

        <button
          onClick={onReset}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
          title="Remover arquivo"
        >
          <X className="w-4 h-4 text-slate-400 hover:text-white" />
        </button>
      </div>

      <button
        onClick={onExecute}
        disabled={isAnimationActive}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300",
          isAnimationActive
            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600 text-white"
        )}
      >
        <Play className="w-4 h-4" />
        {isAnimationActive ? "Processando..." : "Executar"}
      </button>
    </div>
  );
}



interface DataSummaryProps {
  data: SpreadsheetData;
}

function DataSummary({ data }: DataSummaryProps) {
  return (
    <div className="space-y-3 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
        Resumo da Planilha
      </h3>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Nome</p>
          <p className="text-sm font-medium text-white">
            {data.name}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">
            Rotinas Encontradas
          </p>
          <p className="text-2xl font-bold text-blue-400">
            {data.routines}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">
            Instalações Encontradas
          </p>
          <p className="text-2xl font-bold text-emerald-400">
            {data.installations}
          </p>
        </div>
      </div>
    </div>
  );
}
