import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

// Servir archivos estáticos del build (dist)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback SPA
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[BH Chat] Servidor ejecutándose en http://0.0.0.0:${port}`);
});
