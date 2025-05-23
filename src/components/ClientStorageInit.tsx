'use client';
import { initLocalStorage } from '@/lib/initLocalStorage';

export default function ClientStorageInit() {
  initLocalStorage();          // runs once per page load
  return null;
}