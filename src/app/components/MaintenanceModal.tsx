import { createClient } from '@supabase/supabase-js';

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

  const isEnabled = data?.value?.enabled ?? false;

  if (!isEnabled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-lg">
        <h2 className="text-lg font-semibold text-emerald-800">
          We&apos;re building a new experience!
        </h2>
        <p className="mt-2 text-emerald-700">
          Check back tomorrow to see available courts.
        </p>
        <p className="mt-4 text-sm text-gray-600">
          Need help? Email{' '}
          <a href="mailto:support@firstserveseattle.com" className="text-emerald-600 underline">
            support@firstserveseattle.com
          </a>
        </p>
      </div>
    </div>
  );
}
