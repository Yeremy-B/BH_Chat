export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function cleanSpeechChunk(text) {
  return (text || '').trim().replace(/[ \t]+/g, ' ');
}

// Elimina palabras adyacentes repetidas por tartamudeo o duplicación del sintetizador móvil
// Conserva duplicaciones válidas naturales en español (ej. "muy muy", "sí sí", "ya ya")
export function deduplicateAdjacentWords(str) {
  if (!str) return '';
  const words = str.split(/\s+/);
  if (words.length <= 1) return str;

  const allowedDoubles = new Set(['muy', 'si', 'sí', 'ya', 'no', 'casi', 'tan', 'bien']);
  const cleaned = [];

  for (let i = 0; i < words.length; i++) {
    const curr = words[i];
    if (!curr) continue;
    const prev = cleaned.length > 0 ? cleaned[cleaned.length - 1] : null;

    if (prev) {
      const currNorm = curr.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      const prevNorm = prev.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

      if (currNorm && currNorm === prevNorm) {
        // Si es una 3ra repetición consecutiva idéntica, omitir
        const prevPrev = cleaned.length > 1 ? cleaned[cleaned.length - 2] : null;
        const prevPrevNorm = prevPrev ? prevPrev.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') : null;
        if (prevPrevNorm === currNorm) {
          continue;
        }

        // Si es una 2da repetición consecutiva y no pertenece al conjunto permitido, omitir
        if (!allowedDoubles.has(currNorm)) {
          continue;
        }
      }
    }

    cleaned.push(curr);
  }

  return cleaned.join(' ');
}

// Ensambla fragmentos reconocidos resolviendo el bug móvil de Android/WebKit
export function stitchSpeechTranscripts(chunks) {
  const result = [];

  for (let chunk of chunks) {
    const clean = cleanSpeechChunk(chunk);
    if (!clean) continue;

    if (result.length === 0) {
      result.push(clean);
      continue;
    }

    const prevIndex = result.length - 1;
    const prev = result[prevIndex];
    const prevLower = prev.toLowerCase();
    const cleanLower = clean.toLowerCase();

    // 1. Fragmento idéntico al anterior emitido dos veces
    if (prevLower === cleanLower) {
      continue;
    }

    // 2. El fragmento anterior ya incluye este texto al final
    if (prevLower.endsWith(cleanLower)) {
      continue;
    }

    // 3. Este fragmento engloba y extiende al anterior (bug acumulativo)
    if (cleanLower.startsWith(prevLower)) {
      result[prevIndex] = clean;
      continue;
    }

    // 4. Traslape de palabras en el límite entre fragmentos
    const prevWords = prev.split(/\s+/);
    const cleanWords = clean.split(/\s+/);
    let overlapCount = 0;
    const maxOverlap = Math.min(prevWords.length, cleanWords.length, 6);

    for (let k = maxOverlap; k >= 1; k--) {
      const prevEnd = prevWords.slice(prevWords.length - k).map((w) => w.toLowerCase()).join(' ');
      const cleanStart = cleanWords.slice(0, k).map((w) => w.toLowerCase()).join(' ');
      if (prevEnd === cleanStart) {
        overlapCount = k;
        break;
      }
    }

    if (overlapCount > 0) {
      const nonOverlapping = cleanWords.slice(overlapCount).join(' ');
      if (nonOverlapping) {
        result[prevIndex] = prev + ' ' + nonOverlapping;
      }
    } else {
      result.push(clean);
    }
  }

  return deduplicateAdjacentWords(result.join(' '));
}
