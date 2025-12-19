import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputWithIcon } from "../components/global/InputWithIcon";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { User, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

// Schema dinâmico baseado no modo (criar ou editar)
const createFormSchema = (isEditing: boolean) =>
  z.object({
    name: z.string().min(2, "Nome muito curto"),
    email: z.string().email("Email inválido"),
    password: isEditing
      ? z.string().optional()
      : z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    role: z.enum(["administrator", "logistics", "support", "scheduling"]),
  });

export type UserFormValues = z.infer<ReturnType<typeof createFormSchema>>;

type Props = {
  userId?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function ClientForm({ userId, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(userId);

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(createFormSchema(isEditing)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "support",
    },
  });

//   // Carrega dados se for editar
//   useEffect(() => {
//     if (!userId) return;

//     (async () => {
//       try {
//         const user = await UserService.getById(userId);
        
//         reset({
//           name: user.name,
//           email: user.email,
//           role: user.role as any,
//           password: "",
//         });
//       } catch (err) {
//         console.error("Erro ao carregar usuário:", err);
//       }
//     })();
//   }, [userId, reset]);

//   async function onSubmit(data: UserFormValues) {
//     try {
//       setLoading(true);

//       if (isEditing) {
//         await UserService.update(userId!, {
//           name: data.name,
//           email: data.email,
//           role: data.role,
//           // só envia senha se digitada
//           ...(data.password ? { password: data.password } : {}),
//         });
//         toast.success("Usuário atualizado com sucesso!");
//       } else {
//         await UserService.create({
//           name: data.name,
//           email: data.email,
//           password: data.password || "",
//           role: data.role,
//         });
//         toast.success("Usuário criado com sucesso!");
//       }

//       onSuccess();
//     } catch (err: any) {
//       console.error("Erro ao salvar usuário:", err);
//       const errorMessage = err?.response?.data?.message || "Erro ao salvar usuário";
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }

  return (
    <form  className="space-y-5 p-2">
      {/* Nome */}
      <div className="space-y-1">
        <Label>Nome</Label>
        <InputWithIcon
          icon={<User className="h-4 w-4" />}
          placeholder="Nome do Cliente"
          error={errors.name?.message}
          {...register("name")}
        />
      </div>

      {/* Email */}
      <div className="space-y-1">
        <Label>Email</Label>
        <InputWithIcon
          icon={<Mail className="h-4 w-4" />}
          placeholder="Ex.lmfadmscope"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>

      {/* Senha */}
      <div className="space-y-1">
        <Label>Senha {isEditing && "(opcional)"}</Label>
        <InputWithIcon
          icon={<Lock className="h-4 w-4" />}
          placeholder={isEditing ? "Deixe vazio para não alterar" : "Senha"}
          error={errors.password?.message}
          {...register("password")}
        />
      </div>

      {/* Role */}
      <div className="space-y-1">
        <Label>Tipo</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrator">Cliente</SelectItem>
                <SelectItem value="logistics">Sub-Cliente</SelectItem>
                <SelectItem value="support">Piloto</SelectItem>
                <SelectItem value="scheduling">Outro</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      {/* AÇÕES */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar"}
        </Button>
      </div>
    </form>
  );
}