import { HumanMessage } from 'langchain';
import { getAgentServices } from './graph/factory.ts';

import Fastify from 'fastify';

const { graph, appointmentService } = getAgentServices();

const startedAt = Date.now();

export const createServer = () => {
  const app = Fastify();

  app.get('/health', async () => ({
    ok: true,
    service: 'medical-appointment-assistant',
    uptimeMs: Date.now() - startedAt,
  }));

  app.get('/v1/clinicians', async () => ({
    ok: true,
    data: appointmentService.getClinicians(),
  }));

  app.post(
    '/v1/assistant/message',
    {
      schema: {
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', minLength: 10 },
          },
        },
      },
    },
    async function (request, reply) {
      try {
        const { text } = request.body as { text: string };

        const result = await graph.invoke({
          messages: [new HumanMessage(text)],
        });

        return {
          ok: true,
          data: result,
        };
      } catch (error) {
        console.error('❌ Error processing request:', error);
        return reply.status(500).send({
          ok: false,
          error: 'An error occurred while processing your request.',
        });
      }
    },
  );

  return app;
};
