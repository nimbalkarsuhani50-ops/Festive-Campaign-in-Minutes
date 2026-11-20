import type {
  FestivalName,
  MarketType,
  PosterAspectRatio,
  RegionalLanguage,
  SavedCampaignKey,
  SavedCampaignPreset,
  StylePreset,
} from "../types";

export interface RegionConfig {
  id: string;
  label: string;
  market: MarketType;
  defaultCity: string;
  defaultFestival: FestivalName;
  defaultLanguage: RegionalLanguage;
  currencySymbol: string;
  currencyCode: string;
  locale: string;
  budgetMin: number;
  budgetMax: number;
  budgetStep: number;
  defaultBudget: number;
  suggestedFestivals: FestivalName[];
  languages: RegionalLanguage[];
}

export const INDIA_FESTIVALS: FestivalName[] = [
  "Diwali",
  "Holi",
  "Navratri",
  "Durga Puja",
  "Ganesh Chaturthi",
  "Raksha Bandhan",
  "Eid",
  "Christmas",
  "Pongal",
  "Onam",
  "Baisakhi",
  "Lohri",
  "Makar Sankranti",
  "Janmashtami",
  "Chhath",
  "Bihu",
  "Gudi Padwa",
  "Karva Chauth",
  "Ugadi",
  "Vishu",
  "Dussehra",
  "Maha Shivratri",
];

export const INTERNATIONAL_FESTIVALS: FestivalName[] = [
  "New Year",
  "Valentine's Day",
  "Easter",
  "Ramadan",
  "Eid",
  "Hanukkah",
  "Chinese New Year",
  "Halloween",
  "Thanksgiving",
  "Black Friday",
  "Cyber Monday",
  "Oktoberfest",
  "Mother's Day",
  "Father's Day",
  "Christmas",
  "Singles' Day",
  "Diwali",
];

export const FESTIVALS: FestivalName[] = [
  ...INDIA_FESTIVALS,
  ...INTERNATIONAL_FESTIVALS.filter((f) => !INDIA_FESTIVALS.includes(f)),
];

export const INDIA_LANGUAGES: RegionalLanguage[] = [
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Kannada",
  "Malayalam",
  "Gujarati",
  "Punjabi",
  "Odia",
  "Assamese",
  "Urdu",
  "English",
];

export const INTERNATIONAL_LANGUAGES: RegionalLanguage[] = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Arabic",
  "Chinese",
  "Japanese",
  "Korean",
  "Italian",
  "Hindi",
];

export const LANGUAGES: RegionalLanguage[] = [
  ...INDIA_LANGUAGES,
  ...INTERNATIONAL_LANGUAGES.filter((l) => !INDIA_LANGUAGES.includes(l)),
];

