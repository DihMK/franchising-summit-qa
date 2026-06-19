import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const db = supabaseAdmin();

  const { data, error } = await db
    .from('perguntas')
    .select('id, nome, pergunta, status, created_at')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const total      = data.length;
  const pendentes  = data.filter(q => q.status === 'pendente').length;
  const destaque   = data.filter(q => q.status === 'destaque').length;
  const respondidas = data.filter(q => q.status === 'respondida').length;

  // Agrupa por hora
  const porHora = {};
  data.forEach(q => {
    const h = new Date(q.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).slice(0, 5);
    porHora[h] = (porHora[h] || 0) + 1;
  });

  res.json({ total, pendentes, destaque, respondidas, porHora, todas: data });
}
