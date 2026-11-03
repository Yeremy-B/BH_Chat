// El tema se gestiona automáticamente con CSS media queries (prefers-color-scheme: dark).
// Este módulo escucha cambios en la preferencia del sistema para actualizar la etiqueta meta theme-color.
export function initTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const updateMetaTheme = (e) => {
    const isDark = e.matches;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', isDark ? '#141B20' : '#2F6B63');
    }
  };

  updateMetaTheme(media);
  if (media.addEventListener) {
    media.addEventListener('change', updateMetaTheme);
  } else if (media.addListener) {
    media.addListener(updateMetaTheme);
  }
}
