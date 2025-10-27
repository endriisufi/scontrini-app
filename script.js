const imageInput = document.getElementById('imageInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const status = document.getElementById('status');
const output = document.getElementById('output');
const amountEl = document.getElementById('amount');
const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');

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

    // --- Riga 14: data e ora ---
    if (lines.length >= 14) {
      const line14 = lines[13];
      const parts = line14.split(/\s{2,}/); // separa le due "colonne"
      dateEl.textContent = parts[0] || '—';
      timeEl.textContent = parts[1] || '—';
    } else {
      dateEl.textContent = '—';
      timeEl.textContent = '—';
    }

    // --- Riga 22: importo ---
    if (lines.length >= 22) {
      const line22 = lines[21];
      const matchAmount = line22.match(/EURO?\s*([0-9]{1,3}[.,][0-9]{2})/i);
      amountEl.textContent = matchAmount ? matchAmount[1].replace('.', ',') + ' €' : '—';
    } else {
      amountEl.textContent = '—';
    }

  } catch (err) {
    status.textContent = 'Errore durante l\'analisi ❌';
    console.error(err);
  }
});