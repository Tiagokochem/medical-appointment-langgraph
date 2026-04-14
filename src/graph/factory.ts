import { config, databaseFile } from '../config.ts';
import { openClinicDatabase } from '../persistence/clinicDatabase.ts';
import { AppointmentService } from '../services/appointmentService.ts';
import { OpenRouterService } from '../services/openRouterService.ts';
import { buildAppointmentGraph } from './graph.ts';

type AgentServices = {
  graph: ReturnType<typeof buildAppointmentGraph>;
  appointmentService: AppointmentService;
};

let cached: AgentServices | null = null;

export function getAgentServices(): AgentServices {
  if (!cached) {
    const llmClient = new OpenRouterService(config);
    const db = openClinicDatabase(databaseFile);
    const appointmentService = new AppointmentService(db);
    const graph = buildAppointmentGraph(llmClient, appointmentService);
    cached = { graph, appointmentService };
  }
  return cached;
}

export function buildGraph() {
  return getAgentServices().graph;
}

export const graph = async () => {
  return buildGraph();
};
