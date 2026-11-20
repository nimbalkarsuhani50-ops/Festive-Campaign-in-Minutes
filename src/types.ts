export type MarketType = "India" | "International";

export type FestivalName =
  // Indian & Pan-South-Asian Festivals
  | "Diwali"
  | "Holi"
  | "Navratri"
  | "Durga Puja"
  | "Ganesh Chaturthi"
  | "Raksha Bandhan"
  | "Eid"
  | "Christmas"
  | "Pongal"
  | "Onam"
  | "Baisakhi"
  | "Lohri"
  | "Makar Sankranti"
  | "Janmashtami"
  | "Chhath"
  | "Bihu"
  | "Gudi Padwa"
  | "Karva Chauth"
  | "Ugadi"
  | "Vishu"
  | "Dussehra"
  | "Maha Shivratri"
  // International Festivals & Moments
  | "New Year"
  | "Valentine's Day"
  | "Easter"
  | "Ramadan"
  | "Hanukkah"
  | "Chinese New Year"
  | "Halloween"
  | "Thanksgiving"
  | "Black Friday"
  | "Cyber Monday"
  | "Oktoberfest"
  | "Mother's Day"
  | "Father's Day"
  | "Singles' Day";

export type RegionalLanguage =
  | "Hindi"
  | "Marathi"
  | "Tamil"
  | "Telugu"
  | "Bengali"
  | "Kannada"
  | "Malayalam"
  | "Gujarati"
  | "Punjabi"
  | "Odia"
  | "Assamese"
  | "Urdu"
  | "English"
  | "Spanish"
  | "French"
  | "German"
  | "Portuguese"
  | "Arabic"
  | "Chinese"
  | "Japanese"
  | "Korean"
  | "Italian";

export type StylePreset = "Elegant" | "Vibrant" | "Minimal" | "Festive Gold";

export type PosterAspectRatio =
  | "instagram_feed"
  | "instagram_story"
  | "whatsapp_status";

export type SavedCampaignKey =
  | "Diwali - Sweet Shop"
  | "Ganesh Chaturthi - Jeweller"
  | "Christmas - Bakery";

export interface CampaignInput {
  market?: MarketType;
  region?: string;
  festival: FestivalName;
  brand: string;
  city: string;
  audience: string;
  budget: number;
  language: RegionalLanguage;
  stylePreset?: StylePreset;
}

export interface InstagramPost {
  caption: string;
  hashtags: string;
}

export interface ReelScript {
  hook_0_3s: string;
  scene_3_10s: string;
  cta_10_15s: string;
}

export interface ChannelPlanItem {
  channel: string;
  percent_of_budget: number;
  why: string;
}

export interface CampaignData {
  big_idea: string;
  tagline_en: string;
  tagline_regional: string;
  instagram_posts: InstagramPost[];
  reel_script: ReelScript;
  channel_plan: ChannelPlanItem[];
  poster_prompt: string;
}

export interface SavedCampaignPreset {
  key: SavedCampaignKey;
  input: CampaignInput;
  campaign: CampaignData;
}

declare global {
  interface Window {
    Plotly?: {
      newPlot: (
        root: HTMLElement,
        data: unknown[],
        layout?: Record<string, unknown>,
        config?: Record<string, unknown>
      ) => Promise<HTMLElement>;
      react: (
        root: HTMLElement,
        data: unknown[],
        layout?: Record<string, unknown>,
        config?: Record<string, unknown>
      ) => Promise<HTMLElement>;
      toImage: (
        root: HTMLElement,
        opts: { format: string; width: number; height: number }
      ) => Promise<string>;
      Plots: {
        resize: (root: HTMLElement) => void;
      };
    };
    jspdf?: {
      jsPDF: new (options?: {
        orientation?: "portrait" | "landscape" | "p" | "l";
        unit?: "mm" | "pt" | "px" | "in";
        format?: string | [number, number];
      }) => {
        internal: {
          pageSize: {
            getWidth: () => number;
            getHeight: () => number;
          };
        };
        setFillColor: (r: number, g: number, b: number) => void;
        setDrawColor: (r: number, g: number, b: number) => void;
        setTextColor: (r: number, g: number, b: number) => void;
        setLineWidth: (w: number) => void;
        setFont: (fontName: string, fontStyle?: string) => void;
        setFontSize: (size: number) => void;
        rect: (
          x: number,
          y: number,
          w: number,
          h: number,
          style?: string
        ) => void;
        roundedRect: (
          x: number,
          y: number,
          w: number,
          h: number,
          rx: number,
          ry: number,
          style?: string
        ) => void;
        line: (x1: number, y1: number, x2: number, y2: number) => void;
        text: (
          text: string | string[],
          x: number,
          y: number,
          options?: Record<string, unknown>
        ) => void;
        splitTextToSize: (text: string, maxWidth: number) => string[];
        addImage: (
          imageData: string,
          format: string,
          x: number,
          y: number,
          w: number,
          h: number
        ) => void;
        save: (filename: string) => void;
      };
    };
  }
}
