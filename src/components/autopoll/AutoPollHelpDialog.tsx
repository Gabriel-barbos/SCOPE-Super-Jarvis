import {
  HelpCircle,
  Zap,
  Activity,
  Clock,
  CheckCircle2,
  Wrench,
  EyeOff,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "./AutoPollHelpers";

interface AutoPollHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutoPollHelpDialog({ open, onOpenChange }: AutoPollHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            Como funciona
          </DialogTitle>
          <DialogDescription className="text-sm">
            
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* O que é */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-500/90 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              O Funcionamento da Rotina
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 p-4 rounded-xl border border-border/50">
              O sistema monitora e identifica veículos <strong>ativos</strong> que estão sem comunicar na plataforma <strong>MZone por mais de 72 horas</strong>.
              <span className="block mt-2">
                <strong>Frequência:</strong> A rotina é disparada de forma agendada duas vezes por semana, nas <strong>Terças e Sextas-feiras às 06:00</strong>. Em cada disparo, são enviados comandos de <em>poll</em> para tentar restabelecer a conexão automática.
              </span>
            </p>
          </div>

          {/* Legenda de Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-500/90 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Entendendo os Status dos Veículos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* pending */}
              <div className="p-4 rounded-xl border border-border bg-card hover:border-amber-500/30 transition-all duration-200 space-y-2">
                <div className="flex items-center justify-between">
                  <StatusBadge status="pending" />
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Veículo offline há 72h+ com processo de recuperação ativo. Receberá até <strong>3 tentativas</strong> de envio de sinal nas próximas execuções.
                </p>
              </div>

              {/* recovered */}
              <div className="p-4 rounded-xl border border-border bg-card hover:border-green-500/30 transition-all duration-200 space-y-2">
                <div className="flex items-center justify-between">
                  <StatusBadge status="recovered" />
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O veículo voltou a comunicar após o envio do poll. O contador de tentativas foi zerado e ele saiu do fluxo de recuperação.
                </p>
              </div>

              {/* maintenance */}
              <div className="p-4 rounded-xl border border-border bg-card hover:border-orange-500/30 transition-all duration-200 space-y-2">
                <div className="flex items-center justify-between">
                  <StatusBadge status="maintenance" />
                  <Wrench className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Passou por todas as <strong>3 tentativas seguidas</strong> sem resposta. Direcionado para a fila de manutenção técnica/física do equipamento.
                </p>
              </div>

              {/* ignored */}
              <div className="p-4 rounded-xl border border-border bg-card hover:border-slate-500/30 transition-all duration-200 space-y-2">
                <div className="flex items-center justify-between">
                  <StatusBadge status="ignored" />
                  <EyeOff className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Veículos em manutenção identificados posteriormente como desativados no sistema (ex: removidos, cancelados ou sem unidade). Não requerem ação.
                </p>
              </div>
            </div>
          </div>

          {/* Ciclo de Vida e Fluxo de Transição */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-500/90 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Guia de Ciclo de Vida & Transições
            </h3>
            
            {/* Timeline visual */}
            <div className="border border-border/80 rounded-xl p-4 bg-muted/20 space-y-4">
              <div className="relative pl-6 border-l border-blue-500/30 space-y-6">
                
                {/* Filtro inicial */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border border-background flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">1. Triagem e Filtro de Ativos</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Veículos com termos como <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">REMOVIDO</code>, <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">CANCELADO</code>, <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">CANCELAMENTO</code>, <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">DESATIVADO</code> ou com unidade desassociada (descrição da unidade contendo <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px]">_</code>) são ignorados de imediato e não entram em recuperação.
                  </p>
                </div>

                {/* Fluxo de Tentativas */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-amber-500 border border-background flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">2. Fluxo de Tentativas (Polls)</h4>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-center">
                      <p className="text-[10px] font-semibold text-amber-500 uppercase">Execução 1</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Entra como Pendente (Tentativa 1)</p>
                    </div>
                    <div className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-center">
                      <p className="text-[10px] font-semibold text-amber-500 uppercase">Execução 2</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Se offline: permanece Pendente (Tentativa 2)</p>
                    </div>
                    <div className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-center">
                      <p className="text-[10px] font-semibold text-amber-500 uppercase">Execução 3</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Se offline: permanece Pendente (Tentativa 3)</p>
                    </div>
                  </div>
                </div>

                {/* Manutenção técnica */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-orange-500 border border-background flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">3. Transição para Manutenção</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Caso continue offline após as 3 tentativas sucessivas de poll, seu status é alterado automaticamente para <strong className="text-orange-400">Manutenção</strong>.
                  </p>
                </div>

                {/* Recuperação de sucesso */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-green-500 border border-background flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">4. Sucesso de Conexão</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Se o veículo comunicar em <strong>qualquer</strong> momento desse fluxo de tentativas, ele é marcado imediatamente como <strong className="text-green-400">Recuperado</strong> e sai do ciclo.
                  </p>
                </div>

                {/* Revalidação e Ignore */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-500 border border-background flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">5. Revalidação & Exclusão Técnica (Ignorado)</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    O endpoint de revalidação verifica periodicamente os veículos marcados como Manutenção. Se algum tiver sido cancelado, desassociado ou desativado na MZone após entrar no fluxo, ele é movido para <strong className="text-slate-400">Ignorado</strong>, otimizando o trabalho da equipe de campo.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
