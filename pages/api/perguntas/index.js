import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const db = supabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('perguntas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { nome, pergunta } = req.body;
    if (!pergunta || pergunta.trim().length < 5)
      return res.status(400).json({ error: 'Pergunta muito curta' });
    const { data, error } = await db
      .from('perguntas')
      .insert({ nome: nome?.trim() || 'Anônimo', pergunta: pergunta.trim() })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.status(405).end();
}