export const REGION_CONFIGS: RegionConfig[] = [
  // INDIA REGIONS
  {
    id: "Pan-India",
    label: "Pan-India",
    market: "India",
    defaultCity: "Mumbai",
    defaultFestival: "Diwali",
    defaultLanguage: "Hindi",
    currencySymbol: "₹",
    currencyCode: "INR",
    locale: "en-IN",
    budgetMin: 10000,
    budgetMax: 1000000,
    budgetStep: 5000,
    defaultBudget: 250000,
    suggestedFestivals: [
      "Diwali",
      "Holi",
      "Raksha Bandhan",
      "Navratri",
      "Eid",
      "Christmas",
      "Janmashtami",
      "Dussehra",
    ],
    languages: INDIA_LANGUAGES,
  },
  {
    id: "West India",
    label: "West India (MH / GJ)",
    market: "India",
    defaultCity: "Pune",
    defaultFestival: "Ganesh Chaturthi",
    defaultLanguage: "Marathi",
    currencySymbol: "₹",
    currencyCode: "INR",
    locale: "en-IN",
    budgetMin: 10000,
    budgetMax: 1000000,
    budgetStep: 5000,
    defaultBudget: 250000,
    suggestedFestivals: [
      "Diwali",
      "Ganesh Chaturthi",
      "Gudi Padwa",
      "Navratri",
      "Makar Sankranti",
      "Holi",
      "Raksha Bandhan",
    ],
    languages: ["Marathi", "Gujarati", "Hindi", "English", ...INDIA_LANGUAGES.filter((l) => !["Marathi", "Gujarati", "Hindi", "English"].includes(l))],
  },
  {
    id: "North India",
    label: "North India (DL / PB / UP / BR)",
    market: "India",
    defaultCity: "New Delhi",
    defaultFestival: "Diwali",
    defaultLanguage: "Hindi",
    currencySymbol: "₹",
    currencyCode: "INR",
    locale: "en-IN",
    budgetMin: 10000,
    budgetMax: 1000000,
    budgetStep: 5000,
    defaultBudget: 250000,
    suggestedFestivals: [
      "Diwali",
      "Holi",
      "Lohri",
      "Baisakhi",
      "Karva Chauth",
      "Chhath",
      "Raksha Bandhan",
      "Janmashtami",
    ],
    languages: ["Hindi", "Punjabi", "Urdu", "English", ...INDIA_LANGUAGES.filter((l) => !["Hindi", "Punjabi", "Urdu", "English"].includes(l))],
  },
  {
    id: "South India",
    label: "South India (TN / KA / KL / TS)",
    market: "India",
    defaultCity: "Bengaluru",
    defaultFestival: "Pongal",
    defaultLanguage: "Tamil",
    currencySymbol: "₹",
    currencyCode: "INR",
    locale: "en-IN",
    budgetMin: 10000,
    budgetMax: 1000000,
    budgetStep: 5000,
    defaultBudget: 250000,
    suggestedFestivals: [
      "Pongal",
      "Onam",
      "Ugadi",
      "Vishu",
      "Diwali",
      "Christmas",
      "Eid",
      "Maha Shivratri",
    ],
    languages: ["Tamil", "Telugu", "Kannada", "Malayalam", "Hindi", "English", ...INDIA_LANGUAGES.filter((l) => !["Tamil", "Telugu", "Kannada", "Malayalam", "Hindi", "English"].includes(l))],
  },
  {
    id: "East India",
    label: "East & North-East (WB / AS / OD)",
    market: "India",
    defaultCity: "Kolkata",
    defaultFestival: "Durga Puja",
    defaultLanguage: "Bengali",
    currencySymbol: "₹",
    currencyCode: "INR",
    locale: "en-IN",
    budgetMin: 10000,
    budgetMax: 1000000,
    budgetStep: 5000,
    defaultBudget: 250000,
    suggestedFestivals: [
      "Durga Puja",
      "Bihu",
      "Diwali",
      "Chhath",
      "Holi",
      "Christmas",
      "Eid",
    ],
    languages: ["Bengali", "Assamese", "Odia", "Hindi", "English", ...INDIA_LANGUAGES.filter((l) => !["Bengali", "Assamese", "Odia", "Hindi", "English"].includes(l))],
  },
  // INTERNATIONAL COUNTRIES & REGIONS
  {
    id: "United States",
    label: "United States",
    market: "International",
    defaultCity: "New York",
    defaultFestival: "Thanksgiving",
    defaultLanguage: "English",
    currencySymbol: "$",
    currencyCode: "USD",
    locale: "en-US",
    budgetMin: 500,
    budgetMax: 50000,
    budgetStep: 250,
    defaultBudget: 5000,
    suggestedFestivals: [
      "Black Friday",
      "Thanksgiving",
      "Christmas",
      "New Year",
      "Valentine's Day",
      "Halloween",
      "Mother's Day",
      "Father's Day",
      "Hanukkah",
    ],
    languages: ["English", "Spanish", "French", "Chinese", "Hindi", ...INTERNATIONAL_LANGUAGES.filter((l) => !["English", "Spanish", "French", "Chinese", "Hindi"].includes(l))],
  },
  {
    id: "United Kingdom",
    label: "United Kingdom",
    market: "International",
    defaultCity: "London",
    defaultFestival: "Christmas",
    defaultLanguage: "English",
    currencySymbol: "£",
    currencyCode: "GBP",
    locale: "en-GB",
    budgetMin: 500,
    budgetMax: 40000,
    budgetStep: 250,
    defaultBudget: 4000,
    suggestedFestivals: [
      "Christmas",
      "Black Friday",
      "Easter",
      "Mother's Day",
      "Father's Day",
      "Valentine's Day",
      "New Year",
      "Diwali",
      "Eid",
    ],
    languages: ["English", "French", "Spanish", "Hindi", "Arabic", ...INTERNATIONAL_LANGUAGES.filter((l) => !["English", "French", "Spanish", "Hindi", "Arabic"].includes(l))],
  },
  {
    id: "UAE & Middle East",
    label: "UAE & Middle East",
    market: "International",
    defaultCity: "Dubai",
    defaultFestival: "Ramadan",
    defaultLanguage: "Arabic",
    currencySymbol: "AED ",
    currencyCode: "AED",
    locale: "en-AE",
    budgetMin: 2000,
    budgetMax: 200000,
    budgetStep: 1000,
    defaultBudget: 20000,
    suggestedFestivals: [
      "Ramadan",
      "Eid",
      "New Year",
      "Diwali",
      "Black Friday",
      "Valentine's Day",
      "Mother's Day",
    ],
    languages: ["Arabic", "English", "Hindi", "French", ...INTERNATIONAL_LANGUAGES.filter((l) => !["Arabic", "English", "Hindi", "French"].includes(l))],
  },
  {
    id: "Europe",
    label: "Europe (DE / FR / ES / IT)",
    market: "International",
    defaultCity: "Berlin",
    defaultFestival: "Oktoberfest",
    defaultLanguage: "German",
    currencySymbol: "€",
    currencyCode: "EUR",
    locale: "en-IE",
    budgetMin: 500,
    budgetMax: 50000,
    budgetStep: 250,
    defaultBudget: 5000,
    suggestedFestivals: [
      "Oktoberfest",
      "Christmas",
      "Easter",
      "Black Friday",
      "Valentine's Day",
      "New Year",
      "Mother's Day",
    ],
    languages: ["German", "French", "Spanish", "Italian", "Portuguese", "English", ...INTERNATIONAL_LANGUAGES.filter((l) => !["German", "French", "Spanish", "Italian", "Portuguese", "English"].includes(l))],
  },
  {
    id: "East Asia",
    label: "East Asia (CN / JP / KR / SG)",
    market: "International",
    defaultCity: "Tokyo",
    defaultFestival: "Chinese New Year",
    defaultLanguage: "Japanese",
    currencySymbol: "$",
    currencyCode: "USD",
    locale: "en-US",
    budgetMin: 500,
    budgetMax: 50000,
    budgetStep: 250,
    defaultBudget: 6000,
    suggestedFestivals: [
      "Chinese New Year",
      "Singles' Day",
      "New Year",
      "Valentine's Day",
      "Christmas",
      "Mother's Day",
    ],
    languages: ["Chinese", "Japanese", "Korean", "English", ...INTERNATIONAL_LANGUAGES.filter((l) => !["Chinese", "Japanese", "Korean", "English"].includes(l))],
  },
  {
    id: "Latin America",
    label: "Latin America (BR / MX / LATAM)",
    market: "International",
    defaultCity: "São Paulo",
    defaultFestival: "New Year",
    defaultLanguage: "Portuguese",
    currencySymbol: "$",
    currencyCode: "USD",
    locale: "en-US",
    budgetMin: 500,
    budgetMax: 40000,
    budgetStep: 250,
    defaultBudget: 4000,
    suggestedFestivals: [
      "New Year",
      "Christmas",
      "Easter",
      "Valentine's Day",
      "Black Friday",
      "Mother's Day",
      "Father's Day",
    ],
    languages: ["Portuguese", "Spanish", "English", ...INTERNATIONAL_LANGUAGES.filter((l) => !["Portuguese", "Spanish", "English"].includes(l))],
  },
  {
    id: "Global",
    label: "Global Multi-Market",
    market: "International",
    defaultCity: "London",
    defaultFestival: "New Year",
    defaultLanguage: "English",
    currencySymbol: "$",
    currencyCode: "USD",
    locale: "en-US",
    budgetMin: 500,
    budgetMax: 100000,
    budgetStep: 500,
    defaultBudget: 10000,
    suggestedFestivals: INTERNATIONAL_FESTIVALS,
    languages: INTERNATIONAL_LANGUAGES,
  },
];

