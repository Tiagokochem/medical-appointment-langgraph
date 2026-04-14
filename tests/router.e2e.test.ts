import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.ts';

const app = createServer();

async function fetchClinicians() {
  const res = await app.inject({
    method: 'GET',
    url: '/v1/clinicians',
  });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body) as { ok: boolean; data: { id: number; name: string; specialty: string }[] };
  return body.data;
}

async function sendMessage(text: string) {
  return await app.inject({
    method: 'POST',
    url: '/v1/assistant/message',
    payload: {
      text,
    },
  });
}

describe('Medical Appointment System - E2E Tests', async () => {
  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body) as { ok: boolean; service: string };
    assert.equal(body.ok, true);
    assert.equal(body.service, 'medical-appointment-assistant');
  });

  it.skip('Schedule appointment - Success', async () => {
    const clinicians = await fetchClinicians();
    const response = await sendMessage(
      `Olá, sou Maria Santos e quero agendar uma consulta com ${clinicians[0]?.name} para amanhã às 16h para um check-up regular`,
    );

    console.log('Schedule Success Response:', response.body);

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.body) as { ok: boolean; data: { intent?: string; actionSuccess?: boolean } };
    assert.equal(body.data.intent, 'schedule');
    assert.equal(body.data.actionSuccess, true);
  });

  it('Cancel appointment - Success', async () => {
    const clinicians = await fetchClinicians();

    await sendMessage(
      `Sou Joao da Silva e quero agendar uma consulta com ${clinicians[1]?.name} para hoje às 14h`,
    );

    const response = await sendMessage(
      `Cancele minha consulta com ${clinicians[1]?.name} que tenho hoje às 14h, me chamo Joao da Silva`,
    );

    console.log('Cancel Success Response:', response.body);

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.body) as { ok: boolean; data: { intent?: string; actionSuccess?: boolean } };
    assert.equal(body.data.intent, 'cancel');
    assert.equal(body.data.actionSuccess, true);
  });
});
