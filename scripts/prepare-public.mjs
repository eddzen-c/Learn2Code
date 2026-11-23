import { cp, mkdir } from 'node:fs/promises';

await mkdir('site-public', { recursive: true });
await cp('public-docs/Learn2Code_Documentacion.pdf', 'site-public/Learn2Code_Documentacion.pdf');
await cp(
  'frontend/public/images/Learn2Code_Dragones_Responsive/03-Isotipo-oficial/PNG/isotipo-oficial-512.png',
  'site-public/logo.png',
);
console.log('Public documentation assets prepared.');
