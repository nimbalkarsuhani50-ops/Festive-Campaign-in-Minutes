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
  /** What the brand sells, e.g. "sweet shop: kaju katli, gift boxes". */
  business?: string;
}

export interface InstagramPost {
  caption: string;
  hashtags: string;
  /** Carousel angle, e.g. "Hook", "Story", "Offer", "Challenge", "CTA". */
  angle?: string;
  /** Big text printed on the slide (max ~6 words). */
  headline?: string;
  /** Small supporting line on the slide. */
  subline?: string;
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

export type PosterLayout =
  | "Bold Headline"
  | "Ribbon Frame"
  | "Sticker Pop"
  | "Magazine Cover"
  | "Split Panel"
  | "Editorial";

export interface PosterConcept {
  concept: string;
  layout: PosterLayout;
  visual_prompt: string;
  headline: string;
  subline: string;
  cta: string;
  badge: string;
  /** Server signature that allows /api/poster-image to draw this prompt. */
  token?: string;
  /** Generated artwork ids per format (filled in by the browser). */
  images?: Partial<Record<PosterAspectRatio, string>>;
  /** Bumped by "New artwork" to get a fresh image. */
  variant?: number;
}

export interface CampaignData {
  big_idea: string;
  tagline_en: string;
  tagline_regional: string;
  instagram_posts: InstagramPost[];
  reel_script: ReelScript;
  channel_plan: ChannelPlanItem[];
  poster_prompt: string;
  /** Short on-poster headline, CTA and badge text. */
  poster_headline?: string;
  /** Three ready-to-post poster concepts (AI campaigns). */
  posters?: PosterConcept[];
  /** On-screen text for the 10-second reel. */
  reel_text?: {
    hook: string;
    line: string;
    cta: string;
    music_mood: string;
    voiceover?: string;
    voice?: string;
    music_prompt?: string;
    voice_token?: string;
    music_token?: string;
    /** Generated audio ids (filled in by the browser). */
    voice_id?: string;
    music_id?: string;
  };
  /** Brand x festival palette picked by the AI. */
  palette?: { primary: string; secondary: string; light: string };
  poster_cta?: string;
  poster_badge?: string;
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
  }
}
