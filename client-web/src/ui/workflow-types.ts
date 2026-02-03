// Workflow types for Client Web
// Matches Admin UI's Cron types for full compatibility

export type ScheduleKind = "every" | "at" | "cron";
export type EveryUnit = "minutes" | "hours" | "days";
export type SessionTarget = "main" | "isolated";
export type WakeMode = "next-heartbeat" | "now";
export type PayloadKind = "systemEvent" | "agentTurn";

export type WorkflowSchedule = {
  kind: ScheduleKind;
  // For "every" - repeat interval
  everyAmount?: number;
  everyUnit?: EveryUnit;
  // For "at" - one-time run
  atDatetime?: string; // ISO datetime string
  // For "cron" - cron expression
  cronExpr?: string;
  cronTz?: string;
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  schedule: WorkflowSchedule;
  prompt: string;
  notifyMe: boolean;
  enabled: boolean;
  sessionTarget?: SessionTarget;
  wakeMode?: WakeMode;
  payloadKind?: PayloadKind;
  timeout?: number;
  lastRunAt?: number;
  lastRunStatus?: "success" | "error" | "running";
  nextRunAt?: number;
};

export type WorkflowFormState = {
  name: string;
  description: string;
  enabled: boolean;
  // Schedule
  scheduleKind: ScheduleKind;
  everyAmount: number;
  everyUnit: EveryUnit;
  atDatetime: string;
  cronExpr: string;
  cronTz: string;
  // Execution
  sessionTarget: SessionTarget;
  wakeMode: WakeMode;
  payloadKind: PayloadKind;
  timeout: number;
  postToMainPrefix: string;
  // Task
  prompt: string;
  notifyMe: boolean;
};

export const DEFAULT_WORKFLOW_FORM: WorkflowFormState = {
  name: "",
  description: "",
  enabled: true,
  scheduleKind: "every",
  everyAmount: 1,
  everyUnit: "days",
  atDatetime: "",
  cronExpr: "0 9 * * *",
  cronTz: "",
  sessionTarget: "main",
  wakeMode: "now",
  payloadKind: "agentTurn",
  timeout: 300,
  postToMainPrefix: "",
  prompt: "",
  notifyMe: false,
};

// Convert form state to Cron API format
export function formToCronPayload(form: WorkflowFormState) {
  let schedule: { kind: string; everyMs?: number; atMs?: number; expr?: string; tz?: string };

  if (form.scheduleKind === "every") {
    let everyMs = form.everyAmount;
    switch (form.everyUnit) {
      case "minutes":
        everyMs *= 60 * 1000;
        break;
      case "hours":
        everyMs *= 60 * 60 * 1000;
        break;
      case "days":
        everyMs *= 24 * 60 * 60 * 1000;
        break;
    }
    schedule = { kind: "every", everyMs };
  } else if (form.scheduleKind === "at") {
    const atMs = form.atDatetime ? new Date(form.atDatetime).getTime() : Date.now();
    schedule = { kind: "at", atMs };
  } else {
    schedule = { kind: "cron", expr: form.cronExpr };
    if (form.cronTz) schedule.tz = form.cronTz;
  }

  // Build payload based on payloadKind
  const payload: Record<string, unknown> = { kind: form.payloadKind };
  if (form.payloadKind === "agentTurn") {
    payload.message = form.prompt.trim();
    payload.deliver = form.notifyMe;
  } else {
    // systemEvent
    payload.event = form.prompt.trim();
  }

  const result: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    enabled: form.enabled,
    schedule,
    sessionTarget: form.sessionTarget,
    wakeMode: form.wakeMode,
    payload,
  };

  // Add timeout if set
  if (form.timeout > 0) {
    result.timeoutSec = form.timeout;
  }

  // Add postToMainPrefix for isolated sessions
  if (form.sessionTarget === "isolated" && form.postToMainPrefix.trim()) {
    result.postToMainPrefix = form.postToMainPrefix.trim();
  }

  return result;
}

// Format schedule for display
export function formatSchedule(schedule: WorkflowSchedule): string {
  if (!schedule) return "No schedule";

  switch (schedule.kind) {
    case "every": {
      const amount = schedule.everyAmount ?? 1;
      const unit = schedule.everyUnit ?? "days";
      const unitLabel = amount === 1 ? unit.slice(0, -1) : unit;
      return `Every ${amount} ${unitLabel}`;
    }
    case "at": {
      if (!schedule.atDatetime) return "One-time run";
      const date = new Date(schedule.atDatetime);
      return `At ${date.toLocaleString()}`;
    }
    case "cron": {
      return schedule.cronExpr ? `Cron: ${schedule.cronExpr}` : "Custom schedule";
    }
    default:
      return "Unknown schedule";
  }
}

// Parse cron schedule from API to our format
export function parseCronSchedule(cronJob: {
  schedule?: { kind?: string; everyMs?: number; atMs?: number; expr?: string; tz?: string };
}): WorkflowSchedule {
  const sched = cronJob.schedule;
  if (!sched) return { kind: "every", everyAmount: 1, everyUnit: "days" };

  if (sched.kind === "every" && sched.everyMs) {
    const ms = sched.everyMs;
    if (ms >= 24 * 60 * 60 * 1000) {
      return { kind: "every", everyAmount: Math.floor(ms / (24 * 60 * 60 * 1000)), everyUnit: "days" };
    } else if (ms >= 60 * 60 * 1000) {
      return { kind: "every", everyAmount: Math.floor(ms / (60 * 60 * 1000)), everyUnit: "hours" };
    } else {
      return { kind: "every", everyAmount: Math.floor(ms / (60 * 1000)), everyUnit: "minutes" };
    }
  }

  if (sched.kind === "at" && sched.atMs) {
    return { kind: "at", atDatetime: new Date(sched.atMs).toISOString() };
  }

  if (sched.kind === "cron" && sched.expr) {
    return { kind: "cron", cronExpr: sched.expr, cronTz: sched.tz };
  }

  return { kind: "every", everyAmount: 1, everyUnit: "days" };
}
