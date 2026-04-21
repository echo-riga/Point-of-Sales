// components/ColorPicker.tsx
import { View, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";

// ── Palettes ──────────────────────────────────────────────────────────────────
// Each entry: { bg, text, border }
// bg   = the card/chip background
// text = label color on top of bg
// border = border / accent

export const CATEGORY_PALETTE: { bg: string; text: string; border: string }[] = [
  { bg: "#16a34a", text: "#ffffff", border: "#15803d" },
  { bg: "#2563eb", text: "#ffffff", border: "#1d4ed8" },
  { bg: "#dc2626", text: "#ffffff", border: "#b91c1c" },
  { bg: "#d97706", text: "#ffffff", border: "#b45309" },
  { bg: "#7c3aed", text: "#ffffff", border: "#6d28d9" },
  { bg: "#0891b2", text: "#ffffff", border: "#0e7490" },
  { bg: "#db2777", text: "#ffffff", border: "#be185d" },
  { bg: "#65a30d", text: "#ffffff", border: "#4d7c0f" },
  { bg: "#ea580c", text: "#ffffff", border: "#c2410c" },
  { bg: "#0f766e", text: "#ffffff", border: "#0d9488" },
  { bg: "#4f46e5", text: "#ffffff", border: "#4338ca" },
  { bg: "#be123c", text: "#ffffff", border: "#9f1239" },
];

export const SUBCATEGORY_PALETTE: { bg: string; text: string; border: string }[] = [
  { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
  { bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" },
  { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
  { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  { bg: "#ede9fe", text: "#4c1d95", border: "#ddd6fe" },
  { bg: "#cffafe", text: "#164e63", border: "#a5f3fc" },
  { bg: "#fee2e2", text: "#7f1d1d", border: "#fecaca" },
  { bg: "#ecfccb", text: "#365314", border: "#d9f99d" },
  { bg: "#ffedd5", text: "#7c2d12", border: "#fed7aa" },
  { bg: "#ccfbf1", text: "#134e4a", border: "#99f6e4" },
  { bg: "#e0e7ff", text: "#1e1b4b", border: "#c7d2fe" },
  { bg: "#ffe4e6", text: "#881337", border: "#fda4af" },
];

export const ITEM_PALETTE: { bg: string; text: string; border: string }[] = [
  { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  { bg: "#fef9c3", text: "#854d0e", border: "#fde68a" },
  { bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff" },
  { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
  { bg: "#fdf2f8", text: "#9d174d", border: "#fbcfe8" },
  { bg: "#f7fee7", text: "#3f6212", border: "#d9f99d" },
  { bg: "#fefce8", text: "#713f12", border: "#fef08a" },
  { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" },
  { bg: "#eef2ff", text: "#3730a3", border: "#c7d2fe" },
  { bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
];

export type ColorEntry = { bg: string; text: string; border: string };

// Given a stored bg hex, find the full entry from a palette (fallback to first)
export function resolveColor(bg: string, palette: ColorEntry[]): ColorEntry {
  return palette.find((c) => c.bg === bg) ?? palette[0];
}

// ── Component ─────────────────────────────────────────────────────────────────
interface ColorPickerProps {
  label?: string;
  palette: ColorEntry[];
  value: string; // currently selected bg hex
  onChange: (bg: string) => void;
}

export default function ColorPicker({
  label = "Color",
  palette,
  value,
  onChange,
}: ColorPickerProps) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600", letterSpacing: 0.5 }}>
          {label.toUpperCase()}
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
          {palette.map((entry) => {
            const selected = entry.bg === value;
            return (
              <TouchableOpacity
                key={entry.bg}
                onPress={() => onChange(entry.bg)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: entry.bg,
                  borderWidth: selected ? 3 : 1.5,
                  borderColor: selected ? "#111827" : entry.border,
                  alignItems: "center",
                  justifyContent: "center",
                  elevation: selected ? 4 : 1,
                }}
              >
                {selected && (
                  <Text style={{ color: entry.text, fontSize: 16, fontWeight: "bold" }}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}