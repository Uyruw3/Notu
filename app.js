const games = [
  {
    title: "Pixel Runner",
    category: "Arcade",
    description: "Corre entre plataformas, esquiva obstáculos y supera tu propia marca.",
    icon: "🏃",
    color: "linear-gradient(135deg, #416d74, #25384f)",
    keywords: "correr plataformas reflejos"
  },
  {
    title: "Órbita Cero",
    category: "Acción",
    description: "Navega por el espacio y mantén a salvo tu pequeña galaxia.",
    icon: "🪐",
    color: "linear-gradient(135deg, #63559c, #302b55)",
    keywords: "espacio nave galaxia"
  },
  {
    title: "Mente en Bloques",
    category: "Puzzle",
    description: "Ordena las piezas y encuentra la solución paso a paso.",
    icon: "🧩",
    color: "linear-gradient(135deg, #a46b59, #553b5d)",
    keywords: "lógica piezas pensar"
  },
  {
    title: "Cancha Pixel",
    category: "Deportes",
    description: "Una partida rápida de precisión, ritmo y buenos reflejos.",
    icon: "🏀",
    color: "linear-gradient(135deg, #aa6c3a, #664345)",
    keywords: "balón cancha precisión"
  },
  {
    title: "Neon Drift",
    category: "Arcade",
    description: "Sigue el camino de neón en una carrera contra el reloj.",
    icon: "🏎️",
    color: "linear-gradient(135deg, #a04376, #453266)",
    keywords: "carreras coche velocidad"
  },
  {
    title: "Código Secreto",
    category: "Puzzle",
    description: "Descifra patrones ocultos con lógica y un poco de paciencia.",
    icon: "🔐",
    color: "linear-gradient(135deg, #47745c, #303d55)",
    keywords: "código patrones acertijo"
  },
  {
    title: "Última Frontera",
    category: "Acción",
    description: "Explora un mundo desconocido y prepárate para lo inesperado.",
    icon: "🚀",
    color: "linear-gradient(135deg, #3f6393, #383158)",
    keywords: "aventura exploración espacio"
  },
  {
    title: "Gol de Rebote",
    category: "Deportes",
    description: "Calcula el ángulo perfecto y apunta directo a la portería.",
    icon: "⚽",
    color: "linear-gradient(135deg, #527e56, #31504c)",
    keywords: "fútbol pelota gol"
  },
  {
    title: "Salto Lunar",
    category: "Arcade",
    description: "Salta de cráter en cráter y alcanza nuevas alturas.",
    icon: "🌙",
    color: "linear-gradient(135deg, #7b6d9e, #3b3b64)",
    keywords: "luna salto plataformas"
  }
];

const searchInput = document.querySelector("#game-search");
const grid = document.querySelector("#game-grid");
const emptyState = document.querySelector("#empty-state");
const resultsCount = document.querySelector("#results-count");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const githubGameForm = document.querySelector("#github-game-form");
const gameTitleInput = document.querySelector("#github-game-title");
const gameUrlInput = document.querySelector("#github-game-url");
const flashMessage = document.querySelector("#flash-message");
const flashPlayer = document.querySelector("#flash-player");
const flashPlayerTitle = document.querySelector("#flash-player-title");
const ruffleStage = document.querySelector("#ruffle-stage");
const swfFileInput = document.querySelector("#swf-file");
const selectedFile = document.querySelector("#selected-file");
const playLocalSwfButton = document.querySelector("#play-local-swf");
let activeCategory = "Todas";
let addedGames = [];
let selectedSwfFile = null;
let ruffleScriptPromise = null;

const ruffleScriptUrl = "https://unpkg.com/@ruffle-rs/ruffle@0.6.0/ruffle.js";
const ruffleScriptIntegrity = "sha384-eYV2CNXhSXdisg3+UbVhJIIRzygKoAWlfmBTkftwI9bsN5ctHUovLhbLzCcTelXF";
const maxSwfSize = 50 * 1024 * 1024;

window.RufflePlayer = window.RufflePlayer || {};
window.RufflePlayer.config = {
  ...window.RufflePlayer.config,
  allowScriptAccess: false,
  allowNetworking: "none",
  openUrlMode: "deny",
  allowFullscreen: false,
  autoplay: "off",
  logLevel: "error",
  polyfills: false
};

function validateGameUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return { error: "Introduce una URL válida." };
  }

  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    return { error: "Solo se aceptan direcciones HTTPS sin credenciales ni puertos personalizados." };
  }

  if (url.hostname === "raw.githubusercontent.com" && /\.swf$/i.test(url.pathname)) {
    if (url.search || url.hash) {
      return { error: "La URL directa del archivo SWF no debe incluir parámetros ni fragmentos." };
    }
    return { type: "swf", url: url.href };
  }

  if (/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.github\.io$/i.test(url.hostname)) {
    return { type: "site", url: url.href };
  }

  return {
    error: "Usa una página HTTPS de usuario.github.io o una URL directa .swf de raw.githubusercontent.com. Una URL de repositorio no es un juego ejecutable."
  };
}

function setFlashMessage(message, isError = false) {
  flashMessage.textContent = message;
  flashMessage.classList.toggle("is-error", isError);
}

function loadRuffle() {
  if (window.RufflePlayer?.newest) {
    return Promise.resolve();
  }
  if (ruffleScriptPromise) {
    return ruffleScriptPromise;
  }

  ruffleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = ruffleScriptUrl;
    script.integrity = ruffleScriptIntegrity;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    script.onload = resolve;
    script.onerror = () => reject(new Error("No se pudo cargar el paquete oficial de Ruffle desde unpkg."));
    document.head.append(script);
  }).catch((error) => {
    ruffleScriptPromise = null;
    throw error;
  });
  return ruffleScriptPromise;
}

function validateSwf(buffer) {
  if (buffer.byteLength > maxSwfSize) {
    throw new Error("El archivo supera el límite de 50 MB.");
  }
  if (buffer.byteLength < 8) {
    throw new Error("El archivo es demasiado pequeño para ser un SWF válido.");
  }

  const signature = String.fromCharCode(...new Uint8Array(buffer, 0, 3));
  if (!["FWS", "CWS", "ZWS"].includes(signature)) {
    throw new Error("El archivo no tiene una cabecera SWF reconocida.");
  }
}

async function playSwf(buffer, name) {
  validateSwf(buffer);
  setFlashMessage("Cargando Ruffle y preparando el juego…");
  flashPlayer.hidden = false;
  flashPlayerTitle.textContent = name;
  ruffleStage.replaceChildren();

  await loadRuffle();
  const player = window.RufflePlayer.newest().createPlayer();
  player.setAttribute("aria-label", `Juego Flash: ${name}`);
  player.style.width = "100%";
  player.style.height = "100%";
  ruffleStage.append(player);

  await player.ruffle().load({
    data: buffer,
    name,
    allowScriptAccess: false,
    allowNetworking: "none",
    openUrlMode: "deny",
    allowFullscreen: false,
    autoplay: "off"
  });

  flashPlayer.scrollIntoView({ behavior: "smooth", block: "start" });
  setFlashMessage(`“${name}” está listo. Pulsa reproducir en el jugador para empezar.`);
}

async function loadRemoteSwf(url, name) {
  setFlashMessage("Descargando el SWF desde GitHub…");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      mode: "cors",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`GitHub respondió con el estado ${response.status}.`);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxSwfSize) {
      throw new Error("El archivo supera el límite de 50 MB.");
    }

    if (!response.body) {
      throw new Error("El navegador no pudo leer el archivo descargado.");
    }

    const reader = response.body.getReader();
    const chunks = [];
    let totalSize = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      totalSize += value.byteLength;
      if (totalSize > maxSwfSize) {
        await reader.cancel();
        throw new Error("El archivo supera el límite de 50 MB.");
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(totalSize);
    let offset = 0;
    chunks.forEach((chunk) => {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    });
    const buffer = bytes.buffer;
    await playSwf(buffer, name);
  } finally {
    window.clearTimeout(timeout);
  }
}

function closeFlashPlayer() {
  ruffleStage.replaceChildren();
  flashPlayer.hidden = true;
  setFlashMessage("");
}

