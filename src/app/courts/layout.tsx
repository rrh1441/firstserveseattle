// src/app/courts/layout.tsx
import React from 'react';

export default function CourtsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout inherits <html>, <head>, <body>, global styles, etc.
  // from src/app/layout.tsx.
  // It just needs to render its children.
  return <>{children}</>;
}