import { useState, useEffect } from "react";
import { ChevronDown, Settings, LogOut, Building2, Plus, Loader2, CircleCheck, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/services/AuthService";
import clientesData from "@/lib/credentials.json";

export function Header() {
  const { clienteAtivo, selecionarCliente, limparCliente } = useAuth();
  const [statusCliente, setStatusCliente] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Modal de novo cliente
  const [openNovoCliente, setOpenNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ name: "", username: "", password: "" });

  // Lista de clientes
  const [clientes, setClientes] = useState(clientesData);

  // Autocomplete
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Atualiza o campo de busca quando o cliente ativo muda
  useEffect(() => {
    if (clienteAtivo && !isSearchFocused) {
      setSearch(clienteAtivo.name);
    } else if (!clienteAtivo && !isSearchFocused) {
      setSearch(""); // Nenhum cliente selecionado inicialmente
      setStatusCliente("idle");
    }
  }, [clienteAtivo, isSearchFocused]);

  const clientesFiltrados = clientes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    (!clienteAtivo || c.id !== clienteAtivo.id) // Não mostra o cliente já selecionado na lista
  );

  const handleAdicionarCliente = async () => {
    const id = Date.now();
    const cliente = { id, ...novoCliente };
    setClientes((prev) => [...prev, cliente]);
    setNovoCliente({ name: "", username: "", password: "" });
    setOpenNovoCliente(false);

    // Seleciona automaticamente o novo cliente
    await handleSelecionarCliente(cliente);
  };

  async function handleSelecionarCliente(cliente) {
    setStatusCliente("loading");
    try {
      await selecionarCliente(cliente);
      setStatusCliente("success");
      setSearch(cliente.name);
      setIsSearchFocused(false);
    } catch (err) {
      console.error(err);
      setStatusCliente("error");
    }
  }

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setSearch(""); // Limpa o campo quando focado
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setIsSearchFocused(false);
      if (clienteAtivo) {
        setSearch(clienteAtivo.name);
      } else {
        setSearch(""); // Continua vazio se nenhum cliente selecionado
      }
    }, 200);
  };

  const handleLimparCliente = () => {
    limparCliente();
    setSearch("");
    setStatusCliente("idle");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-foreground hover:bg-accent" />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Cliente:</span>

          {/* Botão + */}
          <Button
            variant="outline"
            className="flex items-center gap-1 bg-slate-900 border border-slate-600 text-slate-200 hover:bg-slate-800"
            onClick={() => setOpenNovoCliente(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>

          {/* Autocomplete */}
          <div className="relative">
            <Input
              placeholder="Pesquisar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className={`
                w-44 pr-10
                bg-background
                text-foreground
                border ${clienteAtivo ? "border-blue-500" : "border-border"}
                focus:border-blue-500 focus:ring-blue-500
                placeholder:text-muted-foreground
              `}
            />
            {isSearchFocused && search && (
              <ul className="absolute z-10 mt-1 w-64 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg">
                {clientesFiltrados.map(cliente => (
                  <li
                    key={cliente.id}
                    className="cursor-pointer px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleSelecionarCliente(cliente)}
                  >
                    <Building2 className="w-4 h-4 inline mr-2" />
                    {cliente.name}
                  </li>
                ))}
                {clientesFiltrados.length === 0 && (
                  <li className="px-4 py-2 text-muted-foreground">Nenhum cliente encontrado</li>
                )}
              </ul>
            )}
          </div>

          {/* Status do cliente */}
          <div className="ml-2 flex items-center gap-2">
            {statusCliente === "loading" && (
              <div className="flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-blue-500 text-xs">Carregando...</span>
              </div>
            )}
            {statusCliente === "success" && (
              <div className="flex items-center gap-1">
                <CircleCheck className="w-4 h-4 text-green-500" />
                <span className="text-green-500 text-xs">Token ativo</span>
              </div>
            )}
            {statusCliente === "error" && (
              <div className="flex items-center gap-1">
                <CircleX className="w-4 h-4 text-red-500" />
                <span className="text-red-500 text-xs">Erro no token</span>
              </div>
            )}
            {statusCliente === "idle" && !clienteAtivo && (
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500 text-xs">Nenhum cliente selecionado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">


        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={handleLimparCliente}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Modal de Novo Cliente */}
      <Dialog open={openNovoCliente} onOpenChange={setOpenNovoCliente}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              placeholder="Nome do Cliente"
              value={novoCliente.name}
              onChange={(e) => setNovoCliente({ ...novoCliente, name: e.target.value })}
            />
            <Input
              placeholder="Username"
              value={novoCliente.username}
              onChange={(e) => setNovoCliente({ ...novoCliente, username: e.target.value })}
            />
            <Input
              placeholder="Senha"
              type="password"
              value={novoCliente.password}
              onChange={(e) => setNovoCliente({ ...novoCliente, password: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleAdicionarCliente}
              disabled={!novoCliente.name || !novoCliente.username || !novoCliente.password}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
