import { useState } from 'react';
import Head from 'next/head';

export default function Audiencia() {
  const [nome, setNome] = useState('');
  const [pergunta, setPergunta] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (pergunta.trim().length < 5) return;
    setLoading(true);
    try {
      const res = await fetch('/api/perguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, pergunta }),
      });
      if (res.ok) setEnviado(true);
    } finally {
      setLoading(false);
    }
  }

  function resetar() {
    setNome('');
    setPergunta('');
    setEnviado(false);
  }

  return (
    <>
      <Head>
        <title>Perguntas ao Vivo — Franchising Summit Brasil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          min-height: 100dvh;
          background: linear-gradient(160deg, #0a2a5e 0%, #1B4F9B 45%, #2d6fd4 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex; flex-direction: column; align-items: center;
          padding: 32px 16px 48px; color: #fff;
        }
        .logo-wrap {
          background: white; border-radius: 16px; padding: 12px 28px;
          margin-bottom: 28px; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          height: 72px; display: flex; align-items: center;
        }
        .logo-wrap img { height: 44px; width: auto; display: block; }
        h1 { font-size: clamp(1.2rem,5vw,1.7rem); font-weight: 800; text-align: center; margin-bottom: 6px; }
        .subtitle { font-size: 0.95rem; opacity: 0.82; text-align: center; margin-bottom: 32px; }
        .card {
          background: white; border-radius: 20px; padding: 28px 24px;
          width: 100%; max-width: 480px; box-shadow: 0 16px 48px rgba(0,0,0,0.22);
        }
        .card h2 { font-size: 1.1rem; color: #1B4F9B; font-weight: 700; margin-bottom: 20px; }
        label { display: block; font-size: 0.82rem; font-weight: 600; color: #4a5568;
          margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        input, textarea {
          width: 100%; border: 2px solid #e2e8f0; border-radius: 12px;
          padding: 14px 16px; font-size: 1rem; font-family: inherit;
          color: #1a202c; transition: border-color 0.2s; outline: none; background: #f8fafc;
        }
        input:focus, textarea:focus { border-color: #1B4F9B; background: white; }
        .field { margin-bottom: 18px; }
        textarea { min-height: 120px; resize: vertical; line-height: 1.5; }
        .char-count { text-align: right; font-size: 0.78rem; color: #94a3b8; margin-top: 4px; }
        .char-over { color: #e53e3e; }
        button[type="submit"] {
          width: 100%; background: linear-gradient(135deg,#1B4F9B,#2d6fd4);
          color: white; border: none; border-radius: 12px; padding: 16px;
          font-size: 1.05rem; font-weight: 700; cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        button[type="submit"]:hover { opacity: 0.92; }
        button[type="submit"]:active { transform: scale(0.98); }
        button[type="submit"]:disabled { opacity: 0.5; cursor: not-allowed; }
        .success { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 12px 0 4px; }
        .success-icon {
          width: 64px; height: 64px; background: linear-gradient(135deg,#1B4F9B,#2d6fd4);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 2rem; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(27,79,155,0.35);
        }
        .success h3 { font-size: 1.2rem; color: #1B4F9B; font-weight: 800; margin-bottom: 8px; }
        .success p { color: #64748b; font-size: 0.95rem; margin-bottom: 20px; }
        .btn-nova {
          background: none; border: 2px solid #1B4F9B; color: #1B4F9B;
          border-radius: 10px; padding: 12px 28px; font-size: 0.95rem;
          font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .btn-nova:hover { background: #1B4F9B; color: white; }
        .footer { margin-top: 28px; font-size: 0.8rem; opacity: 0.55; text-align: center; }
      `}</style>

      <div className="logo-wrap">
        <img src="/logo-abf.jpg" alt="ABF" />
      </div>

      <h1>Franchising Summit Brasil</h1>
      <p className="subtitle">Envie sua pergunta para o palestrante</p>

      <div className="card">
        <h2>💬 Fazer uma pergunta</h2>

        {!enviado ? (
          <form onSubmit={enviar}>
            <div className="field">
              <label htmlFor="nome">Seu nome (opcional)</label>
              <input
                id="nome" type="text" placeholder="Ex: João Silva"
                maxLength={60} value={nome} onChange={e => setNome(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="pergunta">Sua pergunta *</label>
              <textarea
                id="pergunta" placeholder="Digite sua pergunta aqui..."
                maxLength={400} required value={pergunta}
                onChange={e => setPergunta(e.target.value)}
              />
              <div className={`char-count ${pergunta.length >= 380 ? 'char-over' : ''}`}>
                {pergunta.length} / 400
              </div>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar pergunta'}
            </button>
          </form>
        ) : (
          <div className="success">
            <div className="success-icon">✓</div>
            <h3>Pergunta enviada!</h3>
            <p>Sua pergunta foi recebida pelo moderador.<br />Fique atento durante a sessão de Q&A.</p>
            <button className="btn-nova" onClick={resetar}>Enviar outra pergunta</button>
          </div>
        )}
      </div>

      <div className="footer">Franchising Summit Brasil · ABF</div>
    </>
  );
}
