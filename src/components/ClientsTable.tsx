import { useState, useEffect } from "react";
import { Copy, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useClients, Client } from "@/hooks/useClients";
import { Input } from "./ui/input";

interface ClientsDataTableProps {
    onEdit: (clientId: string) => void;
}

export function ClientsDataTable({ onEdit }: ClientsDataTableProps) {
    const { clients, isLoading, deleteClient, isDeleting } = useClients();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.login.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calcular paginação
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    // Função para copiar texto
    const copyToClipboard = async (text: string, fieldId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldId);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error("Erro ao copiar:", err);
        }
    };

    // Resetar para página 1 quando buscar
useEffect(() => {
  setCurrentPage(1);
}, [searchTerm]);

    // Função para obter iniciais
    const getInitials = (name: string) => {
        const words = name.trim().split(" ");
        if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    // Função para obter cor do avatar baseado no nome
    const getAvatarColor = (name: string) => {
        const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-purple-500",
            "bg-orange-500",
            "bg-pink-500",
            "bg-indigo-500",
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    // Função para obter badge do tipo
    const getTypeBadge = (type: string) => {
        const badgeConfig = {
            Cliente: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
            "Sub-Cliente": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
            Piloto: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
            Outro: "bg-gray-500 hover:bg-gray-600 text-white",
        };

        return (
            <Badge className={badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.Outro}>
                {type}
            </Badge>
        );
    };

    // Abrir dialog de confirmação
    const handleDeleteClick = (client: Client) => {
        setClientToDelete(client);
        setDeleteDialogOpen(true);
    };

    // Confirmar exclusão
    const handleConfirmDelete = async () => {
        if (clientToDelete) {
            try {
                await deleteClient(clientToDelete._id);
                setDeleteDialogOpen(false);
                setClientToDelete(null);
            } catch (error) {
                console.error("Erro ao excluir cliente:", error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
            </div>
        );
    }

    return (
        <>
        <div className="flex items-center gap-4 mb-4">
  <Input
    placeholder="Buscar por nome ou login..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="max-w-sm"
  />
  <span className="text-sm text-muted-foreground">
    {filteredClients.length} cliente(s) encontrado(s)
  </span>
</div>
            <div className="rounded-lg border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr className="border-b">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[80px]">

                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Nome
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Login
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Senha
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Tipo
                                </th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedClients.map((client) => (
                                <tr key={client._id} className="border-b hover:bg-muted/50 transition-colors">
                                    {/* Avatar */}
                                    <td className="p-4 align-middle">
                                        <Avatar className={getAvatarColor(client.name)}>
                                            <AvatarFallback className="bg-transparent text-white font-semibold">
                                                {getInitials(client.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </td>

                                    {/* Nome */}
                                    <td className="p-4 align-middle font-medium">{client.name}</td>

                                    {/* Login */}
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm">{client.login}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => copyToClipboard(client.login, `login-${client._id}`)}
                                            >
                                                {copiedField === `login-${client._id}` ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>

                                    {/* Senha */}
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm">{client.password}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => copyToClipboard(client.password, `password-${client._id}`)}
                                            >
                                                {copiedField === `password-${client._id}` ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>

                                    {/* Tipo */}
                                    <td className="p-4 align-middle">{getTypeBadge(client.type)}</td>

                                    {/* Ações */}
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onEdit(client._id)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteClick(client)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredClients.length)} de {filteredClients.length} registros
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="text-sm">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Próxima
                                    </Button>
                                </div>
                            </div>
                        )}
                </div>
            </div>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-destructive" />
                            Confirmar Exclusão
                        </DialogTitle>
                        <DialogDescription>
                            Você está prestes a excluir o cliente:
                            <br />
                            <strong className="text-foreground">{clientToDelete?.name}</strong>
                            <br />
                            <br />
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}