const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let questions = [];
let nextId = 1;

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

app.get('/', (req, res) => res.send(audiencePage()));
app.get('/moderador', (req, res) => res.send(moderatorPage()));

app.get('/api/perguntas', (req, res) => res.json(questions));

app.post('/api/perguntas', (req, res) => {
  const { nome, pergunta } = req.body;
  if (!pergunta || pergunta.trim().length < 5)
    return res.status(400).json({ error: 'Pergunta muito curta' });
  const q = {
    id: nextId++,
    nome: nome?.trim() || 'Anônimo',
    pergunta: pergunta.trim(),
    status: 'pendente',
    criadoEm: new Date().toISOString(),
  };
  questions.push(q);
  broadcast({ type: 'nova_pergunta', pergunta: q });
  res.json({ ok: true });
});

app.patch('/api/perguntas/:id', (req, res) => {
  const q = questions.find(x => x.id === parseInt(req.params.id));
  if (!q) return res.status(404).json({ error: 'Não encontrada' });
  if (req.body.status) q.status = req.body.status;
  broadcast({ type: 'atualizar_pergunta', pergunta: q });
  res.json({ ok: true });
});

app.delete('/api/perguntas/:id', (req, res) => {
  const idx = questions.findIndex(x => x.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Não encontrada' });
  questions.splice(idx, 1);
  broadcast({ type: 'remover_pergunta', id: parseInt(req.params.id) });
  res.json({ ok: true });
});

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'init', perguntas: questions }));
});

// ─── HTML Pages ───────────────────────────────────────────────────────────────

const ABF_LOGO_IMG = `<img src="/logo-abf.jpg" alt="ABF" style="height:100%;width:auto;display:block;object-fit:contain;"/>`;