export function getRegionConfig(
  market: MarketType = "India",
  regionId?: string
): RegionConfig {
  const byId = REGION_CONFIGS.find((r) => r.id === regionId && r.market === market);
  if (byId) return byId;
  return REGION_CONFIGS.find((r) => r.market === market) ?? REGION_CONFIGS[0];
}

export function getRegionsForMarket(market: MarketType): RegionConfig[] {
  return REGION_CONFIGS.filter((r) => r.market === market);
}

export interface StylePresetOption {
  id: StylePreset;
  subtitle: string;
  swatches: [string, string, string];
}

export const STYLE_PRESETS: StylePresetOption[] = [
  {
    id: "Festive Gold",
    subtitle: "Royal navy, antique gold & warm diya glow",
    swatches: ["#15233F", "#D4AF37", "#F28C38"],
  },
  {
    id: "Elegant",
    subtitle: "Deep obsidian, champagne & refined serif",
    swatches: ["#12131A", "#E2C799", "#C98A5B"],
  },
  {
    id: "Vibrant",
    subtitle: "Rich jewel tones, saffron & festive energy",
    swatches: ["#261042", "#F28C38", "#EC4899"],
  },
  {
    id: "Minimal",
    subtitle: "Warm ivory canvas, slate ink & crisp lines",
    swatches: ["#FAF7F2", "#1E293B", "#D97706"],
  },
];

