import { Authenticated } from "convex/react";
import { UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { THEMES, useTheme, ThemeId } from "../lib/theme";

function sheetLabel(pathname: string): string {
  if (pathname === "/create-card") return "S-02 · NEW CARD";
  if (pathname.startsWith("/card/")) return "S-03 · CARD DETAIL";
  return "S-01 · BOARD";
}

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <header className="titleblock">
      <div className="titleblock__cell">
        <span className="eyebrow">Project</span>
        <Link to="/" className="wordmark">
          Ground<span>Work</span>
        </Link>
      </div>
      <div className="titleblock__cell titleblock__cell--sheet">
        <span className="eyebrow">Sheet</span>
        <span className="titleblock__value">{sheetLabel(pathname)}</span>
      </div>
      <div className="titleblock__cell titleblock__cell--date">
        <span className="eyebrow">Date</span>
        <span className="titleblock__value">{today}</span>
      </div>
      <div className="titleblock__cell titleblock__cell--grow" aria-hidden="true" />
      <div className="titleblock__cell">
        <label className="eyebrow" htmlFor="theme-select">
          Print
        </label>
        <select
          id="theme-select"
          className="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeId)}
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <Authenticated>
        <div className="titleblock__cell titleblock__cell--end">
          <UserButton />
        </div>
      </Authenticated>
    </header>
  );
};
