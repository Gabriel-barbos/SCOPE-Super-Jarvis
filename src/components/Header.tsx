import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Plus,
  Search,
  KeyRound,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/services/AuthService";
import clientesData from "@/lib/credentials.json";

export function Header() {
  const { clienteAtivo, tokenExpiresAt, isRefreshing, selecionarCliente } = useAuth();

  const [statusInterno, setStatusInterno] = useState<"idle" | "loading" | "error">("idle");
  const [openNovoCliente, setOpenNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ name: "", username: "", password: "" });
  const [clientes, setClientes] = useState(clientesData);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<string>("");
  const [diferencaSegundos, setDiferencaSegundos] = useState<number>(3600);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Contador do token em tempo real
  useEffect(() => {
    if (!tokenExpiresAt) {
      setTempoRestante("");
      setDiferencaSegundos(0);
      return;
    }

    const atualizar = () => {
      const agora = Date.now();
      const expira = new Date(tokenExpiresAt).getTime();
      const diferenca = expira - agora;

      if (diferenca <= 0) {
        setTempoRestante("Expirado");
        setDiferencaSegundos(0);
        return;
      }

      setDiferencaSegundos(Math.floor(diferenca / 1000));
      const min = Math.floor(diferenca / 60000).toString().padStart(2, "0");
      const sec = Math.floor((diferenca % 60000) / 1000).toString().padStart(2, "0");
      setTempoRestante(`${min}:${sec}`);
    };

    atualizar();
    const interval = setInterval(atualizar, 1000);
    return () => clearInterval(interval);
  }, [tokenExpiresAt]);

  // Seleciona o primeiro cliente automaticamente
  useEffect(() => {
    if (!clienteAtivo && clientes.length > 0) {
      handleSelecionarCliente(clientes[0]);
    }
  }, [clientes, clienteAtivo]);

  const clientesFiltrados = clientes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdicionarCliente = async () => {
    const id = Date.now();
    const cliente = { id, ...novoCliente };
    setClientes((prev) => [...prev, cliente]);
    setNovoCliente({ name: "", username: "", password: "" });
    setOpenNovoCliente(false);
    await handleSelecionarCliente(cliente);
  };

  async function handleSelecionarCliente(cliente) {
    setStatusInterno("loading");
    try {
      await selecionarCliente(cliente);
      setStatusInterno("idle");
    } catch (err) {
      console.error(err);
      setStatusInterno("error");
    } finally {
      setDropdownOpen(false);
      setSearch("");
    }
  }

  const isTokenExpired = tempoRestante === "Expirado";
  const statusConexao =
    isRefreshing || statusInterno === "loading"
      ? "loading"
      : isTokenExpired || statusInterno === "error"
      ? "error"
      : clienteAtivo
      ? "success"
      : "idle";

  const statusDotColor =
    statusConexao === "loading"
      ? "bg-blue-400"
      : statusConexao === "error"
      ? "bg-red-400"
      : diferencaSegundos < 300
      ? "bg-amber-400"
      : "bg-emerald-400";

  const statusPingColor =
    statusConexao === "loading"
      ? "bg-blue-300"
      : statusConexao === "error"
      ? "bg-red-300"
      : diferencaSegundos < 300
      ? "bg-amber-300"
      : "bg-emerald-300";

  const statusLabel =
    statusConexao === "loading"
      ? "Conectando..."
      : statusConexao === "error"
      ? "Desconectado"
      : "Conectado";

  const statusTextColor =
    statusConexao === "loading"
      ? "text-blue-400"
      : statusConexao === "error"
      ? "text-red-400"
      : diferencaSegundos < 300
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 sticky top-0 z-50">
      {/* Lado Esquerdo */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 p-2 rounded-lg transition-all duration-150" />

        <div className="h-5 w-px bg-border/60 hidden sm:block" />

        {/* Seletor de Cliente */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => {
              if (statusInterno === "loading") return;
              setDropdownOpen((v) => !v);
              setSearch("");
            }}
            disabled={statusInterno === "loading"}
            className={`
              flex items-center gap-2.5 h-10 px-3.5 rounded-lg border transition-all duration-150
              ${statusInterno === "loading"
                ? "bg-secondary/40 border-primary/30 text-muted-foreground cursor-not-allowed"
                : dropdownOpen
                ? "bg-secondary border-primary/40 text-foreground shadow-sm shadow-primary/10"
                : "bg-secondary/30 border-border/60 text-foreground hover:bg-secondary/60 hover:border-border"
              }
            `}
          >
            {statusInterno === "loading" ? (
              <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
            ) : (
              <Building2 className="w-4 h-4 text-primary shrink-0" />
            )}
            <span className="max-w-[160px] truncate font-medium text-xs">
              {statusInterno === "loading"
                ? "Obtendo token..."
                : clienteAtivo
                ? clienteAtivo.name
                : "Selecionar cliente"}
            </span>
            {statusInterno !== "loading" && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-72 rounded-xl border border-border/80 bg-popover shadow-xl shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Busca */}
              <div className="p-2 border-b border-border/60">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                  <input
                    autoFocus
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 h-8 bg-secondary/40 border border-border/60 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:bg-secondary/60 transition-all"
                  />
                </div>
              </div>

              {/* Lista */}
              <div className="max-h-52 overflow-y-auto p-1">
                {clientesFiltrados.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    Nenhum cliente encontrado
                  </div>
                ) : (
                  clientesFiltrados.map((cliente) => {
                    const isAtivo = clienteAtivo?.id === cliente.id;
                    return (
                      <button
                        key={cliente.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelecionarCliente(cliente);
                        }}
                        className={`
                          w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-100
                          ${isAtivo
                            ? "bg-primary/10 text-foreground"
                            : "hover:bg-secondary/60 text-foreground/80 hover:text-foreground"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${isAtivo ? "bg-primary/20" : "bg-secondary"}`}>
                            <Building2 className={`w-3.5 h-3.5 ${isAtivo ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate leading-tight">{cliente.name}</p>
                            <p className="text-[10px] text-muted-foreground/60 truncate leading-tight">{cliente.username}</p>
                          </div>
                        </div>
                        {isAtivo && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Adicionar novo */}
              <div className="p-1.5 border-t border-border/60">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDropdownOpen(false);
                    setOpenNovoCliente(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-100"
                >
                  <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">Adicionar cliente</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lado Direito — Status */}
      {clienteAtivo && (
        <div className="flex items-center gap-2.5">
          {/* Timer do token */}
          {statusConexao === "success" && tempoRestante && (
            <div
              className={`hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-medium px-2 py-1 rounded-md bg-secondary/40 border border-border/40 ${
                diferencaSegundos < 300 ? "text-amber-400" : "text-muted-foreground"
              }`}
              title="Tempo restante do token"
            >
              <span>{tempoRestante}</span>
            </div>
          )}

          {/* Status pill */}
          <div
            className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all ${
              statusConexao === "loading"
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : statusConexao === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : diferencaSegundos < 300
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
            title={
              statusConexao === "loading"
                ? "Renovando token..."
                : statusConexao === "error"
                ? "Token expirado"
                : `Token ativo — expira em ${tempoRestante}`
            }
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusPingColor}`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusDotColor}`} />
            </span>
            <span>{statusLabel}</span>
          </div>
        </div>
      )}

      {/* Barra de progresso do token */}
      {clienteAtivo && statusConexao === "success" && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border/20 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              diferencaSegundos < 300 ? "bg-amber-500/60" : "bg-primary/40"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (diferencaSegundos / 3600) * 100))}%` }}
          />
        </div>
      )}

      {/* Modal de Novo Cliente */}
      <Dialog open={openNovoCliente} onOpenChange={setOpenNovoCliente}>
        <DialogContent className="bg-background border border-border/80 text-foreground shadow-xl shadow-black/40 rounded-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <KeyRound className="w-3.5 h-3.5 text-primary" />
              </div>
              Adicionar Novo Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {[
              { label: "Nome do Cliente", key: "name", placeholder: "Ex: Unidas Filial" },
              { label: "Nome de Usuário", key: "username", placeholder: "Ex: unidas_filial" },
              { label: "Senha", key: "password", placeholder: "Ex: Senha123" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {label}
                </label>
                <Input
                  placeholder={placeholder}
                  value={novoCliente[key as keyof typeof novoCliente]}
                  onChange={(e) => setNovoCliente({ ...novoCliente, [key]: e.target.value })}
                  type={key === "password" ? "text" : "text"}
                  className="bg-secondary/20 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 text-foreground rounded-lg h-9 placeholder:text-muted-foreground/40 text-xs"
                />
              </div>
            ))}
          </div>

          <DialogFooter className="border-t border-border/40 pt-3 gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpenNovoCliente(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdicionarCliente}
              disabled={!novoCliente.name || !novoCliente.username || !novoCliente.password}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-4 text-xs h-9"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
