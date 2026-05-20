import proxyApi from "./proxyApi";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PollExecution {
  _id: string;
  startedAt: string;
  finishedAt?: string;
  trigger: "cron" | "manual";
  status: "running" | "completed" | "failed";
  stage?: string;
  message?: string;
  totalScanned: number;
  totalPolled: number;
  totalSkipped: number;
  totalNewMaintenance: number;
  totalRecovered: number;
  totalIgnored?: number;
  totalErrors: number;
  tokenRefreshCount: number;
  pagesProcessed: number;
}

export type PollVehicleStatus = "pending" | "recovered" | "maintenance" | "ignored";

export interface PollStatus {
  isRunning: boolean;
  stopRequested?: boolean;
  currentExecutionId?: string;
  lastExecution: PollExecution | null;
}

export interface PollVehicle {
  _id: string;
  vehicleId: string;
  vin: string;
  description: string;
  status: PollVehicleStatus;
  totalAttempts: number;
  lastPollDate?: string;
  lastSeenOffline?: string;
  flaggedAt?: string;
  ignoredAt?: string;
  ignoredReason?: string;
  lastMaintenanceRevalidatedAt?: string;
  attempts: {
    date: string;
    executionId: string;
    result: string;
  }[];
}

export interface PollHistoryResponse {
  count: number;
  page: number;
  totalPages: number;
  items: PollVehicle[];
}

export interface MaintenanceResponse {
  count: number;
  items: PollVehicle[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface MaintenanceRevalidateResult {
  dryRun: boolean;
  limit: number;
  checked: number;
  ignored: number;
  stillMaintenance: number;
  notFoundOrError: number;
  sampleIgnored: PollVehicle[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const pollService = {
  /** GET /poll/status */
  getStatus: (): Promise<PollStatus> =>
    proxyApi.get("/poll/status").then((r) => r.data),

  /** GET /poll/executions */
  getExecutions: (): Promise<PollExecution[]> =>
    proxyApi.get("/poll/executions").then((r) => r.data),

  /** GET /poll/history */
  getHistory: (
    params: { status?: string; page?: number; limit?: number } = {}
  ): Promise<PollHistoryResponse> =>
    proxyApi.get("/poll/history", { params }).then((r) => r.data),

  /** GET /poll/history/maintenance */
  getMaintenance: (
    params: { page?: number; limit?: number } = {}
  ): Promise<MaintenanceResponse> =>
    proxyApi.get("/poll/history/maintenance", { params }).then((r) => r.data),

  /** POST /poll/history/maintenance/revalidate */
  revalidateMaintenance: (
    params: { limit?: number; dryRun?: boolean } = {}
  ): Promise<MaintenanceRevalidateResult> =>
    proxyApi
      .post("/poll/history/maintenance/revalidate", null, { params })
      .then((r) => r.data),

  /** POST /poll/run */
  run: (): Promise<{ message: string; status: string }> =>
    proxyApi.post("/poll/run").then((r) => r.data),

  /** POST /poll/reset/:vehicleId */
  reset: (vehicleId: string): Promise<{ message: string }> =>
    proxyApi.post(`/poll/reset/${vehicleId}`).then((r) => r.data),

  /** POST /poll/stop */
  stop: (): Promise<{ message: string }> =>
    proxyApi.post("/poll/stop").then((r) => r.data),

  /** GET /poll/export */
  exportReport: (
    status?: string,
    onDownloadProgress?: (progressEvent: any) => void
  ): Promise<Blob> =>
    proxyApi.get("/poll/export", { 
      params: { status }, 
      responseType: "blob",
      onDownloadProgress
    }).then((r) => r.data),
};
