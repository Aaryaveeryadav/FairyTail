import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('us-theme') as Theme | null;

    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.classList.toggle(
        'dark',
        savedTheme === 'dark'
      );
      return;
    }

    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    const initialTheme: Theme = prefersDark ? 'dark' : 'light';

    setTheme(initialTheme);

    document.documentElement.classList.toggle(
      'dark',
      initialTheme === 'dark'
    );
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme =
      theme === 'light' ? 'dark' : 'light';

    setTheme(nextTheme);

    localStorage.setItem('us-theme', nextTheme);

    document.documentElement.classList.toggle(
      'dark',
      nextTheme === 'dark'
    );
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === 'light'
          ? 'Switch to dark mode'
          : 'Switch to light mode'
      }
      title={
        theme === 'light'
          ? 'Switch to dark mode'
          : 'Switch to light mode'
      }
      className="
        relative
        w-10
        h-10
        rounded-xl
        flex
        items-center
        justify-center
        overflow-hidden
        border
        border-cream-300
        dark:border-white/10
        bg-white/70
        dark:bg-white/[0.06]
        backdrop-blur-md
        text-ink-600
        dark:text-gray-300
        hover:bg-white
        dark:hover:bg-white/[0.12]
        hover:text-rose-500
        dark:hover:text-rose-300
        transition-all
        duration-300
        shadow-sm
        dark:shadow-black/20
      "
    >
      <span
        className={`
          absolute
          inset-0
          rounded-xl
          bg-rose-400/10
          transition-transform
          duration-500
          ${
            theme === 'dark'
              ? 'scale-100'
              : 'scale-0'
          }
        `}
      />

      <Sun
        className={`
          absolute
          w-[18px]
          h-[18px]
          transition-all
          duration-500
          ${
            theme === 'light'
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-0 opacity-0'
          }
        `}
      />

      <Moon
        className={`
          absolute
          w-[18px]
          h-[18px]
          transition-all
          duration-500
          ${
            theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
          }
        `}
      />
    </button>
  );
}