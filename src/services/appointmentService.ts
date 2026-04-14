import type { DatabaseSync } from 'node:sqlite';

import type { ClinicianRow } from '../persistence/clinicDatabase.ts';

export type { ClinicianRow };

type AppointmentRow = {
  id: number;
  professionalId: number;
  patientName: string;
  reason: string;
  date: string;
};

export class AppointmentService {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  getClinicians(): ClinicianRow[] {
    return this.db
      .prepare('SELECT id, name, specialty FROM clinicians ORDER BY id')
      .all() as ClinicianRow[];
  }

  getAppointmentsForProfessional(
    professionalId: number,
    date: Date,
    patientName?: string,
  ): AppointmentRow | undefined {
    const iso = date.toISOString();
    if (patientName !== undefined) {
      return this.db
        .prepare(
          `SELECT id,
                  clinician_id AS professionalId,
                  patient_name AS patientName,
                  reason,
                  starts_at AS date
           FROM appointments
           WHERE clinician_id = ? AND starts_at = ? AND patient_name = ?`,
        )
        .get(professionalId, iso, patientName) as AppointmentRow | undefined;
    }

    return this.db
      .prepare(
        `SELECT id,
                clinician_id AS professionalId,
                patient_name AS patientName,
                reason,
                starts_at AS date
         FROM appointments
         WHERE clinician_id = ? AND starts_at = ?`,
      )
      .get(professionalId, iso) as AppointmentRow | undefined;
  }

  checkAvailability(professionalId: number, date: Date): boolean {
    const iso = date.toISOString();
    const row = this.db
      .prepare(
        `SELECT id FROM appointments WHERE clinician_id = ? AND starts_at = ? LIMIT 1`,
      )
      .get(professionalId, iso);
    return row === undefined;
  }

  bookAppointment(
    professionalId: number,
    date: Date,
    patientName: string,
    reason: string,
  ): AppointmentRow {
    if (!this.checkAvailability(professionalId, date)) {
      throw new Error('Horário indisponível para este profissional');
    }

    const row = this.db
      .prepare(
        `INSERT INTO appointments (clinician_id, patient_name, reason, starts_at)
         VALUES (?, ?, ?, ?)
         RETURNING id,
                   clinician_id AS professionalId,
                   patient_name AS patientName,
                   reason,
                   starts_at AS date`,
      )
      .get(professionalId, patientName, reason, date.toISOString()) as AppointmentRow;

    return row;
  }

  cancelAppointment(professionalId: number, patientName: string, date: Date) {
    const booked = this.getAppointmentsForProfessional(professionalId, date, patientName);
    if (!booked) {
      throw new Error('Agendamento não encontrado para cancelamento');
    }

    this.db.prepare('DELETE FROM appointments WHERE id = ?').run(booked.id);
  }
}
