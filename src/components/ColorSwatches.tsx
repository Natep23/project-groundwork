/* Flagging-tape palette: the colors a surveyor actually ties to stakes. */
export const FLAG_COLORS = [
  { value: "#e8622c", name: "Orange" },
  { value: "#2456a6", name: "Blue" },
  { value: "#3e7c4f", name: "Green" },
  { value: "#ffc400", name: "Yellow" },
  { value: "#d94f8e", name: "Pink" },
  { value: "#6b4fd9", name: "Purple" },
] as const;

export const DEFAULT_FLAG = FLAG_COLORS[0].value;

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorSwatches({ value, onChange }: Props) {
  const isPreset = FLAG_COLORS.some((c) => c.value === value);

  return (
    <div className="swatches" role="group" aria-label="Card color">
      {FLAG_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          className="swatch"
          style={{ background: c.value }}
          aria-pressed={value === c.value}
          aria-label={c.name}
          title={c.name}
          onClick={() => onChange(c.value)}
        />
      ))}
      <span
        className="swatch swatch--custom"
        style={!isPreset ? { boxShadow: "0 0 0 2px var(--bg), 0 0 0 4px var(--accent)", borderColor: "var(--ink)" } : undefined}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Custom color"
          title="Custom color"
        />
      </span>
    </div>
  );
}
