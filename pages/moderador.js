import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';

export default function Moderador() {
  const [perguntas, setPerguntas] = useState([]);
  const [tab, setTab] = useState('pendente');
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    fetch('/api/perguntas')
      .then(r => r.json())
      .then(data => setPerguntas(data || []));

    const channel = supabase
      .channel('perguntas-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'perguntas' },
        ({ new: q }) => setPerguntas(prev => [q, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'perguntas' },
        ({ new: q }) => setPerguntas(prev => prev.map(p => p.id === q.id ? q : p)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'perguntas' },
        ({ old }) => setPerguntas(prev => prev.filter(p => p.id !== old.id)))
      .subscribe(status => setConectado(status === 'SUBSCRIBED'));

    return () => supabase.removeChannel(channel);
  }, []);

  async function setStatus(id, status) {
    await fetch(`/api/perguntas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  async function deletar(id) {
    if (!confirm('Remover esta pergunta?')) return;
    await fetch(`/api/perguntas/${id}`, { method: 'DELETE' });
  }

  const pendentes   = perguntas.filter(q => q.status === 'pendente');
  const destaques   = perguntas.filter(q => q.status === 'destaque');
  const respondidas = perguntas.filter(q => q.status === 'respondida');

  const lista = tab === 'pendente' ? pendentes
    : tab === 'destaque' ? destaques
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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { min-height: 100dvh; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e2e8f0; }
        header {
          background: linear-gradient(135deg,#0a2a5e,#1B4F9B); padding: 16px 24px;
          display: flex; align-items: center; gap: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .logo-header {
          background: white; border-radius: 10px; padding: 6px 14px;
          flex-shrink: 0; height: 48px; display: flex; align-items: center;
        }
        .logo-header img { height: 32px; width: auto; }
        .header-info h1 { font-size: 1rem; font-weight: 800; color: white; }
        .header-info p { font-size: 0.78rem; opacity: 0.65; margin-top: 2px; }
        .header-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
        .ws-status { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; opacity: 0.7; }
        .ws-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; transition: background 0.3s; }
        .ws-dot.on { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
        .count-badge { background: rgba(255,255,255,0.12); border-radius: 20px; padding: 4px 12px; font-size: 0.82rem; font-weight: 700; }
        .tabs { display: flex; gap: 4px; padding: 16px 24px 0; border-bottom: 1px solid #1e293b; }
        .tab {
          padding: 10px 20px; border-radius: 8px 8px 0 0; border: none;
          background: transparent; color: #64748b; font-size: 0.88rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;
        }
        .tab:hover { color: #94a3b8; background: rgba(255,255,255,0.04); }
        .tab.active { color: white; background: #1B4F9B; }
        .tab .badge { background: rgba(255,255,255,0.2); border-radius: 10px; padding: 1px 7px; font-size: 0.75rem; }
        .tab.active .badge { background: rgba(255,255,255,0.3); }
        .content { padding: 20px 24px; max-width: 900px; }
        .empty { text-align: center; padding: 60px 20px; color: #475569; }
        .empty-icon { font-size: 3rem; margin-bottom: 12px; }
        .question-list { display: flex; flex-direction: column; gap: 14px; }
        .question-card {
          background: #1e293b; border-radius: 14px; padding: 18px 20px;
          border-left: 4px solid #334155; animation: slideIn 0.3s ease;
        }
        @keyframes slideIn { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform: translateY(0); } }
        .question-card.destaque { border-left-color: #f59e0b; background: #1c1a0e; box-shadow: 0 0 0 1px rgba(245,158,11,0.2); }
        .question-card.respondida { border-left-color: #22c55e; background: #0d1f16; opacity: 0.65; }
        .q-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .q-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .q-nome { font-weight: 700; font-size: 0.9rem; color: #93c5fd; }
        .q-time { font-size: 0.75rem; color: #475569; }
        .q-badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge-destaque { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .badge-respondida { background: rgba(34,197,94,0.2); color: #22c55e; }
        .q-text { font-size: 1rem; line-height: 1.6; color: #e2e8f0; margin-bottom: 14px; }
        .question-card.respondida .q-text { color: #64748b; }
        .q-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn { padding: 7px 14px; border-radius: 8px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 5px; }
        .btn:active { transform: scale(0.96); }
        .btn-destaque { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
        .btn-destaque:hover { background: rgba(245,158,11,0.25); }
        .btn-destaque.active { background: #f59e0b; color: #0f172a; }
        .btn-respondida { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
        .btn-respondida:hover { background: rgba(34,197,94,0.25); }
        .btn-respondida.active { background: #22c55e; color: #0f172a; }
        .btn-pendente { background: rgba(148,163,184,0.1); color: #94a3b8; border: 1px solid rgba(148,163,184,0.2); }
        .btn-pendente:hover { background: rgba(148,163,184,0.18); }
        .btn-delete { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); margin-left: auto; }
        .btn-delete:hover { background: rgba(239,68,68,0.2); }
        @media (max-width:600px) { .content { padding: 16px; } .tabs { padding: 12px 16px 0; overflow-x: auto; } }
      `}</style>

      <header>
        <div className="logo-header">
          <img src="/logo-abf.jpg" alt="ABF" />
        </div>
        <div className="header-info">
          <h1>Franchising Summit Brasil</h1>
          <p>Painel do Moderador</p>
        </div>
        <div className="header-right">
          <div className="ws-status">
            <span className={`ws-dot ${conectado ? 'on' : ''}`} />
            <span>{conectado ? 'Ao vivo' : 'Conectando...'}</span>
          </div>
          <div className="count-badge">{perguntas.length} pergunta{perguntas.length !== 1 ? 's' : ''}</div>
        </div>
      </header>

      <div className="tabs">
        {[
          { key: 'pendente',   label: '⏳ Pendentes',    count: pendentes.length },
          { key: 'destaque',   label: '⭐ Em destaque',  count: destaques.length },
          { key: 'respondida', label: '✅ Respondidas',  count: respondidas.length },
          { key: 'todas',      label: '📋 Todas',        count: perguntas.length },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} <span className="badge">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="content">
        {lista.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{emptyMsg[tab][0]}</div>
            <p>{emptyMsg[tab][1]}</p>
          </div>
        ) : (
          <div className="question-list">
            {lista.map(q => {
              const hora = new Date(q.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={q.id} className={`question-card ${q.status}`}>
                  <div className="q-header">
                    <div className="q-meta">
                      <span className="q-nome">👤 {q.nome}</span>
                      <span className="q-time">{hora}</span>
                      {q.status === 'destaque'   && <span className="q-badge badge-destaque">⭐ Destaque</span>}
                      {q.status === 'respondida' && <span className="q-badge badge-respondida">✅ Respondida</span>}
                    </div>
                  </div>
                  <div className="q-text">{q.pergunta}</div>
                  <div className="q-actions">
                    {q.status !== 'destaque'
                      ? <button className="btn btn-destaque" onClick={() => setStatus(q.id, 'destaque')}>⭐ Destacar</button>
                      : <button className="btn btn-destaque active" onClick={() => setStatus(q.id, 'pendente')}>⭐ Remover destaque</button>}
                    {q.status !== 'respondida'
                      ? <button className="btn btn-respondida" onClick={() => setStatus(q.id, 'respondida')}>✅ Respondida</button>
                      : <button className="btn btn-pendente" onClick={() => setStatus(q.id, 'pendente')}>↩ Reabrir</button>}
                    <button className="btn btn-delete" onClick={() => deletar(q.id)}>🗑 Remover</button>
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
