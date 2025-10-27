// elementi DOM
const imageInput = document.getElementById('imageInput');
const analyzeBtn  = document.getElementById('analyzeBtn');
const exportBtn   = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const status      = document.getElementById('status');
const output      = document.getElementById('output');
const amountEl    = document.getElementById('amount');
const dateEl      = document.getElementById('date');
const timeEl      = document.getElementById('time');
const fuelEl      = document.getElementById('fuelPrice'); // nuovo elemento per prezzo benzina
const tableEl     = document.getElementById('dataTable');
const toast       = document.getElementById('toast');

let allData = JSON.parse(localStorage.getItem('scontrini')) || [];
let currentData = { date:'', time:'', amount:'', fuelPrice:'' };

// helper toast
function showToast(msg, ms = 2200){
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(()=> {
    toast.classList.remove('show');
    setTimeout(()=> toast.classList.add('hidden'), 220);
  }, ms);
}

// aggiorna tabella storico
function updateTable(){
  tableEl.innerHTML = '';
  if (allData.length === 0){
    tableEl.innerHTML = '<tr><td colspan="5">Nessun scontrino registrato.</td></tr>';
    return;
  }
  // header
  const header = document.createElement('tr');
  header.innerHTML = `<th>Data</th><th>Ora</th><th>Importo</th><th>Benzina</th><th>Azioni</th>`;
  tableEl.appendChild(header);

  allData.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${item.date||'—'}</td>
                    <td>${item.time||'—'}</td>
                    <td>${item.amount||'—'}</td>
                    <td>${item.fuelPrice||'—'}</td>
                    <td><button class="delete-btn" data-i="${idx}">🗑️ Elimina</button></td>`;
    tableEl.appendChild(tr);
  });

  // attach delete handlers
  tableEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = (e) => {
      const i = Number(e.currentTarget.dataset.i);
      if (!confirm('Eliminare questa voce?')) return;
      allData.splice(i,1);
      localStorage.setItem('scontrini', JSON.stringify(allData));
      updateTable();
      showToast('Voce eliminata');
    };
  });
}

// init tabella
updateTable();

// funzione principale: analisi OCR
analyzeBtn.addEventListener('click', async () => {
  if (!imageInput.files[0]) {
    alert('Seleziona un\'immagine prima!');
    return;
  }
  status.textContent = 'OCR in corso...';
  const file = imageInput.files[0];

  try {
    const res = await Tesseract.recognize(file, 'ita', {
      logger: m => {
        if (m.status === 'recognizing text') {
          status.textContent = `OCR: ${Math.round(m.progress*100)}%`;
        }
      }
    });

    const text = res.data.text || '';
    output.textContent = text || 'Nessun testo rilevato.';
    status.textContent = 'Analisi completata';
    showToast('OCR completato');

    const lines = text.split('\n').map(l=>l.trim()).filter(l=>l.length>0);

    // reset dati correnti
    currentData = { date:'', time:'', amount:'', fuelPrice:'' };

    // linea 14 -> data e ora
    if (lines.length >= 14){
      const line14 = lines[13];
      const dateMatch = line14.match(/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/);
      const timeMatch = line14.match(/\b\d{1,2}[:.]\d{2}\b/);
      if (dateMatch) currentData.date = dateMatch[0].replace(/\./g,'-');
      if (timeMatch) currentData.time = timeMatch[0].replace('.',':');
    }

    // linea 22 -> importo totale
    if (lines.length >= 22){
      const line22 = lines[21];
      const matchAmount = line22.match(/EURO?\s*([0-9]{1,3}[.,][0-9]{2})/i);
      if (matchAmount) currentData.amount = matchAmount[1].replace('.',',') + ' €';
    }

    // quart'ultima riga -> prezzo benzina
    if (lines.length >= 4){
      const fuelLine = lines[lines.length - 4];
      const fuelMatch = fuelLine.match(/([0-9]{1,3}[.,][0-9]{2})/);
      if (fuelMatch) currentData.fuelPrice = fuelMatch[1].replace('.',',') + ' €';
    }

    // aggiorna UI
    dateEl.textContent = currentData.date || '—';
    timeEl.textContent = currentData.time || '—';
    amountEl.textContent = currentData.amount || '—';
    fuelEl.textContent = currentData.fuelPrice || '—';

    // salva se almeno data o importo presenti
    if (currentData.date || currentData.amount){
      allData.push({...currentData});
      localStorage.setItem('scontrini', JSON.stringify(allData));
      updateTable();
      showToast('Lettura salvata');
    } else {
      showToast('Nessun dato valido da salvare', 2000);
    }

  } catch (err) {
    console.error(err);
    status.textContent = 'Errore OCR ❌';
    showToast('Errore durante OCR');
  }
});

// esporta CSV accumulativo (incluso prezzo benzina)
exportBtn.addEventListener('click', () => {
  if (allData.length === 0){
    alert('Nessun dato da esportare.');
    return;
  }
  const headers = ['Data','Ora','Importo','Prezzo Benzina'];
  const rows = allData.map(r => `"${r.date}","${r.time}","${r.amount}","${r.fuelPrice}"`);
  const csv = [headers.join(',')].concat(rows).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = 'scontrini.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('CSV generato e scaricato');
});

// pulisci tutto
clearAllBtn.addEventListener('click', () => {
  if (!confirm('Eliminare tutte le letture salvate?')) return;
  allData = [];
  localStorage.removeItem('scontrini');
  updateTable();
  showToast('Storico svuotato');
});