export interface AspectRatioOption {
  id: PosterAspectRatio;
  label: string;
  ratioLabel: string;
  width: number;
  height: number;
}

export const POSTER_ASPECT_RATIOS: AspectRatioOption[] = [
  {
    id: "instagram_feed",
    label: "Instagram Feed",
    ratioLabel: "4:5",
    width: 1080,
    height: 1350,
  },
  {
    id: "instagram_story",
    label: "Instagram Story",
    ratioLabel: "9:16",
    width: 1080,
    height: 1920,
  },
  {
    id: "whatsapp_status",
    label: "WhatsApp Status",
    ratioLabel: "9:16",
    width: 1080,
    height: 1920,
  },
];

export function getAspectRatioSpec(id: PosterAspectRatio = "instagram_feed"): AspectRatioOption {
  return POSTER_ASPECT_RATIOS.find((r) => r.id === id) ?? POSTER_ASPECT_RATIOS[0];
}

export const BUDGET_MIN = 10000;
export const BUDGET_MAX = 1000000;
export const BUDGET_STEP = 5000;

export const FESTIVAL_NEXT_DATES: Record<FestivalName, string> = {
  Diwali: "2027-10-29",
  Holi: "2027-03-22",
  Navratri: "2027-09-30",
  "Durga Puja": "2027-10-06",
  "Ganesh Chaturthi": "2027-09-03",
  "Raksha Bandhan": "2027-08-18",
  Eid: "2027-03-10",
  Christmas: "2026-12-25",
  Pongal: "2027-01-14",
  Onam: "2027-08-15",
  Baisakhi: "2027-04-14",
  Lohri: "2027-01-13",
  "Makar Sankranti": "2027-01-14",
  Janmashtami: "2027-08-25",
  Chhath: "2027-11-05",
  Bihu: "2027-04-15",
  "Gudi Padwa": "2027-04-07",
  "Karva Chauth": "2027-10-18",
  Ugadi: "2027-04-07",
  Vishu: "2027-04-14",
  Dussehra: "2027-10-09",
  "Maha Shivratri": "2027-03-06",
  "New Year": "2027-01-01",
  "Valentine's Day": "2027-02-14",
  Easter: "2027-03-28",
  Ramadan: "2027-02-08",
  Hanukkah: "2026-12-04",
  "Chinese New Year": "2027-02-06",
  Halloween: "2027-10-31",
  Thanksgiving: "2026-11-26",
  "Black Friday": "2026-11-27",
  "Cyber Monday": "2026-11-30",
  Oktoberfest: "2027-09-18",
  "Mother's Day": "2027-05-09",
  "Father's Day": "2027-06-20",
  "Singles' Day": "2027-11-11",
};

