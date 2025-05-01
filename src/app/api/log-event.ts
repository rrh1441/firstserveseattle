// pages/api/log-event.ts
import { supabase } from '@/lib/supabase'; // or wherever your client lives

export default async function handler(req, res) {
  const { event, metadata, timestamp } = JSON.parse(req.body);

  const { error } = await supabase
    .from('event_logs')
    .insert([{ event, metadata, timestamp }]);

  if (error) return res.status(500).json({ error });
  res.status(200).json({ status: 'ok' });
}
