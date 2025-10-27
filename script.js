const imageInput = document.getElementById('imageInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const status = document.getElementById('status');
const output = document.getElementById('output');
const amountEl = document.getElementById('amount');
const dateEl = document.getElementById('date');

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
    status.textContent = 'Analisi completata!';

    // --- Importo principale sotto "Importo EUR" ---
    const matches = [...text.matchAll(/Importo\s+Euro\s*([0-9]{1,3}[,\.][0-9]{2})/gi)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1][1];
      amountEl.textContent = lastMatch.replace('.', ',') + ' €';
    } else {
      amountEl.textContent = 'Non trovato';
    }

    // --- Data ---
    const dateMatch = text.match(/(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/);
    dateEl.textContent = dateMatch ? dateMatch[1] : 'Non trovata';

  } catch (err) {
    status.textContent = 'Errore durante l\'analisi!';
    console.error(err);
  }
});