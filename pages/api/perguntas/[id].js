import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const db = supabaseAdmin();
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { status } = req.body;
    const { error } = await db
      .from('perguntas')
      .update({ status })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { error } = await db.from('perguntas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
