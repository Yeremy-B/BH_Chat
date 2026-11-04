const THEME_KEY = 'bh_chat_theme';

export function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getSavedTheme() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(THEME_KEY);
  } catch (_) {
    return null;
  }
}

export function getCurrentTheme() {
  const saved = getSavedTheme();
  if (saved === 'dark' || saved === 'light') return saved;
  return getSystemTheme();
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = theme === 'dark';

  if (isDark) {
    root.classList.add('dark-theme');
    root.classList.remove('light-theme');
  } else {
    root.classList.add('light-theme');
    root.classList.remove('dark-theme');
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? '#141B20' : '#2F6B63');
  }

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    const nextLabel = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    toggleBtn.setAttribute('aria-label', nextLabel);
    toggleBtn.setAttribute('title', nextLabel);
  }

  const sunIcon = document.getElementById('themeIconSun');
  const moonIcon = document.getElementById('themeIconMoon');
  if (sunIcon && moonIcon) {
    sunIcon.style.display = isDark ? 'block' : 'none';
    moonIcon.style.display = isDark ? 'none' : 'block';
  }
}

export function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_KEY, next);
    }
  } catch (_) {}
  applyTheme(next);
}

export function initTheme() {
  const current = getCurrentTheme();
  applyTheme(current);

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      // Si el usuario no ha seleccionado manualmente un tema, seguir la preferencia del sistema
      if (!getSavedTheme()) {
        applyTheme(getSystemTheme());
      }
    };
    if (media.addEventListener) {
      media.addEventListener('change', onChange);
    } else if (media.addListener) {
      media.addListener(onChange);
    }
  }
}
