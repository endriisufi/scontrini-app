
const imageInput = document.getElementById('imageInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const exportBtn = document.getElementById('exportBtn');
const status = document.getElementById('status');
const output = document.getElementById('output');
const amountEl = document.getElementById('amount');
const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');

let currentData = { date: '', time: '', amount: '' }; // serve per CSV

analyzeBtn.addEventListener('click', async () => {
  if (!imageInput.files[0]) {
    alert('Seleziona un\'immagine prima!');
    return;
  }

  status.textContent = 'Analisi in corso...';
  const file = imageInput.files[0];

  try {
    const result = await Tesseract.recognize(file, 'ita', {
      logger: m => {
        if (m.status === 'recognizing text') {
          status.textContent = `Analisi in corso: ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    const text = result.data.text;
    output.textContent = text;
    status.textContent = 'Analisi completata ✅';

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // --- Riga 14: data e ora separate ---
    if (lines.length >= 14) {
      const line14 = lines[13];
      // proviamo a prendere la data e l'ora usando regex
      const dateMatch = line14.match(/\d{1,2}-\d{1,2}-\d{4}/);
      const timeMatch = line14.match(/\d{1,2}[:]\d{2}/);
      currentData.date = dateMatch ? dateMatch[0] : '';
      currentData.time = timeMatch ? timeMatch[0] : '';
      dateEl.textContent = currentData.date || '—';
      timeEl.textContent = currentData.time || '—';
    } else {
      dateEl.textContent = '—';
      timeEl.textContent = '—';
      currentData.date = '';
      currentData.time = '';
    }

    // --- Riga 22: importo ---
    if (lines.length >= 22) {
      const line22 = lines[21];
      const matchAmount = line22.match(/EURO?\s*([0-9]{1,3}[.,][0-9]{2})/i);
      currentData.amount = matchAmount ? matchAmount[1].replace('.', ',') + ' €' : '';
      amountEl.textContent = currentData.amount || '—';
    } else {
      amountEl.textContent = '—';
      currentData.amount = '';
    }

  } catch (err) {
    status.textContent = 'Errore durante l\'analisi ❌';
    console.error(err);
  }
});

// --- Esporta CSV ---
exportBtn.addEventListener('click', () => {
  if (!currentData.date || !currentData.amount) {
    alert('Nessun dato disponibile da esportare!');
    return;
  }

  const headers = ['Data', 'Ora', 'Importo'];
  const values = [currentData.date, currentData.time, currentData.amount];
  const csvContent = headers.join(',') + '\n' + values.join(',');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'scontrino.csv');
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  status.textContent = 'File CSV generato ✅';
});