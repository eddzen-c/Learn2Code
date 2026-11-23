import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './style.css';

GlobalWorkerOptions.workerSrc = workerSrc;

const PDF_URL = '/Learn2Code_Documentacion.pdf';

document.querySelector('#app').innerHTML = `
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <img src="/logo.png" alt="Isologo de Learn2Code" />
        <div class="brand-copy">
          <h1 class="brand-title">Learn<span class="two">2</span>Code · Documentación</h1>
          <p class="brand-subtitle">Arquitectura, análisis, desarrollo, pruebas y estado del MVP</p>
        </div>
      </div>
      <div class="status" id="connectionStatus" aria-live="polite">
        <span class="status-dot" aria-hidden="true"></span>
        <span id="statusText">Preparando acceso sin conexión…</span>
      </div>
    </header>

    <nav class="toolbar" aria-label="Controles del documento">
      <button id="prevPage" type="button" aria-label="Página anterior">← Anterior</button>
      <div class="page-control">
        <label for="pageNumber" class="sr-only">Página</label>
        <input id="pageNumber" type="number" min="1" value="1" inputmode="numeric" />
        <span class="page-total">de <strong id="pageCount">—</strong></span>
      </div>
      <button id="nextPage" type="button" aria-label="Página siguiente">Siguiente →</button>
      <button id="zoomOut" type="button" aria-label="Reducir zoom">−</button>
      <button id="fitWidth" type="button">Ajustar</button>
      <button id="zoomIn" type="button" aria-label="Aumentar zoom">+</button>
    </nav>

    <main class="viewer-shell">
      <section class="viewer" id="viewer" aria-live="polite">
        <div class="loading" id="loading">
          <strong>Cargando documentación…</strong>
          <span>La primera carga también prepara el documento para poder consultarlo sin conexión.</span>
        </div>
      </section>
      <p class="footer-note">
        Una vez que esta página termine de cargar por primera vez, el visor y el PDF quedarán guardados en este dispositivo para futuras consultas sin conexión.
      </p>
    </main>
  </div>
`;

const viewer = document.querySelector('#viewer');
const pageInput = document.querySelector('#pageNumber');
const pageCount = document.querySelector('#pageCount');
const prevButton = document.querySelector('#prevPage');
const nextButton = document.querySelector('#nextPage');
const zoomOut = document.querySelector('#zoomOut');
const zoomIn = document.querySelector('#zoomIn');
const fitWidth = document.querySelector('#fitWidth');
const connectionStatus = document.querySelector('#connectionStatus');
const statusText = document.querySelector('#statusText');

let pdf = null;
let currentPage = 1;
let zoom = 1;
let renderTask = null;
let renderNonce = 0;
let resizeTimer = null;
let offlineReady = false;

function updateStatus() {
  if (!navigator.onLine) {
    connectionStatus.classList.add('offline');
    statusText.textContent = offlineReady ? 'Sin conexión · copia local disponible' : 'Sin conexión';
    return;
  }
  connectionStatus.classList.remove('offline');
  statusText.textContent = offlineReady ? 'Disponible sin conexión' : 'En línea · preparando copia local';
}

window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();

function updateControls() {
  if (!pdf) return;
  pageInput.value = String(currentPage);
  pageInput.max = String(pdf.numPages);
  pageCount.textContent = String(pdf.numPages);
  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= pdf.numPages;
  zoomOut.disabled = zoom <= 0.6;
  zoomIn.disabled = zoom >= 2.2;
}

async function renderPage(pageNumber) {
  if (!pdf) return;
  const nonce = ++renderNonce;
  currentPage = Math.max(1, Math.min(pdf.numPages, pageNumber));
  updateControls();

  if (renderTask) {
    try { renderTask.cancel(); } catch {}
    renderTask = null;
  }

  const page = await pdf.getPage(currentPage);
  if (nonce !== renderNonce) return;

  const baseViewport = page.getViewport({ scale: 1 });
  const availableWidth = Math.max(280, Math.min(viewer.clientWidth - 12, 1040));
  const fitScale = availableWidth / baseViewport.width;
  const cssScale = Math.max(0.45, Math.min(2.5, fitScale * zoom));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: cssScale * pixelRatio });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = Math.floor(baseViewport.width * cssScale) + 'px';
  canvas.style.height = Math.floor(baseViewport.height * cssScale) + 'px';

  const wrap = document.createElement('div');
  wrap.className = 'canvas-wrap';
  wrap.appendChild(canvas);
  viewer.replaceChildren(wrap);

  renderTask = page.render({ canvasContext: context, viewport });
  try {
    await renderTask.promise;
  } catch (error) {
    if (error?.name !== 'RenderingCancelledException') throw error;
  } finally {
    renderTask = null;
  }
}

function goToPage(value) {
  if (!pdf) return;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    pageInput.value = String(currentPage);
    return;
  }
  renderPage(parsed);
}

prevButton.addEventListener('click', () => renderPage(currentPage - 1));
nextButton.addEventListener('click', () => renderPage(currentPage + 1));
pageInput.addEventListener('change', () => goToPage(pageInput.value));
pageInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    goToPage(pageInput.value);
    pageInput.blur();
  }
});

zoomOut.addEventListener('click', () => {
  zoom = Math.max(0.6, Number((zoom - 0.15).toFixed(2)));
  renderPage(currentPage);
});
zoomIn.addEventListener('click', () => {
  zoom = Math.min(2.2, Number((zoom + 0.15).toFixed(2)));
  renderPage(currentPage);
});
fitWidth.addEventListener('click', () => {
  zoom = 1;
  renderPage(currentPage);
});

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => renderPage(currentPage), 150);
});

document.addEventListener('keydown', event => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') renderPage(currentPage - 1);
  if (event.key === 'ArrowRight' || event.key === 'PageDown') renderPage(currentPage + 1);
});

async function registerOfflineSupport() {
  if (!('serviceWorker' in navigator)) {
    statusText.textContent = navigator.onLine ? 'En línea' : 'Sin conexión';
    return;
  }
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    offlineReady = true;
    updateStatus();
  } catch {
    statusText.textContent = navigator.onLine ? 'En línea' : 'Sin conexión';
  }
}

async function openDocument() {
  try {
    const loadingTask = getDocument({
      url: PDF_URL,
      cMapPacked: true,
      useWorkerFetch: true,
    });
    pdf = await loadingTask.promise;
    updateControls();
    await renderPage(1);
  } catch (error) {
    viewer.innerHTML = `
      <div class="error">
        <strong>No fue posible abrir la documentación.</strong>
        <span>${navigator.onLine ? 'Actualiza la página para volver a intentarlo.' : 'Conéctate a internet una vez para guardar el documento en este dispositivo.'}</span>
      </div>
    `;
    console.error(error);
  }
}

registerOfflineSupport();
openDocument();