function audiencePage() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Perguntas ao Vivo — Franchising Summit Brasil</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    min-height: 100dvh;
    background: linear-gradient(160deg, #0a2a5e 0%, #1B4F9B 45%, #2d6fd4 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 16px 48px;
    color: #fff;
  }

  .logo-wrap {
    background: white;
    border-radius: 16px;
    padding: 14px 28px;
    margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    height: 72px;
    display: flex;
    align-items: center;
  }

  h1 {
    font-size: clamp(1.2rem, 5vw, 1.7rem);
    font-weight: 800;
    text-align: center;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  }

  .subtitle {
    font-size: 0.95rem;
    opacity: 0.82;
    text-align: center;
    margin-bottom: 32px;
  }

  .card {
    background: white;
    border-radius: 20px;
    padding: 28px 24px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.22);
  }

  .card h2 {
    font-size: 1.1rem;
    color: #1B4F9B;
    font-weight: 700;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input, textarea {
    width: 100%;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 1rem;
    font-family: inherit;
    color: #1a202c;
    transition: border-color 0.2s;
    outline: none;
    background: #f8fafc;
  }
  input:focus, textarea:focus {
    border-color: #1B4F9B;
    background: white;
  }

  .field { margin-bottom: 18px; }

  textarea {
    min-height: 120px;
    resize: vertical;
    line-height: 1.5;
  }

  .char-count {
    text-align: right;
    font-size: 0.78rem;
    color: #94a3b8;
    margin-top: 4px;
  }
  .char-count.over { color: #e53e3e; }

  button[type="submit"] {
    width: 100%;
    background: linear-gradient(135deg, #1B4F9B, #2d6fd4);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px;
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    letter-spacing: 0.3px;
  }
  button[type="submit"]:hover { opacity: 0.92; }
  button[type="submit"]:active { transform: scale(0.98); }
  button[type="submit"]:disabled { opacity: 0.5; cursor: not-allowed; }

  .success {
    display: none;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 12px 0 4px;
  }
  .success-icon {
    width: 64px; height: 64px;
    background: linear-gradient(135deg, #1B4F9B, #2d6fd4);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 2rem;
    margin-bottom: 16px;
    box-shadow: 0 8px 24px rgba(27,79,155,0.35);
  }
  .success h3 { font-size: 1.2rem; color: #1B4F9B; font-weight: 800; margin-bottom: 8px; }
  .success p { color: #64748b; font-size: 0.95rem; margin-bottom: 20px; }
  .btn-nova {
    background: none;
    border: 2px solid #1B4F9B;
    color: #1B4F9B;
    border-radius: 10px;
    padding: 12px 28px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-nova:hover { background: #1B4F9B; color: white; }

  .footer {
    margin-top: 28px;
    font-size: 0.8rem;
    opacity: 0.55;
    text-align: center;
  }
</style>
</head>
<body>

<div class="logo-wrap">${ABF_LOGO_IMG}</div>

<h1>Franchising Summit Brasil</h1>
<p class="subtitle">Envie sua pergunta para o palestrante</p>

<div class="card">
  <h2>💬 Fazer uma pergunta</h2>

  <form id="form">
    <div class="field">
      <label for="nome">Seu nome (opcional)</label>
      <input type="text" id="nome" placeholder="Ex: João Silva" maxlength="60" autocomplete="name"/>
    </div>
    <div class="field">
      <label for="pergunta">Sua pergunta *</label>
      <textarea id="pergunta" placeholder="Digite sua pergunta aqui..." maxlength="400" required></textarea>
      <div class="char-count" id="charCount">0 / 400</div>
    </div>
    <button type="submit" id="btnEnviar">Enviar pergunta</button>
  </form>

  <div class="success" id="success">
    <div class="success-icon">✓</div>
    <h3>Pergunta enviada!</h3>
    <p>Sua pergunta foi recebida pelo moderador.<br/>Fique atento durante a sessão de Q&A.</p>
    <button class="btn-nova" onclick="resetForm()">Enviar outra pergunta</button>
  </div>
</div>

<div class="footer">Franchising Summit Brasil &nbsp;·&nbsp; ABF</div>

<script>
  const form = document.getElementById('form');
  const success = document.getElementById('success');
  const perguntaEl = document.getElementById('pergunta');
  const charCount = document.getElementById('charCount');
  const btnEnviar = document.getElementById('btnEnviar');

  perguntaEl.addEventListener('input', () => {
    const len = perguntaEl.value.length;
    charCount.textContent = len + ' / 400';
    charCount.classList.toggle('over', len >= 380);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pergunta = perguntaEl.value.trim();
    if (pergunta.length < 5) {
      perguntaEl.focus();
      return;
    }
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';
    try {
      const res = await fetch('/api/perguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: document.getElementById('nome').value, pergunta }),
      });
      if (res.ok) {
        form.style.display = 'none';
        success.style.display = 'flex';
      }
    } catch {
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Enviar pergunta';
      alert('Erro ao enviar. Verifique sua conexão.');
    }
  });

  function resetForm() {
    form.reset();
    charCount.textContent = '0 / 400';
    form.style.display = 'block';
    success.style.display = 'none';
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar pergunta';
  }
</script>
</body>
</html>`;
}

function moderatorPage() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Moderador — Franchising Summit Brasil</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    min-height: 100dvh;
    background: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e2e8f0;
  }

  header {
    background: linear-gradient(135deg, #0a2a5e, #1B4F9B);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }

  .logo-header {
    background: white;
    border-radius: 10px;
    padding: 6px 14px;
    flex-shrink: 0;
    height: 48px;
    display: flex;
    align-items: center;
  }

  .header-info h1 {
    font-size: 1rem;
    font-weight: 800;
    color: white;
  }
  .header-info p {
    font-size: 0.78rem;
    opacity: 0.65;
    margin-top: 2px;
  }

  .header-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ws-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    opacity: 0.7;
  }
  .ws-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #94a3b8;
    transition: background 0.3s;
  }
  .ws-dot.on { background: #22c55e; box-shadow: 0 0 6px #22c55e; }

  .count-badge {
    background: rgba(255,255,255,0.12);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .tabs {
    display: flex;
    gap: 4px;
    padding: 16px 24px 0;
    border-bottom: 1px solid #1e293b;
  }
  .tab {
    padding: 10px 20px;
    border-radius: 8px 8px 0 0;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tab:hover { color: #94a3b8; background: rgba(255,255,255,0.04); }
  .tab.active {
    color: white;
    background: #1B4F9B;
  }
  .tab .badge {
    background: rgba(255,255,255,0.2);
    border-radius: 10px;
    padding: 1px 7px;
    font-size: 0.75rem;
  }
  .tab.active .badge { background: rgba(255,255,255,0.3); }

  .content {
    padding: 20px 24px;
    max-width: 900px;
  }

  .empty {
    text-align: center;
    padding: 60px 20px;
    color: #475569;
  }
  .empty-icon { font-size: 3rem; margin-bottom: 12px; }
  .empty p { font-size: 0.95rem; }

  .question-list { display: flex; flex-direction: column; gap: 14px; }

  .question-card {
    background: #1e293b;
    border-radius: 14px;
    padding: 18px 20px;
    border-left: 4px solid #334155;
    transition: all 0.25s;
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .question-card.destaque {
    border-left-color: #f59e0b;
    background: #1c1a0e;
    box-shadow: 0 0 0 1px rgba(245,158,11,0.2);
  }
  .question-card.respondida {
    border-left-color: #22c55e;
    background: #0d1f16;
    opacity: 0.65;
  }

  .q-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .q-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .q-nome {
    font-weight: 700;
    font-size: 0.9rem;
    color: #93c5fd;
  }
  .q-time {
    font-size: 0.75rem;
    color: #475569;
  }
  .q-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-destaque { background: rgba(245,158,11,0.2); color: #f59e0b; }
  .badge-respondida { background: rgba(34,197,94,0.2); color: #22c55e; }

  .q-text {
    font-size: 1rem;
    line-height: 1.6;
    color: #e2e8f0;
    margin-bottom: 14px;
  }
  .question-card.respondida .q-text { color: #64748b; }

  .q-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .btn {
    padding: 7px 14px;
    border-radius: 8px;
    border: none;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .btn:active { transform: scale(0.96); }
  .btn-destaque {
    background: rgba(245,158,11,0.15);
    color: #f59e0b;
    border: 1px solid rgba(245,158,11,0.3);
  }
  .btn-destaque:hover { background: rgba(245,158,11,0.25); }
  .btn-destaque.active { background: #f59e0b; color: #0f172a; }

  .btn-respondida {
    background: rgba(34,197,94,0.15);
    color: #22c55e;
    border: 1px solid rgba(34,197,94,0.3);
  }
  .btn-respondida:hover { background: rgba(34,197,94,0.25); }
  .btn-respondida.active { background: #22c55e; color: #0f172a; }

  .btn-pendente {
    background: rgba(148,163,184,0.1);
    color: #94a3b8;
    border: 1px solid rgba(148,163,184,0.2);
  }
  .btn-pendente:hover { background: rgba(148,163,184,0.18); }

  .btn-delete {
    background: rgba(239,68,68,0.1);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.2);
    margin-left: auto;
  }
  .btn-delete:hover { background: rgba(239,68,68,0.2); }

  .new-toast {
    position: fixed;
    top: 80px;
    right: 20px;
    background: #1B4F9B;
    color: white;
    border-radius: 12px;
    padding: 12px 20px;
    font-size: 0.88rem;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 200;
    animation: toastIn 0.3s ease, toastOut 0.3s ease 2.5s forwards;
    pointer-events: none;
  }
  @keyframes toastIn { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform:none; } }
  @keyframes toastOut { to { opacity:0; transform: translateX(20px); } }

  @media (max-width: 600px) {
    .content { padding: 16px; }
    .tabs { padding: 12px 16px 0; overflow-x: auto; }
  }
</style>
</head>
<body>

<header>
  <div class="logo-header">${ABF_LOGO_IMG}</div>
  <div class="header-info">
    <h1>Franchising Summit Brasil</h1>
    <p>Painel do Moderador</p>
  </div>
  <div class="header-right">
    <div class="ws-status">
      <span class="ws-dot" id="wsDot"></span>
      <span id="wsLabel">Conectando...</span>
    </div>
    <div class="count-badge" id="totalCount">0 perguntas</div>
  </div>
</header>

<div class="tabs">
  <button class="tab active" onclick="setTab('pendente')" id="tab-pendente">
    ⏳ Pendentes <span class="badge" id="cnt-pendente">0</span>
  </button>
  <button class="tab" onclick="setTab('destaque')" id="tab-destaque">
    ⭐ Em destaque <span class="badge" id="cnt-destaque">0</span>
  </button>
  <button class="tab" onclick="setTab('respondida')" id="tab-respondida">
    ✅ Respondidas <span class="badge" id="cnt-respondida">0</span>
  </button>
  <button class="tab" onclick="setTab('todas')" id="tab-todas">
    📋 Todas <span class="badge" id="cnt-todas">0</span>
  </button>
</div>

<div class="content">
  <div id="lista"></div>
</div>

<script>
  let perguntas = [];
  let tabAtual = 'pendente';
  let ws;

  function conectarWS() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(proto + '://' + location.host);
    ws.onopen = () => {
      document.getElementById('wsDot').classList.add('on');
      document.getElementById('wsLabel').textContent = 'Ao vivo';
    };
    ws.onclose = () => {
      document.getElementById('wsDot').classList.remove('on');
      document.getElementById('wsLabel').textContent = 'Reconectando...';
      setTimeout(conectarWS, 2000);
    };
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'init') {
        perguntas = data.perguntas;
        renderizar();
      } else if (data.type === 'nova_pergunta') {
        perguntas.unshift(data.pergunta);
        showToast('Nova pergunta de ' + data.pergunta.nome + '!');
        renderizar();
      } else if (data.type === 'atualizar_pergunta') {
        const idx = perguntas.findIndex(q => q.id === data.pergunta.id);
        if (idx !== -1) perguntas[idx] = data.pergunta;
        renderizar();
      } else if (data.type === 'remover_pergunta') {
        perguntas = perguntas.filter(q => q.id !== data.id);
        renderizar();
      }
    };
  }

  function setTab(tab) {
    tabAtual = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    renderizar();
  }

  function renderizar() {
    const pendentes = perguntas.filter(q => q.status === 'pendente');
    const destaques = perguntas.filter(q => q.status === 'destaque');
    const respondidas = perguntas.filter(q => q.status === 'respondida');

    document.getElementById('cnt-pendente').textContent = pendentes.length;
    document.getElementById('cnt-destaque').textContent = destaques.length;
    document.getElementById('cnt-respondida').textContent = respondidas.length;
    document.getElementById('cnt-todas').textContent = perguntas.length;
    document.getElementById('totalCount').textContent = perguntas.length + ' pergunta' + (perguntas.length !== 1 ? 's' : '');

    let lista;
    if (tabAtual === 'pendente') lista = pendentes;
    else if (tabAtual === 'destaque') lista = destaques;
    else if (tabAtual === 'respondida') lista = respondidas;
    else lista = [...destaques, ...pendentes, ...respondidas];

    const el = document.getElementById('lista');

    if (lista.length === 0) {
      const msgs = {
        pendente: ['⏳', 'Nenhuma pergunta pendente'],
        destaque: ['⭐', 'Nenhuma pergunta em destaque'],
        respondida: ['✅', 'Nenhuma pergunta respondida ainda'],
        todas: ['💬', 'Aguardando perguntas da audiência...'],
      };
      const [icon, msg] = msgs[tabAtual];
      el.innerHTML = \`<div class="empty"><div class="empty-icon">\${icon}</div><p>\${msg}</p></div>\`;
      return;
    }

    el.innerHTML = '<div class="question-list">' + lista.map(q => cardHTML(q)).join('') + '</div>';
  }

  function cardHTML(q) {
    const hora = new Date(q.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const badgeMap = { destaque: '<span class="q-badge badge-destaque">⭐ Destaque</span>', respondida: '<span class="q-badge badge-respondida">✅ Respondida</span>' };
    const badge = badgeMap[q.status] || '';

    const btnDestaque = q.status !== 'destaque'
      ? \`<button class="btn btn-destaque" onclick="setStatus(\${q.id},'destaque')">⭐ Destacar</button>\`
      : \`<button class="btn btn-destaque active" onclick="setStatus(\${q.id},'pendente')">⭐ Remover destaque</button>\`;

    const btnResp = q.status !== 'respondida'
      ? \`<button class="btn btn-respondida" onclick="setStatus(\${q.id},'respondida')">✅ Respondida</button>\`
      : \`<button class="btn btn-pendente" onclick="setStatus(\${q.id},'pendente')">↩ Reabrir</button>\`;

    return \`<div class="question-card \${q.status}" id="qcard-\${q.id}">
      <div class="q-header">
        <div class="q-meta">
          <span class="q-nome">👤 \${esc(q.nome)}</span>
          <span class="q-time">\${hora}</span>
          \${badge}
        </div>
      </div>
      <div class="q-text">\${esc(q.pergunta)}</div>
      <div class="q-actions">
        \${btnDestaque}
        \${btnResp}
        <button class="btn btn-delete" onclick="deletar(\${q.id})">🗑 Remover</button>
      </div>
    </div>\`;
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  async function setStatus(id, status) {
    await fetch('/api/perguntas/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  async function deletar(id) {
    if (!confirm('Remover esta pergunta?')) return;
    await fetch('/api/perguntas/' + id, { method: 'DELETE' });
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'new-toast';
    t.textContent = '🔔 ' + msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  conectarWS();
</script>
</body>
</html>`;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('\n🚀 Franchising Summit Brasil — Q&A ao vivo');
  console.log('─'.repeat(44));
  console.log('  Audiência:   http://localhost:' + PORT);
  console.log('  Moderador:   http://localhost:' + PORT + '/moderador');
  console.log('─'.repeat(44) + '\n');
});
