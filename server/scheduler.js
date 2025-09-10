import cron from 'node-cron';
import { runUnidasRoutine } from './unidasRoutine.js';

console.log('📅 [Scheduler] Sistema de agendamento inicializado!');

// Agenda para rodar todo dia às 8:00 AM (horário de São Paulo)
cron.schedule('0 8 * * *', async () => {
  console.log('🔄 [Scheduler] Executando rotina automática às 8:00 AM...');
  
  try {
    const resultado = await runUnidasRoutine();
    
    if (resultado.sucesso) {
      console.log(`✅ [Scheduler] Rotina automática concluída! ${resultado.total} veículos processados em ${resultado.duracao}s.`);
    } else {
      console.error(`❌ [Scheduler] Rotina automática falhou: ${resultado.erro}`);
    }
  } catch (error) {
    console.error(`❌ [Scheduler] Erro crítico na rotina automática:`, error.message);
  }
}, {
  timezone: "America/Sao_Paulo" // Fuso horário de São Paulo
});

// Função para executar rotina manualmente (usado pelo endpoint)
export async function executarRotinaManual() {
  console.log('🔄 [Scheduler] Executando rotina manual...');
  
  try {
    const resultado = await runUnidasRoutine();
    
    if (resultado.sucesso) {
      console.log(`✅ [Scheduler] Rotina manual concluída! ${resultado.total} veículos processados em ${resultado.duracao}s.`);
    } else {
      console.error(`❌ [Scheduler] Rotina manual falhou: ${resultado.erro}`);
    }
    
    return resultado;
  } catch (error) {
    console.error(`❌ [Scheduler] Erro crítico na rotina manual:`, error.message);
    return {
      sucesso: false,
      erro: error.message,
      duracao: 0
    };
  }
}

// Informações sobre o próximo agendamento
export function getProximaExecucao() {
  const agora = new Date();
  const proxima = new Date();
  proxima.setHours(8, 0, 0, 0);
  
  // Se já passou das 8h hoje, agenda para amanhã
  if (agora.getHours() >= 8 || (agora.getHours() === 8 && agora.getMinutes() > 0)) {
    proxima.setDate(proxima.getDate() + 1);
  }
  
  return {
    proximaExecucao: proxima.toISOString(),
    proximaExecucaoFormatada: proxima.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo' 
    })
  };
}

console.log('⏰ [Scheduler] Rotina agendada para executar todo dia às 8:00 AM (horário de São Paulo)');
console.log('📋 [Scheduler] Próxima execução:', getProximaExecucao().proximaExecucaoFormatada);