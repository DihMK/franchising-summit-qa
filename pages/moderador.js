import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';

export default function Moderador() {
  const [perguntas, setPerguntas] = useState([]);
  const [tab, setTab] = useState('pendente');
  const [conectado, setConectado] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);

  function loadStats() {
    fetch('/api/perguntas/stats')
      .then(r => r.json())
      .then(setStats);
  }

  useEffect(() => {
    fetch('/api/perguntas')
      .then(r => r.json())
      .then(data => setPerguntas(data || []));

    const channel = supabase
      .channel('perguntas-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'perguntas' },
        ({ new: q }) => {
          setPerguntas(prev => [q, ...prev]);
          showToast(`Nova pergunta de ${q.nome}`);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'perguntas' },
        ({ new: q }) => setPerguntas(prev => prev.map(p => p.id === q.id ? q : p)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'perguntas' },
        ({ old }) => setPerguntas(prev => prev.filter(p => p.id !== old.id)))
      .subscribe(status => setConectado(status === 'SUBSCRIBED'));

    return () => supabase.removeChannel(channel);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function setStatus(id, status) {
    await fetch(`/api/perguntas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  async function confirmarDelete() {
    if (!confirmId) return;
    await fetch(`/api/perguntas/${confirmId}`, { method: 'DELETE' });
    setConfirmId(null);
  }

  const pendentes   = perguntas.filter(q => q.status === 'pendente');
  const destaques   = perguntas.filter(q => q.status === 'destaque');
  const respondidas = perguntas.filter(q => q.status === 'respondida');

  const lista = tab === 'pendente'   ? pendentes
    : tab === 'destaque'   ? destaques
    : tab === 'respondida' ? respondidas
    : [...destaques, ...pendentes, ...respondidas];

  const emptyMsg = {
    pendente:   ['⏳', 'Nenhuma pergunta pendente'],
    destaque:   ['⭐', 'Nenhuma pergunta em destaque'],
    respondida: ['✅', 'Nenhuma pergunta respondida ainda'],
    todas:      ['💬', 'Aguardando perguntas da audiência...'],
  };

  return (
    <>
      <Head>
        <title>Moderador — Franchising Summit Brasil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          min-height: 100dvh;
          background: #080f1e;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #e2e8f0;
        }

        /* Header */
        header {
          background: rgba(10,20,50,0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .logo-header {
          background: white;
          border-radius: 10px;
          padding: 5px 14px;
          height: 40px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .logo-header img { height: 26px; width: auto; }

        .divider { width: 1px; height: 24px; background: rgba(255,255,255,0.08); }

        .header-title { font-size: 0.95rem; font-weight: 700; color: #fff; }
        .header-sub { font-size: 0.72rem; color: rgba(255,255,255,0.35); font-weight: 500; margin-top: 1px; }

        .header-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

        .live-pill {
          display: flex; align-items: center; gap: 6px;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #4ade80;
        }
        .live-pill.off { background: rgba(100,116,139,0.1); border-color: rgba(100,116,139,0.2); color: #64748b; }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
          animation: pulse 2s infinite;
        }
        .live-dot.off { background: #475569; box-shadow: none; animation: none; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .count-chip {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 0.78rem;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
        }

        /* Tabs */
        .tabs-bar {
          background: rgba(10,20,50,0.6);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 0 20px;
          display: flex;
          gap: 2px;
          overflow-x: auto;
        }
        .tab-btn {
          padding: 14px 18px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.35);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          font-family: inherit;
          margin-bottom: -1px;
        }
        .tab-btn:hover { color: rgba(255,255,255,0.65); }
        .tab-btn.active { color: #fff; border-bottom-color: #3b82f6; }
        .tab-count {
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 1px 7px;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .tab-btn.active .tab-count { background: rgba(59,130,246,0.25); color: #93c5fd; }

        /* Content */
        .content { padding: 20px; width: 100%; }

        /* Empty */
        .empty { text-align: center; padding: 80px 20px; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 12px; opacity: 0.4; }
        .empty p { font-size: 0.9rem; color: #334155; font-weight: 500; }

        /* Cards */
        .q-list { display: flex; flex-direction: column; gap: 12px; }

        .q-card {
          background: #0f1c35;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 20px;
          transition: border-color 0.2s, box-shadow 0.2s;
          animation: fadeUp 0.25s ease;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .q-card:hover { border-color: rgba(255,255,255,0.1); }

        .q-card.destaque {
          background: #1a1505;
          border-color: rgba(245,158,11,0.25);
          box-shadow: 0 0 0 1px rgba(245,158,11,0.08) inset;
        }
        .q-card.respondida {
          background: #071510;
          border-color: rgba(34,197,94,0.15);
          opacity: 0.6;
        }

        .q-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .q-nome {
          font-size: 0.82rem;
          font-weight: 700;
          color: #60a5fa;
        }
        .q-time {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.2);
          font-weight: 500;
        }
        .q-pill {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .pill-destaque { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
        .pill-respondida { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }

        .q-text {
          font-size: 0.97rem;
          line-height: 1.65;
          color: #cbd5e1;
          margin-bottom: 16px;
          font-weight: 400;
        }
        .q-card.respondida .q-text { color: #334155; }

        .q-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

        .btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 14px; border-radius: 8px; border: none;
          font-size: 0.78rem; font-weight: 600; cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .btn:active { transform: scale(0.96); }

        .btn-star {
          background: rgba(251,191,36,0.08);
          border: 1px solid rgba(251,191,36,0.2);
          color: #fbbf24;
        }
        .btn-star:hover { background: rgba(251,191,36,0.15); }
        .btn-star.on { background: rgba(251,191,36,0.2); border-color: rgba(251,191,36,0.4); }

        .btn-check {
          background: rgba(74,222,128,0.08);
          border: 1px solid rgba(74,222,128,0.2);
          color: #4ade80;
        }
        .btn-check:hover { background: rgba(74,222,128,0.14); }

        .btn-undo {
          background: rgba(148,163,184,0.06);
          border: 1px solid rgba(148,163,184,0.12);
          color: #64748b;
        }
        .btn-undo:hover { background: rgba(148,163,184,0.1); color: #94a3b8; }

        .btn-del {
          background: rgba(248,113,113,0.06);
          border: 1px solid rgba(248,113,113,0.15);
          color: #f87171;
          margin-left: auto;
        }
        .btn-del:hover { background: rgba(248,113,113,0.12); }

        /* Modal de confirmação */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 200;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 28px;
          max-width: 360px;
          width: 90%;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          animation: scaleIn 0.2s ease;
        }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        .modal-icon {
          width: 48px; height: 48px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem;
          margin-bottom: 16px;
        }
        .modal h3 { font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
        .modal p { font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
        .modal-actions { display: flex; gap: 10px; }
        .btn-cancel {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          border-radius: 10px; padding: 11px;
          font-size: 0.88rem; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .btn-cancel:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .btn-confirm-del {
          flex: 1;
          background: rgba(220,38,38,0.2);
          border: 1px solid rgba(220,38,38,0.35);
          color: #f87171;
          border-radius: 10px; padding: 11px;
          font-size: 0.88rem; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .btn-confirm-del:hover { background: rgba(220,38,38,0.3); color: #fca5a5; }

        /* Toast */
        .toast {
          position: fixed;
          top: 76px; right: 20px;
          background: #1e3a5f;
          border: 1px solid rgba(59,130,246,0.3);
          border-radius: 12px;
          padding: 12px 18px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #93c5fd;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          z-index: 300;
          animation: slideInRight 0.3s ease, fadeOut 0.3s ease 3s forwards;
          pointer-events: none;
        }
        @keyframes slideInRight { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:none} }
        @keyframes fadeOut { to{opacity:0;transform:translateX(8px)} }

        /* Dashboard */
        .dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 28px; }
        .stat-card { background: #0f1c35; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px 22px; display: flex; flex-direction: column; gap: 6px; }
        .stat-label { font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.8px; }
        .stat-value { font-size: 2.4rem; font-weight: 800; line-height: 1; }
        .stat-card.blue  { border-color: rgba(59,130,246,0.25);  } .stat-card.blue  .stat-value { color: #60a5fa; }
        .stat-card.amber { border-color: rgba(251,191,36,0.25);  } .stat-card.amber .stat-value { color: #fbbf24; }
        .stat-card.green { border-color: rgba(74,222,128,0.25);  } .stat-card.green .stat-value { color: #4ade80; }
        .stat-card.slate { border-color: rgba(148,163,184,0.12); } .stat-card.slate .stat-value { color: #94a3b8; }

        .dash-section { margin-bottom: 28px; }
        .dash-section-title { font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }

        .timeline { display: flex; flex-direction: column; gap: 8px; }
        .tl-row { display: flex; align-items: center; gap: 12px; }
        .tl-hora { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.3); width: 44px; flex-shrink: 0; }
        .tl-bar-wrap { flex: 1; background: rgba(255,255,255,0.04); border-radius: 6px; height: 22px; overflow: hidden; }
        .tl-bar { height: 100%; background: linear-gradient(90deg, #1d4ed8, #3b82f6); border-radius: 6px; min-width: 4px; }
        .tl-count { font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.4); width: 20px; text-align: right; }

        .all-list { display: flex; flex-direction: column; gap: 8px; }
        .all-item { background: #0f1c35; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 14px 16px; display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: start; }
        .all-item-nome { font-size: 0.75rem; font-weight: 700; color: #60a5fa; margin-bottom: 4px; }
        .all-item-text { font-size: 0.88rem; color: #cbd5e1; line-height: 1.5; }
        .all-item-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .all-item-hora { font-size: 0.68rem; color: rgba(255,255,255,0.2); white-space: nowrap; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot-pendente { background: #64748b; } .dot-destaque { background: #fbbf24; } .dot-respondida { background: #4ade80; }

        .dash-actions { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
        .btn-dash { display: flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 16px; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; border: 1px solid; }
        .btn-refresh { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
        .btn-refresh:hover { background: rgba(255,255,255,0.09); color: #fff; }
        .btn-export { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.2); color: #60a5fa; }
        .btn-export:hover { background: rgba(59,130,246,0.18); }
      `}</style>

      {/* Modal de confirmação */}
      {confirmId && (
        <div className="modal-overlay" onClick={() => setConfirmId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🗑</div>
            <h3>Remover pergunta?</h3>
            <p>Esta ação não pode ser desfeita. A pergunta será removida permanentemente.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button className="btn-confirm-del" onClick={confirmarDelete}>Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">🔔 {toast}</div>}

      <header>
        <div className="logo-header">
          <img src="/logo-abf.jpg" alt="ABF" />
        </div>
        <div className="divider" />
        <div>
          <div className="header-title">Franchising Summit Brasil</div>
          <div className="header-sub">Painel do Moderador</div>
        </div>
        <div className="header-right">
          <div className={`live-pill ${conectado ? '' : 'off'}`}>
            <span className={`live-dot ${conectado ? '' : 'off'}`} />
            {conectado ? 'Ao vivo' : 'Conectando'}
          </div>
          <div className="count-chip">{perguntas.length} pergunta{perguntas.length !== 1 ? 's' : ''}</div>
        </div>
      </header>

      <div className="tabs-bar">
        {[
          { key: 'pendente',   icon: '⏳', label: 'Pendentes',    count: pendentes.length },
          { key: 'destaque',   icon: '⭐', label: 'Em destaque',  count: destaques.length },
          { key: 'respondida', icon: '✅', label: 'Respondidas',  count: respondidas.length },
          { key: 'todas',      icon: '📋', label: 'Todas',        count: perguntas.length },
          { key: 'dashboard',  icon: '📊', label: 'Dashboard',     count: null },
        ].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
            {t.count !== null && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="content">

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && (() => {
          if (!stats) {
            loadStats();
            return <div className="empty"><div className="empty-icon">📊</div><p>Carregando dados...</p></div>;
          }
          const horas = Object.entries(stats.porHora).sort((a,b) => a[0].localeCompare(b[0]));
          const maxH  = Math.max(...horas.map(h => h[1]), 1);
          function exportCSV() {
            const rows = [['ID','Nome','Pergunta','Status','Horário'], ...stats.todas.map(q => [q.id, q.nome, `"${q.pergunta.replace(/"/g,'""')}"`, q.status, new Date(q.created_at).toLocaleString('pt-BR')])];
            const csv  = rows.map(r => r.join(',')).join('\n');
            const a    = document.createElement('a');
            a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
            a.download = 'perguntas-summit.csv';
            a.click();
          }
          return <>
            <div className="dash-actions">
              <button className="btn-dash btn-refresh" onClick={loadStats}>↻ Atualizar</button>
              <button className="btn-dash btn-export"  onClick={exportCSV}>⬇ Exportar CSV</button>
            </div>

            <div className="dash-grid">
              <div className="stat-card blue">  <span className="stat-label">Total</span>       <span className="stat-value">{stats.total}</span></div>
              <div className="stat-card slate"> <span className="stat-label">Pendentes</span>   <span className="stat-value">{stats.pendentes}</span></div>
              <div className="stat-card amber"> <span className="stat-label">Em destaque</span> <span className="stat-value">{stats.destaque}</span></div>
              <div className="stat-card green"> <span className="stat-label">Respondidas</span> <span className="stat-value">{stats.respondidas}</span></div>
            </div>

            {horas.length > 0 && (
              <div className="dash-section">
                <div className="dash-section-title">Perguntas por horário</div>
                <div className="timeline">
                  {horas.map(([h, n]) => (
                    <div key={h} className="tl-row">
                      <span className="tl-hora">{h}</span>
                      <div className="tl-bar-wrap"><div className="tl-bar" style={{width: `${(n/maxH)*100}%`}}/></div>
                      <span className="tl-count">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="dash-section">
              <div className="dash-section-title">Todas as perguntas ({stats.total})</div>
              <div className="all-list">
                {stats.todas.map(q => (
                  <div key={q.id} className="all-item">
                    <div>
                      <div className="all-item-nome">👤 {q.nome}</div>
                      <div className="all-item-text">{q.pergunta}</div>
                    </div>
                    <div className="all-item-meta">
                      <span className="all-item-hora">{new Date(q.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                      <span className={`status-dot dot-${q.status}`} title={q.status}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>;
        })()}

        {tab !== 'dashboard' && lista.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{emptyMsg[tab][0]}</div>
            <p>{emptyMsg[tab][1]}</p>
          </div>
        ) : (
          <div className="q-list">
            {lista.map(q => {
              const hora = new Date(q.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={q.id} className={`q-card ${q.status}`}>
                  <div className="q-meta">
                    <span className="q-nome">👤 {q.nome}</span>
                    <span className="q-time">{hora}</span>
                    {q.status === 'destaque'   && <span className="q-pill pill-destaque">⭐ Destaque</span>}
                    {q.status === 'respondida' && <span className="q-pill pill-respondida">✅ Respondida</span>}
                  </div>

                  <div className="q-text">{q.pergunta}</div>

                  <div className="q-actions">
                    {q.status !== 'destaque'
                      ? <button className="btn btn-star" onClick={() => setStatus(q.id, 'destaque')}>⭐ Destacar</button>
                      : <button className="btn btn-star on" onClick={() => setStatus(q.id, 'pendente')}>✕ Remover destaque</button>
                    }
                    {q.status !== 'respondida'
                      ? <button className="btn btn-check" onClick={() => setStatus(q.id, 'respondida')}>✅ Respondida</button>
                      : <button className="btn btn-undo" onClick={() => setStatus(q.id, 'pendente')}>↩ Reabrir</button>
                    }
                    <button className="btn btn-del" onClick={() => setConfirmId(q.id)}>🗑 Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
