export function parseCsvText(csvText) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  const commitValue = () => {
    row.push(value);
    value = '';
  };

  const commitRow = () => {
    if (row.length > 0) {
      const trimmed = row.map((cell) => cell.trim());
      if (trimmed.some((cell) => cell.length > 0)) {
        rows.push(trimmed);
      }
      row = [];
    }
  };

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      commitValue();
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }
      commitValue();
      commitRow();
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    commitValue();
    commitRow();
  }

  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const normalizeText = (value) =>
    String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/ą/g, 'a')
      .replace(/ć/g, 'c')
      .replace(/ę/g, 'e')
      .replace(/ń/g, 'n')
      .replace(/ó/g, 'o')
      .replace(/ś/g, 's')
      .replace(/ż/g, 'z')
      .replace(/ź/g, 'z')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');

  const normalizedHeader = headerRow.map((header) => normalizeText(header));

  const getIndex = (fieldNames) => {
    for (const candidate of fieldNames) {
      const normalizedCandidate = normalizeText(candidate);
      const index = normalizedHeader.indexOf(normalizedCandidate);
      if (index !== -1) {
        return index;
      }
    }
    return -1;
  };

  const foreignIndex = getIndex(['slowoangielskie', 'word', 'foreignword', 'foreign', 'term']);
  const translationIndex = getIndex(['tlumaczenie', 'translation', 'polskie', 'polski', 'meaning']);

  if (foreignIndex === -1 || translationIndex === -1) {
    throw new Error('CSV must contain columns for the foreign word and its translation.');
  }

  return dataRows
    .filter((rowItem) => rowItem.length > 0)
    .map((rowItem, index) => {
      const foreignWord = (rowItem[foreignIndex] ?? '').trim();
      const translation = (rowItem[translationIndex] ?? '').trim();

      if (!foreignWord && !translation) {
        return null;
      }

      return {
        id: `${index}-${foreignWord || 'card'}`,
        foreignWord,
        translation: translation || '—',
        raw: rowItem,
      };
    })
    .filter(Boolean);
}

export function chunkArray(items, chunkSize) {
  const batches = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    batches.push(items.slice(i, i + chunkSize));
  }
  return batches;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
