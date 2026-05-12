/**
 * Test Script — Auto Poll 72h
 * 
 * Valida:
 * 1. TokenManager (obter + cache de token)
 * 2. Query OData com $filter para veículos 72h+ offline
 * 3. Filtro de veículos desativados
 * 4. Paginação
 * 
 * Executar: node server/tests/test-poll-query.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

import TokenManager from '../services/TokenManager.js';

const API_URL = process.env.API_URL || 'https://live.mzoneweb.net/mzone62.api';

// Credenciais BR Main
const CREDENTIALS = {
  login: 'brazil-support@scopetechnology.com',
  password: 'Scope@br2021',
};

// ============================================================
// FILTRO DE VEÍCULOS DESATIVADOS
// ============================================================

function isVehicleDeactivated(vehicle) {
  const desc = (vehicle.description || '').toUpperCase().trim();
  const unitDesc = (vehicle.unit_Description || '').trim();

  // Descrição começa com palavras-chave de desativação
  if (desc.startsWith('REMOVIDO')) return 'REMOVIDO na description';
  if (desc.startsWith('CANCELADO V')) return 'CANCELADO V na description';
  if (desc.startsWith('DESATIVADO')) return 'DESATIVADO na description';

  // unit_Description contém _ (unidade desassociada)
  if (unitDesc.includes('_')) return 'unit_Description desassociada';

  return false;
}

// ============================================================
// FETCH COM TOKEN
// ============================================================

async function apiFetch(tokenManager, path) {
  const token = await tokenManager.getToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  return res.json();
}

// ============================================================
// TESTE 1: Token Manager
// ============================================================

async function testTokenManager() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE 1: TokenManager');
  console.log('='.repeat(60));

  const tm = new TokenManager(CREDENTIALS);

  // Primeira chamada — deve gerar token
  const token1 = await tm.getToken();
  console.log(`✅ Token obtido: ${token1.substring(0, 50)}...`);
  console.log(`   Stats:`, tm.getStats());

  // Segunda chamada — deve usar cache
  const token2 = await tm.getToken();
  console.log(`✅ Token cacheado: ${token1 === token2 ? 'SIM (mesmo token)' : 'NÃO (token diferente)'}`);

  return tm;
}

// ============================================================
// TESTE 2: Query de veículos offline 72h+ (primeira página)
// ============================================================

async function testOfflineQuery(tokenManager) {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE 2: Query OData — Veículos 72h+ offline');
  console.log('='.repeat(60));

  const cutoffDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  console.log(`   Cutoff: ${cutoffDate}`);

  // Primeiro: testar com $count para saber o total
  const countPath = `/Vehicles?$filter=lastKnownEventUtcTimestamp lt ${cutoffDate}`
    + `&$select=id`
    + `&$top=1&$count=true`;

  console.log(`   Query (count): ${countPath}`);

  try {
    const countData = await apiFetch(tokenManager, countPath);
    const totalOffline = countData['@odata.count'] || countData['odata.count'] || 'N/A';
    console.log(`✅ Total de veículos offline 72h+: ${totalOffline}`);
  } catch (err) {
    console.log(`⚠️  $count pode não ser suportado: ${err.message}`);
    console.log(`   Vamos tentar sem $count...`);
  }

  // Buscar primeira página com dados completos
  const dataPath = `/Vehicles?$filter=lastKnownEventUtcTimestamp lt ${cutoffDate}`
    + `&$select=id,description,vin,unit_Description,lastKnownEventUtcTimestamp`
    + `&$top=100`;  // Só 100 para teste

  console.log(`\n   Query (dados): $top=100`);

  const data = await apiFetch(tokenManager, dataPath);
  const vehicles = data.value || [];

  console.log(`✅ Veículos retornados: ${vehicles.length}`);

  if (vehicles.length > 0) {
    console.log(`\n   Exemplo (primeiro veículo):`);
    const sample = vehicles[0];
    console.log(`   - ID: ${sample.id}`);
    console.log(`   - Desc: ${sample.description}`);
    console.log(`   - VIN: ${sample.vin}`);
    console.log(`   - Unit: ${sample.unit_Description}`);
    console.log(`   - Último report: ${sample.lastKnownEventUtcTimestamp}`);
  }

  return vehicles;
}

// ============================================================
// TESTE 3: Filtro de desativados
// ============================================================

function testDeactivatedFilter(vehicles) {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE 3: Filtro de veículos desativados');
  console.log('='.repeat(60));

  let activeCount = 0;
  let deactivatedCount = 0;
  const deactivatedReasons = {};

  for (const v of vehicles) {
    const reason = isVehicleDeactivated(v);
    if (reason) {
      deactivatedCount++;
      deactivatedReasons[reason] = (deactivatedReasons[reason] || 0) + 1;
    } else {
      activeCount++;
    }
  }

  console.log(`   Total analisados: ${vehicles.length}`);
  console.log(`   ✅ Ativos (enviar poll): ${activeCount}`);
  console.log(`   ❌ Desativados (ignorar): ${deactivatedCount}`);

  if (Object.keys(deactivatedReasons).length > 0) {
    console.log(`\n   Motivos de desativação:`);
    for (const [reason, count] of Object.entries(deactivatedReasons)) {
      console.log(`   - ${reason}: ${count}`);
    }
  }

  // Mostrar exemplos de desativados
  const deactivatedExamples = vehicles.filter(v => isVehicleDeactivated(v)).slice(0, 3);
  if (deactivatedExamples.length > 0) {
    console.log(`\n   Exemplos de desativados:`);
    for (const v of deactivatedExamples) {
      console.log(`   - [${isVehicleDeactivated(v)}] ${v.description} | unit: ${v.unit_Description}`);
    }
  }

  // Mostrar exemplos de ativos
  const activeExamples = vehicles.filter(v => !isVehicleDeactivated(v)).slice(0, 3);
  if (activeExamples.length > 0) {
    console.log(`\n   Exemplos de ativos (receberiam poll):`);
    for (const v of activeExamples) {
      console.log(`   - ${v.description} | unit: ${v.unit_Description} | last: ${v.lastKnownEventUtcTimestamp}`);
    }
  }
}

// ============================================================
// TESTE 4: Paginação — verificar se funciona com $skip
// ============================================================

async function testPagination(tokenManager) {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE 4: Paginação ($top + $skip)');
  console.log('='.repeat(60));

  const cutoffDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  // Página 1: $top=5, $skip=0
  const page1Path = `/Vehicles?$filter=lastKnownEventUtcTimestamp lt ${cutoffDate}`
    + `&$select=id,vin`
    + `&$top=5&$skip=0`;

  const page1 = await apiFetch(tokenManager, page1Path);
  const page1Vehicles = page1.value || [];

  // Página 2: $top=5, $skip=5
  const page2Path = `/Vehicles?$filter=lastKnownEventUtcTimestamp lt ${cutoffDate}`
    + `&$select=id,vin`
    + `&$top=5&$skip=5`;

  const page2 = await apiFetch(tokenManager, page2Path);
  const page2Vehicles = page2.value || [];

  console.log(`   Página 1 (5 veículos): ${page1Vehicles.map(v => v.vin || v.id).join(', ')}`);
  console.log(`   Página 2 (5 veículos): ${page2Vehicles.map(v => v.vin || v.id).join(', ')}`);

  // Verificar que não há overlap
  const page1Ids = new Set(page1Vehicles.map(v => v.id));
  const overlap = page2Vehicles.filter(v => page1Ids.has(v.id));

  if (overlap.length === 0) {
    console.log(`   ✅ Paginação OK — sem overlap entre páginas`);
  } else {
    console.log(`   ⚠️ Overlap detectado: ${overlap.length} veículos repetidos`);
  }
}

// ============================================================
// TESTE 5: Volume real com 10k
// ============================================================

async function testRealVolume(tokenManager) {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE 5: Volume real — primeira página de 10k');
  console.log('='.repeat(60));

  const cutoffDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const path = `/Vehicles?$filter=lastKnownEventUtcTimestamp lt ${cutoffDate}`
    + `&$select=id,description,vin,unit_Description,lastKnownEventUtcTimestamp`
    + `&$top=10000&$skip=0`;

  console.log(`   Buscando primeira página de 10k...`);
  const start = Date.now();

  const data = await apiFetch(tokenManager, path);
  const vehicles = data.value || [];

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`   ⏱️ Tempo de resposta: ${elapsed}s`);
  console.log(`   📊 Veículos retornados: ${vehicles.length}`);

  // Filtrar desativados
  const active = vehicles.filter(v => !isVehicleDeactivated(v));
  const deactivated = vehicles.length - active.length;

  console.log(`   ✅ Ativos (enviar poll): ${active.length}`);
  console.log(`   ❌ Desativados (ignorar): ${deactivated}`);
  console.log(`   📈 Taxa de ativos: ${((active.length / vehicles.length) * 100).toFixed(1)}%`);

  if (vehicles.length === 10000) {
    console.log(`\n   ⚠️ Página cheia! Há mais veículos — paginação necessária.`);
  } else {
    console.log(`\n   ✅ Todos os veículos offline cabem em 1 página.`);
  }

  return { total: vehicles.length, active: active.length, deactivated };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🚀 Auto Poll 72h — Script de Teste');
  console.log('📅 Data atual:', new Date().toISOString());
  console.log('📅 Cutoff (72h):', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString());

  try {
    // Teste 1: Token
    const tokenManager = await testTokenManager();

    // Teste 2: Query offline
    const vehicles = await testOfflineQuery(tokenManager);

    // Teste 3: Filtro desativados
    if (vehicles.length > 0) {
      testDeactivatedFilter(vehicles);
    }

    // Teste 4: Paginação
    await testPagination(tokenManager);

    // Teste 5: Volume real
    await testRealVolume(tokenManager);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TODOS OS TESTES CONCLUÍDOS');
    console.log('='.repeat(60));
    console.log(`\n   Token stats:`, tokenManager.getStats());

  } catch (err) {
    console.error('\n❌ ERRO FATAL:', err.message);
    console.error(err.stack);
  }
}

main();
