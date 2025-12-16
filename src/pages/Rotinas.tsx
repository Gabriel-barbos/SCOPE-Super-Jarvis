import { CalendarClock, Zap, Play, Upload, CheckCircle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import UnidasCard from "@/components/UnidasCard";
import { AnimatedBeamMultipleOutputDemo } from "@/components/RoutineCard";
import { UploadComponent } from "@/components/UploadComponent";
interface SpreadsheetData {
  name: string;
  routines: number;
  installations: number;
}

export default function Rotinas() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SpreadsheetData | null>(null);
  const [isAnimationActive, setIsAnimationActive] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    // Simula carregamento da planilha
    setTimeout(() => {
      setData({
        name: "Planilha de Instalação",
        routines: 8,
        installations: 244,
      });
      setIsLoading(false);
    }, 2000);
  };

  const handleExecute = () => {
    setIsAnimationActive(true);
  };

  const handleReset = () => {
    setFile(null);
    setData(null);
    setIsAnimationActive(false);
  };

  const hasFile = file !== null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
          <CalendarClock className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Rotinas</h1>
      </div>

      <UnidasCard />

      <div className="rounded-xl border border-border p-6 shadow-md">
        <div className="flex items-center gap-3 mb-6">
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
    </div>
  );
}

