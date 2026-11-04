# 🎙️ BH Chat

> **Dictado y texto a voz**  
> Una aplicación web progresiva (**PWA**) rápida, minimalista y local-first para interactuar con la voz en formato de chat. Dos funciones esenciales sin distracciones: **dictado (voz a texto)** y **texto a voz (síntesis de audio)**.

Diseñada con filosofía **Local-First**, funciona completamente en el dispositivo sin servidores externos ni cuentas de usuario, cuenta con soporte sin conexión a internet y una interfaz inspirada en aplicaciones de mensajería con modo claro y oscuro automático.

---

## ✨ Características Principales

### 🎙️ 1. Dictado por Voz (Voz a Texto)
- **Burbuja de dictado (derecha, color verde)**: Captura las palabras habladas y las añade al hilo con la etiqueta "Dictado" y la hora correspondiente.
- **Burbuja en vivo en tiempo real**: Mientras se habla, una burbuja temporal con un indicador pulsante muestra la transcripción parcial al instante. Al detener el micrófono, se consolida como mensaje definitivo en el historial.
- **Motor anti-duplicación móvil**: Filtro inteligente que resuelve los desfases y fragmentos acumulativos habituales en navegadores móviles (Chrome en Android y Safari en iOS).
- **Control intuitivo**: Botón de micrófono redondo en la barra inferior (verde en espera; rojo con anillo pulsante mientras graba).

### 🔊 2. Texto a Voz (Lectura en Voz Alta)
- **Burbuja de texto a voz (izquierda, blanca con borde)**: Texto redactado en el compositor que se lee en voz alta al enviarse.
- **Lectura inmediata y resaltado activo**: Al pulsar el botón de envío o presionar Enter, el sintetizador reproduce el texto y la burbuja se resalta con un borde de color mientras suena.
- **Prevención de solapamiento**: Cancela automáticamente cualquier locución previa antes de comenzar una nueva lectura.
- **Botón dedicado**: Botón redondo naranja de parlante en la barra inferior.

### 💬 3. Acciones por Mensaje
Debajo de cada burbuja se muestran su etiqueta, hora (`HH:MM`) y tres acciones directas:
- **🔊 Escuchar**: Vuelve a reproducir el texto en voz alta (válido tanto para burbujas de texto como de dictados).
- **📋 Copiar**: Copia el texto al portapapeles con confirmación visual interactiva ("✓ Copiado").
- **🗑️ Borrar**: Elimina el mensaje individual del historial local.

### ⚙️ 4. Panel de Ajustes Rápido
Accede mediante el ícono de deslizadores en la cabecera para configurar:
- **Voz**: Selección entre las voces en español disponibles en el sintetizador del dispositivo, con opción *"Automática"*.
- **Velocidad de habla**: Modos Lenta (`0.8x`), Normal (`1.0x`) o Rápida (`1.2x`).
- **Idioma de dictado**: Selector de variante regional (`es-CL` por defecto, más `es-ES`, `es-MX`, `es-US` y `en-US`).
- Las preferencias se memorizan automáticamente en el navegador.

### 🗑️ 5. Vaciar Conversación
- Botón con ícono de papelera en la cabecera que detiene cualquier reproducción o dictado en curso y borra el hilo de mensajes al instante.

### 🔒 6. Privacidad y Persistencia Local
- **100% en el dispositivo**: Todos los mensajes (hasta un máximo de 200 en memoria circular) y la configuración se guardan exclusivamente en `localStorage`.
- **Sin cuentas ni dependencias en la nube**: No requiere inicios de sesión ni llamadas a servicios externos.
- **Renderizado seguro**: Todo el contenido se inyecta mediante `textContent` para proteger contra cualquier intento de XSS.

### 📱 7. PWA & Modo Offline
- **Instalable**: Compatible como aplicación de escritorio y móvil en Android e iOS.
- **Service Worker (`bh-chat-v3.0.1`)**: Almacena en caché los archivos necesarios para cargar y usar el chat incluso sin conexión a internet.

