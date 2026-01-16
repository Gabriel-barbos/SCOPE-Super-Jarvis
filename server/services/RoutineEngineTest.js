import ExcelReader from './ExcelReader.js';
import Routine from '../models/Routine.js';

class RoutineEngineTest {
  static async execute({ filePath }) {
    const columnsConfig = {
      chassi: 'Chassi',
      cliente: 'Cliente',
      grupo: 'Concessionária/Grupo de veiculos',
    };

    /* =======================
       1. Lê a planilha
    ======================= */
    const excelRows = ExcelReader.read(filePath, columnsConfig);

    if (!excelRows.length) {
      return {
        summary: { totalExcelRows: 0 },
        routines: [],
        errors: [{ reason: 'Nenhuma linha válida encontrada na planilha' }],
      };
    }

    /* =======================
       2. Busca rotinas
    ======================= */
    const routines = await Routine.find().populate('client');

    const routineMap = new Map();

    routines.forEach((routine) => {
      const key = routine.clientIdentificator?.trim().toLowerCase();
      if (!key) return;

      if (!routineMap.has(key)) routineMap.set(key, []);
      routineMap.get(key).push(routine);
    });

    /* =======================
       3. Matching + erros
    ======================= */
    const routinesToProcess = new Map();
    const errorReport = [];

    excelRows.forEach((row) => {
      let matched = false;

      if (!row.chassi || !row.cliente) {
        errorReport.push({
          line: row.line,
          chassi: row.chassi,
          cliente: row.cliente,
          reason: 'Linha incompleta (chassi ou cliente ausente)',
        });
        return;
      }

      const possibleRoutines = routineMap.get(row.cliente);

      if (!possibleRoutines) {
        errorReport.push({
          line: row.line,
          chassi: row.chassi,
          cliente: row.cliente,
          reason: 'Cliente não possui rotina cadastrada',
        });
        return;
      }

      possibleRoutines.forEach((routine) => {
        if (routine.groupIdentificator?.trim()) {
          if (!row.grupo) return;

          const groupMatch =
            routine.groupIdentificator.trim().toLowerCase() === row.grupo;

          if (!groupMatch) return;
        }

        matched = true;

        if (!routinesToProcess.has(routine._id.toString())) {
          routinesToProcess.set(routine._id.toString(), {
            routine,
            vehicles: [],
          });
        }

        routinesToProcess
          .get(routine._id.toString())
          .vehicles.push(row.chassi);
      });

      if (!matched) {
        errorReport.push({
          line: row.line,
          chassi: row.chassi,
          cliente: row.cliente,
          grupo: row.grupo,
          reason: 'Cliente possui rotina, mas grupo não corresponde',
        });
      }
    });

    /* =======================
       4. SIMULAÇÃO DAS ROTINAS
       (sem token / sem API)
    ======================= */
    const executionResults = [];

    for (const { routine, vehicles } of routinesToProcess.values()) {
      const routineReport = {
        routineId: routine._id,
        routineName: routine.name,
        client: routine.client.name,
        executedActions: {},
        mode: 'TEST',
      };

      // ➕ Simula Add to Group
      if (routine.addVehicleToGroup) {
        routineReport.executedActions.addVehicleToGroup = {
          simulated: true,
          vehicleGroupId: routine.vehicleGroup,
          vehicles,
          totalVehicles: vehicles.length,
        };
      }

      // 🔁 Simula Share
      if (routine.shareVehicle) {
        routineReport.executedActions.shareVehicle = {
          simulated: true,
          shareGroupId: routine.shareGroup,
          vehicles,
          totalVehicles: vehicles.length,
        };
      }

      executionResults.push(routineReport);
    }

    /* =======================
       5. RELATÓRIO FINAL
    ======================= */
    return {
      summary: {
        totalExcelRows: excelRows.length,
        matchedRoutines: executionResults.length,
        errorCount: errorReport.length,
        mode: 'TEST',
      },
      routines: executionResults,
      errors: errorReport,
    };
  }
}

export default RoutineEngineTest;