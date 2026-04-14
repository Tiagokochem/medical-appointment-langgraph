import { z } from 'zod';

export const IntentSchema = z.object({
  intent: z.enum(['schedule', 'cancel', 'unknown']).describe('The user intent'),
  professionalId: z.number().optional().describe('ID of the medical professional'),
  professionalName: z.string().optional().describe('Name of the medical professional'),
  datetime: z.string().optional().describe('Appointment date and time in ISO format'),
  patientName: z.string().optional().describe('Patient name extracted from question'),
  reason: z.string().optional().describe('Reason for appointment (for scheduling)'),
});

export type IntentData = z.infer<typeof IntentSchema>;

export const getSystemPrompt = (
  clinicians: { id: number; name: string; specialty: string }[],
) => {
  return JSON.stringify({
    role: 'Intent Classifier for Medical Appointments',
    task: 'Identify user intent and extract all appointment-related details',
    clinicians: clinicians.map((c) => ({ id: c.id, name: c.name, specialty: c.specialty })),
    current_date: new Date().toISOString(),
    rules: {
      schedule: {
        description: 'User wants to book/schedule a new appointment',
        keywords: ['schedule', 'book', 'appointment', 'I want to', 'make an appointment'],
        required_fields: ['professionalId', 'datetime', 'patientName'],
        optional_fields: ['reason']
      },
      cancel: {
        description: 'User wants to cancel an existing appointment',
        keywords: ['cancel', 'remove', 'delete', 'cancel my appointment'],
        required_fields: ['professionalId', 'datetime', 'patientName']
      },
      unknown: {
        description: 'Anything not related to scheduling or cancelling appointments',
        examples: ['weather questions', 'general info', 'unrelated queries']
      }
    },
    extraction_instructions: {
      professionalId: 'Match the clinician name mentioned in the question to the ID from the clinicians list. Use fuzzy matching.',
      professionalName: 'Extract the clinician name as mentioned by the user',
      datetime: 'Parse relative dates (today, tomorrow) and times. Convert to ISO format. Use current_date as reference.',
      patientName: 'Extract the patient name from the question or context',
      reason: 'Extract the reason/purpose for the appointment (only for scheduling)'
    },
    examples: [
      {
        input: 'Quero agendar com o Dr. Renato Veiga amanhã às 16h para avaliação de joelho',
        output: { intent: 'schedule', professionalId: 1, professionalName: 'Dr. Renato Veiga', datetime: '2026-02-12T16:00:00.000Z', reason: 'avaliação de joelho' }
      },
      {
        input: 'Cancelar minha consulta com a Dra. Helena Motta hoje às 11h',
        output: { intent: 'cancel', professionalId: 2, professionalName: 'Dra. Helena Motta', datetime: '2026-02-11T11:00:00.000Z' }
      },
      {
        input: 'What is the weather today?',
        output: { intent: 'unknown' }
      }
    ]
  });
};

export const getUserPromptTemplate = (question: string) => {
  return JSON.stringify({
    question,
    instructions: [
      'Carefully analyze the question to determine the user intent',
      'Extract all relevant appointment details',
      'Convert dates and times to ISO format',
      'Match professional names to their IDs',
      'Return only the fields that are present in the question'
    ]
  });
};
