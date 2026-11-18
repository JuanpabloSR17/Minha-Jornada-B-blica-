import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const [output, pgliteDist] = process.argv.slice(2);
if (!output || !pgliteDist) {
  throw new Error('Uso: node demo/prepare.mjs <export web do Expo> <pasta dist do pacote @electric-sql/pglite@0.5.16>');
}
const destination = resolve(output, 'demo');
const library = join(destination, 'pglite');
await readFile(resolve(output, 'index.html'));
await mkdir(join(library, 'worker'), { recursive: true });
for (const name of await readdir(pgliteDist)) {
  if (/\.(js|wasm|data)$/.test(name)) await copyFile(join(pgliteDist, name), join(library, name));
}
await copyFile(join(pgliteDist, 'worker', 'index.js'), join(library, 'worker', 'index.js'));
await copyFile(join(pgliteDist, '..', 'LICENSE'), join(library, 'LICENSE'));
await copyFile('demo/adapter.mjs', join(destination, 'adapter.mjs'));
await copyFile('demo/database.mjs', join(destination, 'database.mjs'));

const migrations = (await readdir('supabase/migrations')).filter((file) => file.endsWith('.sql')).sort();
const files = ['supabase/tests/00_supabase_shim.sql', ...migrations.map((name) => join('supabase/migrations', name))];
await writeFile(join(destination, 'migration.sql'), (await Promise.all(files.map((name) => readFile(name, 'utf8')))).join('\n'));
await writeFile(join(destination, 'config.json'), JSON.stringify({ environment: 'demo', persistence: 'indexed-db' }));

await mkdir(resolve(output, 'brand'), { recursive: true });
await copyFile('assets/brand/icon.png', resolve(output, 'brand/icon.png'));
await writeFile(resolve(output, 'manifest.webmanifest'), JSON.stringify({
  name: 'Jornada Bíblica', short_name: 'Jornada Bíblica', lang: 'pt-BR',
  start_url: '/', display: 'standalone', background_color: '#151225', theme_color: '#151225',
  description: 'Demonstração da Jornada Bíblica.',
  icons: [{ src: '/brand/icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' }],
}));
const index = resolve(output, 'index.html');
const html = await readFile(index, 'utf8');
if (!html.includes('href="/manifest.webmanifest"')) {
  await writeFile(index, html.replace('</head>', '  <link rel="manifest" href="/manifest.webmanifest" />\n  <link rel="apple-touch-icon" href="/brand/icon.png" />\n  <meta name="theme-color" content="#151225" />\n</head>'));
}
