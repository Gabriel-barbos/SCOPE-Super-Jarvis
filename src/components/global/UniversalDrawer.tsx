import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface UniversalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon?: ReactNode;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  styleType?: "create" | "edit";
}

export function UniversalDrawer({
  open,
  onOpenChange,
  title,
  icon,
  description,
  children,
  size = "md",
  styleType = "create",
}: UniversalDrawerProps) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
  };

  const colorClasses =
    styleType === "create"
      ? {
          iconBg: "bg-green-500/10",
          iconColor: "text-green-600",
        }
      : {
          iconBg: "bg-yellow-500/10",
          iconColor: "text-yellow-600",
        };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("p-6", sizes[size])} side="right">
        <SheetHeader>
          <div className="flex items-center gap-4">
            {/* Ícone com fundo */}
            {icon && (
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg",
                  colorClasses.iconBg
                )}
              >
                <div className={cn("h-6 w-6", colorClasses.iconColor)}>{icon}</div>
              </div>
            )}
            {/* Título */}
            <div>
              <SheetTitle
                className={cn(
                  "text-xl font-semibold",
                )}
              >
                {title}
              </SheetTitle>
              {description && (
                <SheetDescription className=" text-sm text-muted-foreground">
                  {description}
                </SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
