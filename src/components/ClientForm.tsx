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
import { useClients } from "@/hooks/useClients";


// Schema dinâmico baseado no modo (criar ou editar)

const createFormSchema = (isEditing: boolean) =>
  z.object({
    name: z.string().min(2, "Nome muito curto"),
    login: z.string().min(2,"login muito curto"),
    password: isEditing
      ? z.string().optional()
      : z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    type: z.enum(["Cliente", "Sub-Cliente", "Piloto", "Outro"]),
  });


export type UserFormValues = z.infer<ReturnType<typeof createFormSchema>>;

type Props = {
  clientId?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function ClientForm({ clientId, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(clientId);

  const {
  createClient,
  updateClient,
  getById,
} = useClients();

const {
  data: client,
  isLoading: isLoadingClient,
} = getById(clientId);

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
    login: "",
    password: "",
    type: "Cliente",
  },
});


  // Carrega dados se for editar
useEffect(() => {
  if (!client) return;

  reset({
    name: client.name,
    login: client.login, // backend usa login
    type: client.type as UserFormValues["type"],
    password: "",
  });
}, [client, reset]);


async function onSubmit(data: UserFormValues) {
  try {
    setLoading(true);

    if (isEditing && clientId) {
      await updateClient({
        id: clientId,
        data: {
          name: data.name,
          login: data.login,
          type: data.type,
          ...(data.password ? { password: data.password } : {}),
        },
      });

      toast.success("Usuário atualizado com sucesso!");
    } else {
      await createClient({
        name: data.name,
        login: data.login,
        password: data.password!,
        type: data.type,
      });

      toast.success("Usuário criado com sucesso!");
    }

    onSuccess();
  } catch (err: any) {
    toast.error("Erro ao salvar usuário");
  } finally {
    setLoading(false);
  }
}


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
        <Label>Login</Label>
        <InputWithIcon
          icon={<Mail className="h-4 w-4" />}
          placeholder="Ex.lmfadmscope"
          error={errors.login?.message}
          {...register("login")}
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
          name="type"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cliente">Cliente</SelectItem>
                <SelectItem value="Sub-Cliente">Sub-Cliente</SelectItem>
                <SelectItem value="Piloto">Piloto</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      {/* AÇÕES */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>

        <Button type="submit" disabled={loading} onClick={handleSubmit(onSubmit)}>
          {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar"}
        </Button>
      </div>
    </form>
  );
}