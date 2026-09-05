import { createServer } from 'vite';

process.on('uncaughtException', (err) => console.error('UNCAUGHT:', err));
process.on('unhandledRejection', (err) => console.error('REJECTION:', err));
process.on('exit', (code) => console.error('EXIT_CODE:', code));

const server = await createServer({
  server: { port: 5173, strictPort: true }
});
await server.listen();
console.log('VITE_READY_STABLE on', server.config.server.port);

setInterval(() => {}, 100000);
