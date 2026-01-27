import { useEffect, useState } from 'react';
// ✅ Optimized WebP images (-97% file size)
import logoDark from '@/assets/lele-hcm-logo-dark.webp';
import logoLight from '@/assets/lele-hcm-logo-light.webp';

interface ThemeLogoProps {
  className?: string;
  alt?: string;
}

export function ThemeLogo({ className = "", alt = "LELE HCM Logo" }: ThemeLogoProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <img 
      src={theme === "dark" ? logoDark : logoLight} 
      alt={alt}
      className={className}
    />
  );
}