export function getFestivalCountdownText(festival: FestivalName): string {
  const dateStr = FESTIVAL_NEXT_DATES[festival] ?? "2027-01-01";
  const [yStr, mStr, dStr] = dateStr.split("-");
  let targetYear = Number(yStr);
  const targetMonth = Number(mStr) - 1;
  const targetDay = Number(dStr);

  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  let targetMidnight = new Date(targetYear, targetMonth, targetDay);

  while (targetMidnight.getTime() < todayMidnight.getTime()) {
    targetYear += 1;
    targetMidnight = new Date(targetYear, targetMonth, targetDay);
  }

  const diffDays = Math.round(
    (targetMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return "Today!";
  }
  if (diffDays === 1) {
    return `${festival} in 1 day`;
  }
  return `${festival} in ${diffDays} days`;
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatBudget(
  amount: number,
  market: MarketType = "India",
  regionId?: string
): string {
  const cfg = getRegionConfig(market, regionId);
  return `${cfg.currencySymbol}${Math.round(amount).toLocaleString(cfg.locale)}`;
}

export const SAVED_CAMPAIGNS: Record<SavedCampaignKey, SavedCampaignPreset> = {
  "Diwali - Sweet Shop": {
    key: "Diwali - Sweet Shop",
    input: {
      market: "India",
      region: "West India",
      festival: "Diwali",
      brand: "Mithai Mahal",
      city: "Pune",
      audience: "Families buying Diwali gift boxes",
      budget: 150000,
      language: "Marathi",
    },
    campaign: {
      big_idea:
        "Every sweet box becomes a handwritten letter home - Mithai Mahal packs a memory, not just mithai.",
      tagline_en: "This Diwali, gift a memory, not just mithai.",
      tagline_regional: "या दिवाळीत, गोडवा नाही तर आठवण भेट द्या!",
      instagram_posts: [
        {
          caption:
            "Kesar pedha that tastes like your aaji made it. Diwali gift boxes from ₹499 at Mithai Mahal, Pune.",
          hashtags: "#Diwali2026 #MithaiMahal #PuneSweets #DiwaliGifting",
        },
        {
          caption:
            "500 boxes. 40 housing societies. One very happy Diwali. Corporate gifting now open.",
          hashtags: "#CorporateGifting #DiwaliBoxes #PuneBusiness",
        },
        {
          caption:
            "Sugar-free kaju katli that actually tastes like kaju katli. Diwali is for everyone.",
          hashtags: "#SugarFreeDiwali #MithaiLovers #FestiveSweets",
        },
      ],
      reel_script: {
        hook_0_3s: "Close-up: hot ghee poured over fresh besan ladoo, steam rising",
        scene_3_10s:
          "Family opens a Mithai Mahal box, kids grab pedhas, grandmother smiles at a handwritten note inside",
        cta_10_15s: "Order your Diwali box today - Mithai Mahal, Pune. Link in bio.",
      },
      channel_plan: [
        {
          channel: "Instagram Reels",
          percent_of_budget: 35,
          why: "Festive food reels get the highest local reach in Pune",
        },
        {
          channel: "WhatsApp Broadcast",
          percent_of_budget: 25,
          why: "Direct orders from housing societies and past customers",
        },
        {
          channel: "Local Influencers",
          percent_of_budget: 20,
          why: "Pune food bloggers drive gifting discovery",
        },
        {
          channel: "In-store Branding",
          percent_of_budget: 12,
          why: "Walk-in festive footfall conversion",
        },
        {
          channel: "Google Business Profile",
          percent_of_budget: 8,
          why: "Captures 'mithai near me' searches",
        },
      ],
      poster_prompt:
        "Warm Diwali night scene with glowing diyas and lanterns, sweets arranged on a brass plate, no text",
    },
  },
  "Ganesh Chaturthi - Jeweller": {
    key: "Ganesh Chaturthi - Jeweller",
    input: {
      market: "India",
      region: "West India",
      festival: "Ganesh Chaturthi",
      brand: "Suvarna Jewellers",
      city: "Pune",
      audience: "Families shopping for festive gold",
      budget: 500000,
      language: "Marathi",
    },
    campaign: {
      big_idea:
        "A 'Bappa's Blessing' gold coin with every purchase - devotion you can hold, crafted in 22 karat.",
      tagline_en: "Crafted for Bappa's blessings.",
      tagline_regional: "बाप्पाच्या आशीर्वादासाठी - सुवर्णच सोने!",
      instagram_posts: [
        {
          caption:
            "This Ganesh Chaturthi, take home more than gold. Free Bappa's Blessing coin on every purchase above ₹25,000.",
          hashtags: "#GaneshChaturthi #SuvarnaJewellers #PuneJewellery #GoldCoin",
        },
        {
          caption:
            "Modak pendants. Peepal-leaf chains. Our festive edit is here - crafted for the festival of blessings.",
          hashtags: "#FestiveGold #GanpatiCollection #JewelleryDesign",
        },
        {
          caption:
            "Three generations. One jeweller. Suvarna since 1987. Visit us this Chaturthi.",
          hashtags: "#LegacyJeweller #PuneShopping #GaneshFestival",
        },
      ],
      reel_script: {
        hook_0_3s: "Macro shot: gold modak pendant catching morning light",
        scene_3_10s:
          "Artisan's hands engraving the pendant, then a daughter fastening it on her mother before visarjan",
        cta_10_15s:
          "Suvarna Jewellers - crafted for Bappa's blessings. Showrooms across Pune.",
      },
      channel_plan: [
        {
          channel: "Instagram + Facebook Ads",
          percent_of_budget: 30,
          why: "Festive gold buyers research designs on social first",
        },
        {
          channel: "Marathi Newspapers",
          percent_of_budget: 25,
          why: "Trusted by the family decision-makers during Chaturthi",
        },
        {
          channel: "Influencer Darshan Coverage",
          percent_of_budget: 15,
          why: "Kasba Ganpati footfall content puts the brand in the moment",
        },
        {
          channel: "WhatsApp Catalogue",
          percent_of_budget: 15,
          why: "Repeat customers buy directly from catalogues",
        },
        {
          channel: "Outdoor Hoardings",
          percent_of_budget: 15,
          why: "Pandal-route visibility during the 10 days",
        },
      ],
      poster_prompt:
        "Emerald green festive background with marigold garlands and an elegant gold necklace with pendant, no text",
    },
  },
  "Christmas - Bakery": {
    key: "Christmas - Bakery",
    input: {
      market: "India",
      region: "West India",
      festival: "Christmas",
      brand: "Frost & Crumb",
      city: "Pune",
      audience: "Young families and office Secret-Santa shoppers",
      budget: 80000,
      language: "Hindi",
    },
    campaign: {
      big_idea:
        "A '12 Days of Cookies' countdown box - a new handcrafted cookie behind every window till Christmas.",
      tagline_en: "Baked with joy, frosted with love.",
      tagline_regional: "हर बाइट में मौज, हर कुकी में प्यार!",
      instagram_posts: [
        {
          caption:
            "Plum cake so rich it needs its own carol. Pre-orders open at Frost & Crumb, Pune.",
          hashtags: "#ChristmasBakery #PlumCake #PuneBakeries #FrostAndCrumb",
        },
        {
          caption:
            "12 days. 12 cookies. One very merry box. The countdown box is back - limited to 200 boxes.",
          hashtags: "#CookieCountdown #ChristmasCookies #SecretSanta",
        },
        {
          caption:
            "Gingerbread people with personality. Come meet the gang at our KP store this weekend.",
          hashtags: "#Gingerbread #ChristmasInPune #BakeryLove",
        },
      ],
      reel_script: {
        hook_0_3s:
          "Time-lapse: icing flooding a snowflake cookie in one satisfying pour",
        scene_3_10s:
          "Kids open the countdown box windows, finding a new cookie each morning, cocoa steaming nearby",
        cta_10_15s:
          "Pre-order the 12 Days box - Frost & Crumb, Koregaon Park. Only 200 boxes!",
      },
      channel_plan: [
        {
          channel: "Instagram Reels",
          percent_of_budget: 40,
          why: "Decorating videos are the bakery's highest-converting content",
        },
        {
          channel: "Swiggy/Zomato Ads",
          percent_of_budget: 25,
          why: "Captures impulse festive dessert orders",
        },
        {
          channel: "Office Bulk Orders",
          percent_of_budget: 20,
          why: "Secret-Santa and corporate hampers have high order values",
        },
        {
          channel: "In-store Experience",
          percent_of_budget: 15,
          why: "Decorated storefront drives weekend footfall",
        },
      ],
      poster_prompt:
        "Cozy Christmas bakery scene with a frosted cake, cookies and warm string lights, no text",
    },
  },
};

export const SAVED_CAMPAIGN_KEYS: SavedCampaignKey[] = [
  "Diwali - Sweet Shop",
  "Ganesh Chaturthi - Jeweller",
  "Christmas - Bakery",
];
