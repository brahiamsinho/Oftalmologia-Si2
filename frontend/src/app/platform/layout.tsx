export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  /** Login conserva su propio fondo oscuro en la página; el dashboard usa layout propio (gray-50). */
  return children;
}
