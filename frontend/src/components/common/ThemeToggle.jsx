import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full text-cp-text/70 hover:text-teal-400 hover:bg-cp-bg/50 transition-all ${className}`}
      title={isDark ? "라이트모드로 전환" : "다크모드로 전환"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export default ThemeToggle;
