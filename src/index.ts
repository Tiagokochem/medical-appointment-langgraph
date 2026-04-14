import { createServer } from './server.ts';

const app = createServer();

await app.listen({ port: 3000, host: '0.0.0.0' });
console.log(`Server is running on http://0.0.0.0:3000`);

// curl -s http://localhost:3000/health
// curl -s http://localhost:3000/v1/clinicians
// curl -s -X POST -H 'Content-Type: application/json' \
//   --data '{"text":"Olá, sou Maria Santos e quero agendar..."}' \
//   http://localhost:3000/v1/assistant/message
