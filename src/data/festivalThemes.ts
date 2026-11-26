/**
 * Per-festival site themes. The UI reads these through CSS variables
 * (--ac .. --ac5 for accents, --bg0..--bg2 for the page backdrop), so picking
 * a festival re-colours the whole board.
 */
export interface FestivalTheme {
  /** primary accent (buttons, highlights) */
  ac: string;
  /** secondary metallic / border accent */
  ac2: string;
  /** warm tertiary (links, hashtags) */
  ac3: string;
  /** light tint (eyebrow text, glints) */
  ac4: string;
  /** pop colour (gradients, hearts) */
  ac5: string;
  /** page backdrop: top, middle, bottom */
  bg0: string;
  bg1: string;
  bg2: string;
}

const T = (
  ac: string,
  ac2: string,
  ac3: string,
  ac4: string,
  ac5: string,
  bg0: string,
  bg1: string,
  bg2: string
): FestivalTheme => ({ ac, ac2, ac3, ac4, ac5, bg0, bg1, bg2 });

export const DEFAULT_THEME: FestivalTheme = T(
  "#F28C38", "#D4AF37", "#F5B041", "#FFE7A3", "#FF7EB6",
  "#080D1A", "#0E162B", "#131126"
);

export const FESTIVAL_THEMES: Record<string, FestivalTheme> = {
  Diwali: DEFAULT_THEME,
  Holi: T("#EC4899", "#22D3EE", "#FACC15", "#FFE4F1", "#A855F7", "#14071F", "#240B33", "#0B0A1E"),
  Navratri: T("#F97316", "#E11D48", "#FBBF24", "#FFE9C2", "#D946EF", "#1A0A12", "#2E0F24", "#12081A"),
  "Durga Puja": T("#DC2626", "#F5C542", "#F59E0B", "#FFE6C7", "#F472B6", "#190808", "#2C0E0E", "#120709"),
  "Ganesh Chaturthi": T("#F59E0B", "#34D399", "#FBBF24", "#FEF3C7", "#FB7185", "#04140F", "#082A20", "#04100C"),
  "Raksha Bandhan": T("#F43F5E", "#FBBF24", "#FB923C", "#FFE4E6", "#F9A8D4", "#170A12", "#2A1020", "#10080F"),
  Eid: T("#34D399", "#E5C76B", "#5EEAD4", "#D1FAE5", "#A78BFA", "#04121A", "#08202B", "#060C18"),
  Christmas: T("#EF4444", "#22C55E", "#F5D060", "#FEE2E2", "#93C5FD", "#06130D", "#0C2418", "#08100C"),
  Pongal: T("#F59E0B", "#84CC16", "#FACC15", "#FEF9C3", "#FB923C", "#141008", "#262008", "#0F0D06"),
  Onam: T("#FACC15", "#16A34A", "#FB923C", "#FEF9C3", "#F472B6", "#0A1408", "#14240C", "#0A1006"),
  Baisakhi: T("#FACC15", "#F97316", "#FDE047", "#FEF9C3", "#38BDF8", "#13110A", "#241F0B", "#0E0C07"),
  Lohri: T("#F97316", "#FBBF24", "#FB923C", "#FFEDD5", "#EF4444", "#160A06", "#2A1209", "#100806"),
  "Makar Sankranti": T("#38BDF8", "#FB923C", "#FBBF24", "#E0F2FE", "#F472B6", "#07111C", "#0C2034", "#060C16"),
  Janmashtami: T("#60A5FA", "#FACC15", "#A78BFA", "#DBEAFE", "#F472B6", "#070B1F", "#0E1636", "#080A18"),
  Chhath: T("#FB923C", "#FDE047", "#F59E0B", "#FFEDD5", "#F87171", "#150C08", "#2A1A0C", "#0F0A07"),
  Bihu: T("#EF4444", "#FACC15", "#FB923C", "#FEE2E2", "#34D399", "#170808", "#2A1010", "#0F0708"),
  "Gudi Padwa": T("#F59E0B", "#DC2626", "#FBBF24", "#FEF3C7", "#34D399", "#150D06", "#2A1A0A", "#0F0A06"),
  Ugadi: T("#84CC16", "#F59E0B", "#FACC15", "#ECFCCB", "#FB7185", "#0A1406", "#14240A", "#0A1006"),
  "Karva Chauth": T("#E11D48", "#F5C542", "#FB7185", "#FFE4E6", "#F472B6", "#17060C", "#2C0B18", "#100610"),
  Vishu: T("#FACC15", "#22C55E", "#FB923C", "#FEF9C3", "#F472B6", "#12110A", "#1E2A0C", "#0C0F07"),
  Dussehra: T("#F97316", "#DC2626", "#FBBF24", "#FFEDD5", "#FACC15", "#180A06", "#2E1109", "#110806"),
  "Maha Shivratri": T("#A5B4FC", "#C4B5FD", "#93C5FD", "#E0E7FF", "#F0ABFC", "#070818", "#0E1030", "#080814"),
  "New Year": T("#FACC15", "#E5E7EB", "#A78BFA", "#FEF9C3", "#38BDF8", "#06060F", "#10122A", "#080810"),
  "Valentine's Day": T("#F43F5E", "#F9A8D4", "#FB7185", "#FFE4E6", "#E879F9", "#19060E", "#2E0B1C", "#10060C"),
  Easter: T("#C084FC", "#FDE047", "#86EFAC", "#F3E8FF", "#F9A8D4", "#0E0A1A", "#1C1432", "#0A0814"),
  Ramadan: T("#FBBF24", "#34D399", "#5EEAD4", "#FEF3C7", "#A78BFA", "#050E1A", "#0A1C30", "#060A14"),
  Hanukkah: T("#60A5FA", "#E5E7EB", "#93C5FD", "#DBEAFE", "#FACC15", "#060C1E", "#0C1838", "#070A18"),
  "Chinese New Year": T("#EF4444", "#FACC15", "#F59E0B", "#FEE2E2", "#FB923C", "#1A0606", "#300C0C", "#120606"),
  Halloween: T("#F97316", "#A855F7", "#FACC15", "#FFEDD5", "#84CC16", "#0D0A12", "#1A1226", "#09070E"),
  Thanksgiving: T("#EA580C", "#CA8A04", "#F59E0B", "#FFEDD5", "#B45309", "#140A06", "#26140A", "#0E0806"),
  "Black Friday": T("#FACC15", "#F5F5F5", "#F97316", "#FEF9C3", "#EF4444", "#050505", "#101010", "#080808"),
  "Cyber Monday": T("#22D3EE", "#A78BFA", "#38BDF8", "#CFFAFE", "#F472B6", "#040A14", "#0A1630", "#060812"),
  Oktoberfest: T("#F59E0B", "#38BDF8", "#FBBF24", "#FEF3C7", "#F8FAFC", "#0A1018", "#14243A", "#080C14"),
  "Mother's Day": T("#F472B6", "#FDE68A", "#FB7185", "#FCE7F3", "#C084FC", "#16081A", "#2A1030", "#0F0812"),
  "Father's Day": T("#38BDF8", "#CBD5E1", "#60A5FA", "#E0F2FE", "#FBBF24", "#060E1A", "#0C1C34", "#070C16"),
  "Singles' Day": T("#EF4444", "#F472B6", "#FB7185", "#FEE2E2", "#FACC15", "#170608", "#2E0B12", "#100608"),
};

export function getFestivalTheme(festival?: string): FestivalTheme {
  return (festival && FESTIVAL_THEMES[festival]) || DEFAULT_THEME;
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** Writes the theme to CSS variables on <html>; safe to call repeatedly. */
export function applyFestivalTheme(festival?: string): void {
  const t = getFestivalTheme(festival);
  const s = document.documentElement.style;
  (["ac", "ac2", "ac3", "ac4", "ac5", "bg0", "bg1", "bg2"] as const).forEach((k) =>
    s.setProperty(`--${k}`, t[k])
  );
  (["ac", "ac2", "ac3", "ac5"] as const).forEach((k) =>
    s.setProperty(`--${k}-rgb`, hexToRgb(t[k]))
  );
}
