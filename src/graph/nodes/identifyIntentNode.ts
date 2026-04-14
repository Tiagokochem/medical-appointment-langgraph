import { getSystemPrompt, getUserPromptTemplate, IntentSchema } from '../../prompts/v1/identifyIntent.ts';
import type { AppointmentService } from '../../services/appointmentService.ts';
import { OpenRouterService } from '../../services/openRouterService.ts';
import type { GraphState } from '../graph.ts';

export function createIdentifyIntentNode(
  llmClient: OpenRouterService,
  appointmentService: AppointmentService,
) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    console.log(`🔍 Identifying intent...`);
    const lastMessage = state.messages.at(-1)!;
    const rawContent = lastMessage.content;
    const input =
      typeof rawContent === 'string'
        ? rawContent
        : Array.isArray(rawContent)
          ? rawContent.map((c) => (typeof c === 'string' ? c : JSON.stringify(c))).join('\n')
          : String(rawContent);

    try {
      const clinicians = appointmentService.getClinicians();
      const systemPrompt = getSystemPrompt(clinicians);
      const userPrompt = getUserPromptTemplate(input)
      const result = await llmClient.generateStructured(
        systemPrompt,
        userPrompt,
        IntentSchema,
      )
      if(!result.success){
        console.log(`⚠️  Intent identification failed: ${result.error}`);
        return {
          intent: 'unknown',
          error: result.error
        }
      }

      const intentData = result.data!
      console.log(`✅ Intent identified: ${intentData.intent}`);

      return {
        ...intentData,
      };

    } catch (error) {
      console.error('❌ Error in identifyIntent node:', error);
      return {
        ...state,
        intent: 'unknown',
        error: error instanceof Error ? error.message : 'Intent identification failed',
      };
    }
  };
}
