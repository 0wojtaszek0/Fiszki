import { chunkArray, parseCsvText, escapeHtml } from '../assets/js/flashcards.js';

const fileInput = document.querySelector('#print-file');
const sampleSelect = document.querySelector('#print-sample');
const cardsPerPageSelect = document.querySelector('#cards-per-page');
const loadSampleButton = document.querySelector('#load-print-sample');
const printButton = document.querySelector('#print-pdf');
const output = document.querySelector('#print-output');
const statusEl = document.querySelector('#print-status');

const layoutConfig = {
  6: { columns: 3, rows: 2, sheetWidth: '88mm', sheetHeight: '82mm', paddingX: '5mm', paddingY: '10mm', gapX: '4mm', gapY: '6mm' },
  8: { columns: 4, rows: 2, sheetWidth: '60mm', sheetHeight: '68mm', paddingX: '5mm', paddingY: '9mm', gapX: '4mm', gapY: '6mm' },
  9: { columns: 3, rows: 3, sheetWidth: '80mm', sheetHeight: '56mm', paddingX: '6mm', paddingY: '8mm', gapX: '4mm', gapY: '6mm' },
  12: { columns: 4, rows: 3, sheetWidth: '58mm', sheetHeight: '52mm', paddingX: '6mm', paddingY: '8mm', gapX: '4mm', gapY: '6mm' },
};

let currentCards = [];

function updateStatus(message) {
  statusEl.textContent = message;
}

function renderEmptyState() {
  output.innerHTML = '<div class="empty-state">Brak danych do wydruku. Wczytaj CSV z listą słówek.</div>';
}

function renderCardSheet(card) {
  return `
    <div class="card-sheet" aria-label="Fiszka ${escapeHtml(card.foreignWord)}">
      <div class="card-face front">
        <span class="card-caption">Front</span>
        <span>${escapeHtml(card.foreignWord)}</span>
      </div>
      <div class="card-face back">
        <span class="card-caption">Back</span>
        <span>${escapeHtml(card.translation)}</span>
      </div>
    </div>
  `;
}

function getCardsPerPage() {
  const chosenValue = Number(cardsPerPageSelect.value || '6');
  return layoutConfig[chosenValue] ? chosenValue : 6;
}

function renderPage(pageCards) {
  const cardsPerPage = getCardsPerPage();
  const config = layoutConfig[cardsPerPage];
  const padded = [...pageCards];
  while (padded.length < config.columns * config.rows) {
    padded.push(null);
  }

  const columns = padded
    .map((card) => (card ? renderCardSheet(card) : '<div class="card-sheet" aria-hidden="true"></div>'))
    .join('');

  return `
    <div class="print-page" aria-label="Strona A4 po wydruku" style="--cards-per-row:${config.columns}; --cards-per-column:${config.rows}; --sheet-width:${config.sheetWidth}; --sheet-height:${config.sheetHeight}; --page-padding-x:${config.paddingX}; --page-padding-y:${config.paddingY}; --gap-x:${config.gapX}; --gap-y:${config.gapY};">
      <div class="print-grid">${columns}</div>
    </div>
  `;
}

function renderPages(cards) {
  if (!cards.length) {
    currentCards = [];
    renderEmptyState();
    return;
  }

  currentCards = cards;
  const cardsPerPage = getCardsPerPage();
  const pages = chunkArray(cards, cardsPerPage);
  output.innerHTML = pages.map((pageCards) => renderPage(pageCards)).join('');
  updateStatus(`Wygenerowano ${pages.length} stron A4 dla ${cards.length} fiszek przy ${cardsPerPage} na stronie.`);
}

function loadCardsFromText(text, fileName) {
  try {
    const parsed = parseCsvText(text);
    renderPages(parsed);
    if (!parsed.length) {
      updateStatus(`Plik ${fileName} nie zawiera żadnych rekordów.`);
    }
  } catch (error) {
    updateStatus(`Błąd pliku ${fileName}: ${error.message}`);
    renderEmptyState();
  }
}

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    loadCardsFromText(text, file.name);
  } catch (error) {
    updateStatus(`Nie udało się odczytać pliku: ${error.message}`);
  }
});

loadSampleButton.addEventListener('click', async () => {
  const path = sampleSelect.value;
  if (!path) {
    updateStatus('Najpierw wybierz przykładowy plik.');
    return;
  }

  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Nie można pobrać ${response.status}`);
    }

    const text = await response.text();
    loadCardsFromText(text, path.split('/').pop() || 'sample.csv');
  } catch (error) {
    updateStatus(`Nie udało się załadować próbki: ${error.message}`);
  }
});

cardsPerPageSelect.addEventListener('change', () => {
  if (currentCards.length) {
    renderPages(currentCards);
  }
});

printButton.addEventListener('click', () => {
  if (!output.querySelector('.print-page')) {
    updateStatus('Najpierw wygeneruj układ A4 dla fiszek.');
    return;
  }

  window.print();
});

renderEmptyState();
