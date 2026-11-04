import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

// Servir archivos estáticos del build (dist)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback SPA: responde 404 si la ruta tiene extensión (archivo faltante), o sirve index.html si no tiene extensión
app.use((req, res) => {
  const ext = path.extname(req.path);
  if (ext) {
    return res.status(404).send('Not Found');
  }

  const distIndex = path.join(distPath, 'index.html');
  const targetIndex = fs.existsSync(distIndex) ? distIndex : path.join(__dirname, 'index.html');
  res.sendFile(targetIndex);
});

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`[BH Chat] Servidor ejecutándose en http://0.0.0.0:${port}`);
  });
}
