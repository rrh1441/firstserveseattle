/** @file /q/<slug> — record scan then redirect immediately */
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // server-side key
);

export const dynamic = "force-dynamic";    // always run on the server

export default async function QRRedirect({
  params
}: {
  params: { slug: string };
}) {
  /* 1 ─ look up facility id (to keep table normalised) */
  const { data: facility } = await supabase
    .from("tennis_facilities")
    .select("id")
    .eq("slug", params.slug)
    .single();

  /* 2 ─ insert scan record (ignore errors so redirect is never blocked) */
  if (facility) {
    const hdr  = headers();
    await supabase
      .from("qr_scans")
      .insert({
        facility_id: facility.id,
        user_agent : hdr.get("user-agent") ?? null,
        referer    : hdr.get("referer") ?? null
      })
      .throwOnError();          // remove this call if you’d rather swallow errors
  }

  /* 3 ─ redirect user */
  redirect("https://firstserveseattle.com");
}