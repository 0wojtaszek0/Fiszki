import { parseCsvText, escapeHtml } from '../assets/js/flashcards.js';

const fileInput = document.querySelector('#csv-file');
const sampleSelect = document.querySelector('#sample-select');
const loadSampleButton = document.querySelector('#load-sample');
const cardEl = document.querySelector('#flashcard');
const faceLabel = document.querySelector('#face-label');
const faceContent = document.querySelector('#face-content');
const prevButton = document.querySelector('#prev-card');
const nextButton = document.querySelector('#next-card');
const flipButton = document.querySelector('#flip-card');
const statusEl = document.querySelector('#status');
const knownPileButton = document.querySelector('#known-pile');
const unknownPileButton = document.querySelector('#unknown-pile');
const knownList = document.querySelector('#known-list');
const unknownList = document.querySelector('#unknown-list');
const knownCount = document.querySelector('#known-count');
const unknownCount = document.querySelector('#unknown-count');

let cards = [];
let selectedIndex = 0;
let showingFront = true;
const reviewStacks = {
  known: [],
  unknown: [],
};

function updateStatus(message) {
  statusEl.textContent = message;
}

function renderStack(listEl, cardsList) {
  if (!cardsList.length) {
    listEl.innerHTML = '<li>brak</li>';
    return;
  }

  const items = cardsList.slice(-6).map((card) => `<li>${escapeHtml(card.foreignWord)}</li>`).join('');
  listEl.innerHTML = items;
}

function updateStacks() {
  knownCount.textContent = reviewStacks.known.length;
  unknownCount.textContent = reviewStacks.unknown.length;
  renderStack(knownList, reviewStacks.known);
  renderStack(unknownList, reviewStacks.unknown);
}

function getCurrentCard() {
  return cards[selectedIndex] ?? null;
}

function applyCardText(text, className) {
  faceContent.className = `face-content ${className}`;
  faceContent.innerHTML = `<span>${escapeHtml(text)}</span>`;
}

function toggleFrontBack() {
  if (!cards.length) {
    return;
  }

  showingFront = !showingFront;
  renderCard();
}

function renderCard() {
  const currentCard = getCurrentCard();

  if (!currentCard) {
    cardEl.hidden = true;
    faceContent.innerHTML = '';
    updateStatus('Brak danych. Wybierz plik CSV lub załaduj wzorcowy zestaw.');
    return;
  }

  cardEl.hidden = false;
  const isShowingTranslation = !showingFront;
  const labelText = isShowingTranslation ? 'Tył' : 'Przód';
  faceLabel.textContent = labelText;

  if (isShowingTranslation) {
    applyCardText(currentCard.translation, 'translation translation-block');
  } else {
    applyCardText(currentCard.foreignWord, 'word');
  }

  const countLabel = `${selectedIndex + 1} / ${cards.length}`;
  updateStatus(`${countLabel} • ${currentCard.foreignWord} → ${currentCard.translation}`);
}

function moveIndex(delta) {
  if (cards.length === 0) {
    return;
  }

  selectedIndex = (selectedIndex + delta + cards.length) % cards.length;
  showingFront = true;
  renderCard();
}

function restartUnknownCards() {
  if (!reviewStacks.unknown.length) {
    return;
  }

  cards = reviewStacks.unknown.slice();
  reviewStacks.unknown = [];
  selectedIndex = 0;
  showingFront = true;
  updateStacks();
  updateStatus(`Powtórka: ${cards.length} kart z "nie umiem" pojawi się jeszcze raz.`);
  renderCard();
}

function finishCurrentRound() {
  if (cards.length > 0) {
    return;
  }

  if (reviewStacks.unknown.length > 0) {
    restartUnknownCards();
    return;
  }

  cardEl.hidden = true;
  updateStatus('Wszystkie fiszki zostały już opanowane. Załaduj nowy plik albo zacznij od początku.');
}

function markCurrentCard(stackKey) {
  if (!cards.length) {
    return;
  }

  const currentCard = getCurrentCard();
  if (!currentCard) {
    return;
  }

  const removedCard = cards.splice(selectedIndex, 1)[0];
  if (removedCard) {
    reviewStacks[stackKey].push(removedCard);
  }

  updateStacks();

  if (cards.length === 0) {
    finishCurrentRound();
    return;
  }

  selectedIndex = Math.min(selectedIndex, cards.length - 1);
  showingFront = true;
  renderCard();
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
      throw new Error(`Błąd pobierania: ${response.status}`);
    }

    const text = await response.text();
    loadCardsFromText(text, path.split('/').pop() || 'sample.csv');
  } catch (error) {
    updateStatus(`Nie udało się załadować przykładu: ${error.message}`);
  }
});

function loadCardsFromText(text, filename) {
  const parsedCards = parseCsvText(text);
  reviewStacks.known = [];
  reviewStacks.unknown = [];
  updateStacks();

  if (parsedCards.length === 0) {
    cards = [];
    selectedIndex = 0;
    showingFront = true;
    cardEl.hidden = true;
    updateStatus(`Plik ${filename} nie zawiera żadnych rekordów.`);
    return;
  }

  cards = parsedCards;
  selectedIndex = 0;
  showingFront = true;
  renderCard();
}

prevButton.addEventListener('click', () => moveIndex(-1));
nextButton.addEventListener('click', () => moveIndex(1));
flipButton.addEventListener('click', toggleFrontBack);
cardEl.addEventListener('click', toggleFrontBack);
faceLabel.addEventListener('click', toggleFrontBack);
knownPileButton.addEventListener('click', () => markCurrentCard('known'));
unknownPileButton.addEventListener('click', () => markCurrentCard('unknown'));

knownPileButton.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    markCurrentCard('known');
  }
});

unknownPileButton.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    markCurrentCard('unknown');
  }
});

window.addEventListener('keydown', (event) => {
  if (!cards.length) {
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    markCurrentCard('known');
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    markCurrentCard('unknown');
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveIndex(-1);
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveIndex(1);
  }

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    toggleFrontBack();
  }
});

updateStacks();
renderCard();
