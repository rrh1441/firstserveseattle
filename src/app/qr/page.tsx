// src/app/qr/page.tsx
import { redirect } from 'next/navigation';

export default function QrRedirectPage() {
  // Redirects server-side to your homepage ('/') before rendering anything.
  redirect('/');

  // This part typically won't be reached or rendered because the redirect happens first.
  // Returning null is standard practice here.
  return null;
}