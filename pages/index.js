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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          min-height: 100dvh;
          background: #0c1f4a;
          font-family: 'Inter', -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 40px;
          position: relative;
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(37,99,235,0.35) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(29,78,216,0.25) 0%, transparent 60%);
          pointer-events: none;
        }

        .logo-center { text-align: center; width: 100%; margin-bottom: 24px; }
        .logo-wrap {
          background: white;
          border-radius: 14px;
          padding: 10px 24px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.35);
          display: inline-flex;
          align-items: center;
        }
        .logo-wrap img { height: 34px; width: auto; display: block; }

        .event-name {
          font-size: clamp(1.15rem, 5vw, 1.5rem);
          font-weight: 800;
          color: #fff;
          text-align: center;
          margin-bottom: 6px;
          letter-spacing: -0.4px;
        }
        .event-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.5);
          text-align: center;
          margin-bottom: 32px;
          font-weight: 500;
        }

        .card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px 28px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.4);
        }

        .card-title {
          font-size: 1rem;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-title span { font-size: 1.1rem; }

        label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255,255,255,0.45);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        input, textarea {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 0.95rem;
          font-family: inherit;
          color: #fff;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, textarea:focus {
          border-color: rgba(99,148,255,0.6);
          background: rgba(255,255,255,0.09);
        }

        .field { margin-bottom: 20px; }
        textarea { min-height: 130px; resize: none; line-height: 1.6; }

        .char-row { display: flex; justify-content: flex-end; margin-top: 6px; }
        .char-count { font-size: 0.72rem; color: rgba(255,255,255,0.3); font-weight: 500; }
        .char-over { color: #f87171; }

        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 15px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.2px;
          box-shadow: 0 4px 20px rgba(37,99,235,0.4);
          font-family: inherit;
        }
        .btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 6px 28px rgba(37,99,235,0.55);
          transform: translateY(-1px);
        }
        .btn-submit:active:not(:disabled) { transform: scale(0.98); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Success */
        .success {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 8px 0;
        }
        .success-ring {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2));
          border: 2px solid rgba(34,197,94,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem;
          margin-bottom: 20px;
          box-shadow: 0 0 32px rgba(34,197,94,0.2);
        }
        .success h3 { font-size: 1.2rem; font-weight: 800; color: #fff; margin-bottom: 8px; }
        .success p { color: rgba(255,255,255,0.5); font-size: 0.9rem; line-height: 1.6; margin-bottom: 24px; }
        .btn-nova {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8);
          border-radius: 10px;
          padding: 12px 28px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .btn-nova:hover { background: rgba(255,255,255,0.12); color: #fff; }

        .footer {
          margin-top: 28px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.2);
          font-weight: 500;
          letter-spacing: 0.5px;
        }
      `}</style>

      <div className="logo-center">
        <div className="logo-wrap">
          <img src="/logo-abf.jpg" alt="ABF" />
        </div>
      </div>

      <p className="event-name">Franchising Summit Brasil</p>
      <p className="event-sub">Envie sua pergunta para o palestrante</p>

      <div className="card">
        <p className="card-title"><span>💬</span> Fazer uma pergunta</p>

        {!enviado ? (
          <form onSubmit={enviar}>
            <div className="field">
              <label htmlFor="nome">Seu nome (opcional)</label>
              <input
                id="nome" type="text" placeholder="Ex: João Silva"
                maxLength={60} value={nome} onChange={e => setNome(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="field">
              <label htmlFor="pergunta">Sua pergunta *</label>
              <textarea
                id="pergunta"
                placeholder="O que você quer perguntar ao palestrante?"
                maxLength={400} required value={pergunta}
                onChange={e => setPergunta(e.target.value)}
              />
              <div className="char-row">
                <span className={`char-count ${pergunta.length >= 380 ? 'char-over' : ''}`}>
                  {pergunta.length}/400
                </span>
              </div>
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar pergunta →'}
            </button>
          </form>
        ) : (
          <div className="success">
            <div className="success-ring">✓</div>
            <h3>Pergunta enviada!</h3>
            <p>Sua pergunta foi recebida pelo moderador.<br />Fique atento durante a sessão de Q&A.</p>
            <button className="btn-nova" onClick={resetar}>+ Enviar outra pergunta</button>
          </div>
        )}
      </div>

      <p className="footer">FRANCHISING SUMMIT BRASIL · ABF</p>
    </>
  );
}
