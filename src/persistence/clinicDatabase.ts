import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type ClinicianRow = {
  id: number;
  name: string;
  specialty: string;
};

function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clinicians (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinician_id INTEGER NOT NULL,
      patient_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      FOREIGN KEY (clinician_id) REFERENCES clinicians(id)
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_clinician_starts
      ON appointments (clinician_id, starts_at);
  `);
}

function seed(db: DatabaseSync): void {
  const clinicianCount = db.prepare('SELECT COUNT(*) AS c FROM clinicians').get() as { c: number };
  if (clinicianCount.c > 0) {
    return;
  }

  const insertClinician = db.prepare(
    'INSERT INTO clinicians (id, name, specialty) VALUES (@id, @name, @specialty)',
  );

  const roster: ClinicianRow[] = [
    { id: 1, name: 'Dr. Renato Veiga', specialty: 'Ortopedia' },
    { id: 2, name: 'Dra. Helena Motta', specialty: 'Dermatologia' },
    { id: 3, name: 'Dr. Paulo Neri', specialty: 'Neurologia' },
  ];

  for (const row of roster) {
    insertClinician.run(row);
  }

  const today = new Date();
  const todayAtEleven = new Date(today);
  todayAtEleven.setUTCHours(11, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowAtTwo = new Date(tomorrow);
  tomorrowAtTwo.setUTCHours(14, 0, 0, 0);

  const insertAppt = db.prepare(
    `INSERT INTO appointments (clinician_id, patient_name, reason, starts_at)
     VALUES (@clinician_id, @patient_name, @reason, @starts_at)`,
  );

  insertAppt.run({
    clinician_id: 1,
    patient_name: 'Marina Duarte',
    reason: 'Avaliação de joelho',
    starts_at: todayAtEleven.toISOString(),
  });

  insertAppt.run({
    clinician_id: 2,
    patient_name: 'Igor Campos',
    reason: 'Lesão cutânea',
    starts_at: tomorrowAtTwo.toISOString(),
  });
}

export function openClinicDatabase(filePath: string): DatabaseSync {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(filePath);
  migrate(db);
  seed(db);
  return db;
}
