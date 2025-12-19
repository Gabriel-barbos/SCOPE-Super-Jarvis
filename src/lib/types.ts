export interface ResultDialogProps {
  open: boolean;
  status: "success" | "partial" | "error";
  title: string;
  description?: string;

  summary?: {
    success: number;
    total: number;
  };

  errors?: string[];

  onClose: () => void;
  onReset?: () => void;
}
