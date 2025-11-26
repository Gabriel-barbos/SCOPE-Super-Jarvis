import { Input } from "@/components/ui/input";
import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
}

/**
 * InputWithIcon
 * Componente genérico para inputs com ícone e suporte a erro.
 *
 * Exemplo de uso:
 * <InputWithIcon
 *   icon={<Mail />}
 *   placeholder="Digite seu e-mail"
 *   {...register("email")}
 *   error={errors.email?.message}
 * />
 */
export const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ icon, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </span>
          )}
          <Input
            ref={ref}
            className={cn(icon && "pl-10", className)}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

InputWithIcon.displayName = "InputWithIcon";