function renderGames() {
  const query = searchInput.value.trim().toLocaleLowerCase("es");
  const filteredGames = [...games, ...addedGames].filter((game) => {
    const matchesCategory = activeCategory === "Todas" || game.category === activeCategory;
    const searchableText = `${game.title} ${game.category} ${game.description} ${game.keywords}`
      .toLocaleLowerCase("es");
    return matchesCategory && searchableText.includes(query);
  });

  grid.replaceChildren(...filteredGames.map((game) => {
    const article = document.createElement("article");
    article.className = "game-card";

    const artwork = document.createElement("div");
    artwork.className = "game-art";
    artwork.style.setProperty("--card-background", game.color);
    artwork.setAttribute("aria-hidden", "true");

    const icon = document.createElement("span");
    icon.textContent = game.icon;
    artwork.append(icon);

    const content = document.createElement("div");
    content.className = "game-card-content";

    const topline = document.createElement("div");
    topline.className = "game-card-topline";

    const category = document.createElement("span");
    category.className = "category-tag";
    category.textContent = game.category;
    topline.append(category);

    const title = document.createElement("h3");
    title.textContent = game.title;

    const description = document.createElement("p");
    description.textContent = game.description;

    content.append(topline, title, description);
    if (game.url) {
      const launchLink = document.createElement("a");
      launchLink.className = "game-launch-link";
      launchLink.href = game.url;
      launchLink.target = "_blank";
      launchLink.rel = "noopener noreferrer";
      launchLink.textContent = "Abrir juego";
      launchLink.setAttribute("aria-label", `Abrir ${game.title} en una pestaña nueva`);
      content.append(launchLink);
    }
    article.append(artwork, content);
    return article;
  }));

  emptyState.hidden = filteredGames.length !== 0;
  resultsCount.textContent = `${filteredGames.length} ${filteredGames.length === 1 ? "juego" : "juegos"}`;
}

githubGameForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = gameTitleInput.value.trim();
  const result = validateGameUrl(gameUrlInput.value);
  if (!result.url) {
    setFlashMessage(result.error, true);
    gameUrlInput.focus();
    return;
  }
  if (!title) {
    setFlashMessage("Escribe el nombre del juego.", true);
    gameTitleInput.focus();
    return;
  }

  if (result.type === "site") {
    addedGames.push({
      title,
      category: "GitHub",
      description: "Juego publicado en GitHub Pages. Se abre en una pestaña nueva.",
      icon: "🎮",
      color: "linear-gradient(135deg, #527e56, #303d55)",
      keywords: "github pages flash clásico",
      url: result.url
    });
    githubGameForm.reset();
    renderGames();
    setFlashMessage(`“${title}” se añadió a la colección de esta sesión.`);
    return;
  }

  const submitButton = githubGameForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    await loadRemoteSwf(result.url, title);
    githubGameForm.reset();
  } catch (error) {
    setFlashMessage(error.name === "AbortError" ? "La descarga tardó demasiado. Inténtalo de nuevo." : error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

swfFileInput.addEventListener("change", () => {
  selectedSwfFile = swfFileInput.files[0] || null;
  selectedFile.textContent = selectedSwfFile ? selectedSwfFile.name : "Ningún archivo seleccionado";
  playLocalSwfButton.disabled = !selectedSwfFile;
  setFlashMessage("");
});

playLocalSwfButton.addEventListener("click", async () => {
  if (!selectedSwfFile) {
    return;
  }
  if (selectedSwfFile.size > maxSwfSize) {
    setFlashMessage("El archivo supera el límite de 50 MB.", true);
    return;
  }
  playLocalSwfButton.disabled = true;
  try {
    const buffer = await selectedSwfFile.arrayBuffer();
    await playSwf(buffer, selectedSwfFile.name);
  } catch (error) {
    setFlashMessage(error.message || "No se pudo abrir el juego Flash.", true);
  } finally {
    playLocalSwfButton.disabled = false;
  }
});

document.querySelector("#close-player").addEventListener("click", closeFlashPlayer);
searchInput.addEventListener("input", renderGames);
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    filterButtons.forEach((filter) => {
      const isActive = filter === button;
      filter.classList.toggle("is-active", isActive);
      filter.setAttribute("aria-pressed", String(isActive));
    });
    renderGames();
  });
});

renderGames();
