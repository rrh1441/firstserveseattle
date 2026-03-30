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
      <DialogContent className="sm:max-w-md border-orange-200 bg-orange-50">
        <DialogHeader>
          <DialogTitle className="text-orange-800">
            Data Temporarily Unavailable
          </DialogTitle>
          <DialogDescription className="text-orange-700">
            Our court availability data is being refreshed. Please check back in a few hours for updated information.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
