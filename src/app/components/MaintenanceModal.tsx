import { createClient } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function MaintenanceModal() {
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single();

  const isStale = data?.value?.enabled ?? false;

  if (!isStale) return null;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md border-emerald-200 bg-emerald-50">
        <DialogHeader>
          <DialogTitle className="text-emerald-800">
            We&apos;re building a new experience!
          </DialogTitle>
          <DialogDescription className="text-emerald-700">
            Check back tomorrow to see available courts.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
