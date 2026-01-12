import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ProgressModalProps {
  open: boolean;
  progress: number;
  currentItem?: string | null;
}

export default function ProgressSetupModal({
  open,
  progress,
  currentItem,
}: ProgressModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Processando Setup</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* GIF placeholder */}
          <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
            GIF aqui
          </div>

          <Progress value={progress} className="w-full" />

          <span className="text-sm text-muted-foreground">
            {progress}% concluído
          </span>

          {currentItem && (
            <span className="text-xs text-muted-foreground">
              Processando: {currentItem}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