### 🎨 8. Diseño Editorial y Accesibilidad
- **Tipografías**: **Bricolage Grotesque** para títulos y **Figtree** para el cuerpo de texto.
- **Modo Claro / Oscuro**: Botón dedicado arriba a la derecha para alternar manualmente entre modo claro y oscuro, con persistencia en `localStorage` y detección automática de la preferencia del sistema (`prefers-color-scheme`).
- **Zonas seguras**: Respeta el área segura (`safe-area-inset`) de dispositivos móviles modernos.
- **Accesibilidad**: Foco visible en controles interactivos, etiquetas `aria-label` descriptivas y soporte completo para `prefers-reduced-motion`.

---

## 📂 Estructura del Proyecto

```text
bh-chat/
├── index.html              # Interfaz de usuario, cabecera, compositor y panel de ajustes
├── vite.config.js          # Configuración de compilación con Vite
├── server.js               # Servidor estático Express para producción
├── src/
│   ├── main.js             # Orquestador del ciclo de vida y registro del Service Worker
│   ├── state.js            # Estado reactivo global y referencias a elementos DOM
│   ├── chat.js             # Renderizado del hilo, burbuja en vivo y acciones de mensaje
│   ├── dictation.js        # Motor de reconocimiento de voz (Web Speech API)
│   ├── tts.js              # Motor de síntesis de voz (Text-to-Speech) y resaltado activo
│   ├── storage.js          # Persistencia en localStorage con límite de 200 mensajes
│   ├── ui.js               # Compositor autorresizable, teclado y panel de ajustes
│   ├── theme.js            # Sincronización del tema del sistema con meta theme-color
│   ├── utils.js            # Formato de hora, IDs únicos y algoritmos de ensamblado de audio
│   └── style.css           # Estilos completos, variables CSS, temas y animaciones
├── public/
│   ├── manifest.json       # Manifiesto PWA para instalación
│   ├── sw.js               # Service Worker con estrategia de caché offline
│   ├── icon.svg            # Icono vectorial estándar
│   ├── icon-maskable.svg   # Icono vectorial adaptable (Android)
│   ├── icon-192.png        # Icono PNG 192x192
│   ├── icon-512.png        # Icono PNG 512x512
│   └── apple-touch-icon.png# Icono optimizado para iOS
├── scripts/
│   └── generate-icons.mjs  # Utilidad opcional para rasterizar iconos PNG
├── tests/
│   └── chat.test.js        # Suite de pruebas unitarias (Node.js test runner)
├── eslint.config.js        # Configuración de ESLint
├── package.json            # Scripts y dependencias del proyecto
├── package-lock.json       # Árbol de dependencias bloqueado
├── LICENSE                 # Licencia MIT
└── README.md               # Documentación técnica
```

---

## 🚀 Requisitos y Configuración

### Prerrequisitos
- **Node.js** 18.0 o superior
- **npm** (el gestor de paquetes oficial del repositorio)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Yeremy-B/BITACORA-HABLADA-2.0.git
cd BITACORA-HABLADA-2.0
```

### 2. Instalar dependencias
```bash
npm install
```

---

## 💻 Ejecución y Pruebas

### Modo Desarrollo (Vite)
Para iniciar el entorno de desarrollo local con recarga rápida:
```bash
npm run dev
```
Accede desde el navegador en `http://localhost:3000`.

### Pruebas Unitarias
Ejecuta la suite nativa de pruebas de Node.js para validar la persistencia y algoritmos de voz:
```bash
npm test
```

### Verificación de Código (Linter)
Valida la sintaxis y buenas prácticas con ESLint:
```bash
npm run lint
```

### Compilación y Servidor de Producción
Para generar los archivos optimizados y servirlos mediante Express:
```bash
# 1. Compilar los archivos estáticos en dist/
npm run build

# 2. Iniciar el servidor
npm start
```
El servidor quedará disponible en el puerto configurado (por defecto `http://localhost:3000`).

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia [MIT](LICENSE).
