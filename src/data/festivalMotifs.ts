/**
 * Every festival's own motion language: the particles that fill the page,
 * the animated icon used in loaders and the hero, and how the loaders talk.
 * Colours are theme tokens ("ac".."ac5", resolved from the festival theme)
 * or literal hex values.
 */

export type GlyphKind =
  | "diya" | "holi" | "dandiya" | "lotus" | "modak" | "rakhi" | "crescent" | "tree" | "pongalPot"
  | "pookalam" | "wheat" | "bonfire" | "kite" | "feather" | "sunrise" | "dhol" | "gudi" | "moonSieve"
  | "mangoLeaves" | "konna" | "bow" | "trishul" | "firework" | "heart" | "egg" | "fanoos" | "menorah"
  | "lantern" | "pumpkin" | "leaf" | "sale" | "cart" | "stein" | "tulip" | "tie" | "elevens";

export type ParticleShape =
  | "ember" | "petal" | "flower" | "cloud" | "dust" | "snow" | "sparkle" | "kite" | "lantern" | "heart"
  | "leaf" | "confetti" | "bubble" | "feather" | "bat" | "text" | "smoke" | "grain" | "ripple" | "egg";

export type Motion = "rise" | "fall" | "wind" | "float" | "fly" | "twinkle" | "ripple";

export interface ParticleLayer {
  shape: ParticleShape;
  count: number;
  motion: Motion;
  size: [number, number];
  speed: [number, number];
  colors: string[];
  alpha?: number;
  text?: string[];
}

export interface FestivalMotif {
  glyph: GlyphKind;
  layers: ParticleLayer[];
  fireworks?: number; // seconds between bursts
  lines: [string, string, string, string, string];
  working: string;
}

const L = (
  shape: ParticleShape,
  count: number,
  motion: Motion,
  size: [number, number],
  speed: [number, number],
  colors: string[],
  extra: Partial<ParticleLayer> = {}
): ParticleLayer => ({ shape, count, motion, size, speed, colors, ...extra });

const M: Record<string, FestivalMotif> = {
  Diwali: {
    glyph: "diya",
    layers: [L("ember", 120, "rise", [0.6, 2.4], [0.2, 0.7], ["ac3", "ac", "ac4"]), L("sparkle", 18, "twinkle", [1.5, 3.5], [0, 0.05], ["ac4", "ac2"])],
    fireworks: 5,
    lines: ["Lighting the first diya", "Finding the glow in your story", "Writing lines that sparkle", "Drawing the rangoli of channels", "Adding the final shimmer"],
    working: "Lighting the diyas",
  },
  Holi: {
    glyph: "holi",
    layers: [L("cloud", 12, "float", [120, 260], [0.05, 0.15], ["ac", "ac2", "ac3", "ac5"], { alpha: 0.14 }), L("dust", 90, "rise", [1, 3.2], [0.3, 1], ["ac", "ac2", "ac3", "ac5", "#7CFF6B"])],
    lines: ["Filling the first pichkari", "Finding your brightest shade", "Writing lines that splash", "Spreading colour across channels", "Throwing the final gulaal"],
    working: "Mixing the gulaal",
  },
  Navratri: {
    glyph: "dandiya",
    layers: [L("sparkle", 60, "twinkle", [1.5, 4], [0, 0.08], ["ac", "ac5", "ac3", "#FFFFFF"]), L("petal", 30, "fall", [4, 8], [0.4, 0.9], ["ac", "ac3", "ac5"])],
    lines: ["Tuning the dhol for garba", "Finding the rhythm of the nine nights", "Writing lines that twirl", "Spinning the circle of channels", "Striking the final dandiya"],
    working: "Spinning into garba",
  },
  "Durga Puja": {
    glyph: "lotus",
    layers: [L("flower", 40, "fall", [5, 9], [0.3, 0.7], ["#FFFFFF"]), L("smoke", 8, "rise", [40, 90], [0.15, 0.3], ["#E8E1D6"], { alpha: 0.07 }), L("ember", 40, "rise", [0.6, 2], [0.2, 0.5], ["ac3", "ac"])],
    lines: ["Lighting the dhunuchi", "Finding the heart of the pandal", "Writing lines worth the anjali", "Planning the pandal-hopping route", "Beating the final dhaak"],
    working: "Lighting the dhunuchi",
  },
  "Ganesh Chaturthi": {
    glyph: "modak",
    layers: [L("petal", 55, "fall", [4, 9], [0.35, 0.9], ["ac", "ac3", "ac3", "ac4"]), L("dust", 30, "rise", [1, 2.4], [0.2, 0.5], ["#FF5A7A", "ac3"])],
    lines: ["Welcoming Bappa home", "Finding your brand's blessing", "Writing lines worth an aarti", "Planning the procession of channels", "Offering the final modak"],
    working: "Shaping the modaks",
  },
  "Raksha Bandhan": {
    glyph: "rakhi",
    layers: [L("flower", 26, "float", [4, 8], [0.1, 0.3], ["ac", "ac3", "ac5"]), L("sparkle", 40, "twinkle", [1.5, 3.5], [0, 0.05], ["ac4", "ac2"]), L("heart", 14, "rise", [4, 7], [0.2, 0.5], ["ac", "ac5"])],
    lines: ["Choosing the perfect rakhi", "Finding the bond in your story", "Writing lines from sibling to sibling", "Planning gifts across channels", "Tying the final knot"],
    working: "Tying the rakhis",
  },
  Eid: {
    glyph: "crescent",
    layers: [L("sparkle", 80, "twinkle", [1, 3.2], [0, 0.04], ["#FFF6DA", "ac2"]), L("lantern", 10, "rise", [5, 9], [0.2, 0.4], ["ac2", "ac"])],
    lines: ["Sighting the crescent moon", "Finding the warmth of togetherness", "Writing lines worth sharing at the table", "Setting the dastarkhwan of channels", "Wishing the final Eid Mubarak"],
    working: "Sighting the moon",
  },
  Christmas: {
    glyph: "tree",
    layers: [L("snow", 140, "fall", [0.8, 3.4], [0.3, 1.1], ["#F4F8FF"]), L("sparkle", 16, "twinkle", [1.5, 3.5], [0, 0.03], ["ac", "ac2", "ac3"])],
    lines: ["Dusting the first snowflakes", "Finding the warmth in your story", "Writing lines worth gifting", "Wrapping up the channel plan", "Placing the star on the tree"],
    working: "Trimming the tree",
  },
  Pongal: {
    glyph: "pongalPot",
    layers: [L("bubble", 40, "rise", [2, 7], [0.3, 0.8], ["#FFF3C4", "ac3"]), L("grain", 50, "wind", [2, 4], [0.5, 1.1], ["ac3", "ac4"])],
    lines: ["Setting the pot on the fire", "Finding the harvest in your story", "Writing lines that overflow", "Arranging the kolam of channels", "Shouting the final Pongalo Pongal"],
    working: "Boiling the pongal",
  },
  Onam: {
    glyph: "pookalam",
    layers: [L("petal", 70, "fall", [3, 8], [0.3, 0.8], ["#FFD43B", "#FF8A1E", "#E8364B", "#FFFFFF", "#8B3FD9"])],
    lines: ["Laying the first ring of the pookalam", "Finding the spirit of Maveli", "Writing lines worth the sadhya", "Racing the vallam of channels", "Placing the final flower"],
    working: "Laying the pookalam",
  },
  Baisakhi: {
    glyph: "wheat",
    layers: [L("grain", 80, "wind", [2, 4.5], [0.6, 1.4], ["ac", "ac3", "ac4"]), L("dust", 30, "rise", [1, 2.2], [0.2, 0.5], ["ac4"])],
    lines: ["Harvesting the golden wheat", "Finding the bhangra in your story", "Writing lines with dhol beats", "Planning the mela of channels", "Shouting the final balle balle"],
    working: "Harvesting the wheat",
  },
  Lohri: {
    glyph: "bonfire",
    layers: [L("ember", 150, "rise", [0.8, 3], [0.5, 1.4], ["ac", "ac3", "#FFE08A"]), L("smoke", 6, "rise", [50, 110], [0.2, 0.4], ["#CFC6BC"], { alpha: 0.05 })],
    lines: ["Lighting the Lohri bonfire", "Finding the warmth in your story", "Writing lines worth singing around the fire", "Circling the channels", "Tossing in the final rewri"],
    working: "Stoking the bonfire",
  },
  "Makar Sankranti": {
    glyph: "kite",
    layers: [L("kite", 10, "wind", [14, 26], [0.25, 0.6], ["ac", "ac2", "ac3", "ac5", "#7CFF6B"]), L("dust", 20, "float", [1, 2], [0.05, 0.15], ["#FFFFFF"])],
    lines: ["Letting the first kite fly", "Catching the right breeze", "Writing lines that soar", "Plotting the sky of channels", "Calling the final kai po che"],
    working: "Flying the kites",
  },
  Janmashtami: {
    glyph: "feather",
    layers: [L("feather", 16, "fall", [12, 22], [0.25, 0.55], ["#1FA88F", "#2F6BFF"]), L("sparkle", 40, "twinkle", [1, 3], [0, 0.04], ["ac2", "ac4"])],
    lines: ["Hanging the dahi handi", "Finding the playfulness in your story", "Writing lines as sweet as makhan", "Building the human pyramid of channels", "Breaking the final handi"],
    working: "Tuning the bansuri",
  },
  Chhath: {
    glyph: "sunrise",
    layers: [L("ripple", 10, "ripple", [10, 90], [0.4, 0.8], ["ac3", "ac4"]), L("ember", 60, "rise", [0.8, 2.4], [0.2, 0.5], ["ac3", "ac"])],
    lines: ["Waiting at the ghat for sunrise", "Finding devotion in your story", "Writing lines as pure as the arghya", "Floating diyas across channels", "Offering to the rising sun"],
    working: "Offering the arghya",
  },
  Bihu: {
    glyph: "dhol",
    layers: [L("petal", 50, "fall", [4, 8], [0.4, 0.9], ["#B565E0", "#E7B8FF", "ac"]), L("sparkle", 20, "twinkle", [1, 3], [0, 0.04], ["ac4"])],
    lines: ["Beating the first dhol", "Finding the joy of Rongali", "Writing lines to dance to", "Gathering the community of channels", "Draping the final gamosa"],
    working: "Beating the dhol",
  },
  "Gudi Padwa": {
    glyph: "gudi",
    layers: [L("petal", 45, "fall", [4, 8], [0.4, 0.9], ["ac", "ac3", "#FFD43B"]), L("leaf", 16, "fall", [7, 11], [0.4, 0.8], ["#3FAE49", "#2E8B3A"])],
    lines: ["Raising the gudi", "Finding the new year in your story", "Writing lines for a fresh start", "Drawing the rangoli of channels", "Tying the final mango leaves"],
    working: "Raising the gudi",
  },
  Ugadi: {
    glyph: "mangoLeaves",
    layers: [L("leaf", 34, "fall", [7, 12], [0.4, 0.9], ["#3FAE49", "#7BC043", "#2E8B3A"]), L("flower", 20, "fall", [3, 6], [0.3, 0.6], ["#FFFFFF", "ac3"])],
    lines: ["Tying the mango leaf toran", "Finding the sweet and the bitter", "Writing lines worth the pachadi", "Planning a fresh year of channels", "Drawing the final muggulu"],
    working: "Tying the toran",
  },
  Vishu: {
    glyph: "konna",
    layers: [L("flower", 70, "fall", [3, 7], [0.4, 0.9], ["#FFD43B", "#FFE066", "#F7B500"])],
    lines: ["Arranging the Vishukkani", "Finding the gold in your story", "Writing lines worth a kaineettam", "Lighting the channels with konna", "Bursting the final padakkam"],
    working: "Arranging the kani",
  },
  "Karva Chauth": {
    glyph: "moonSieve",
    layers: [L("sparkle", 80, "twinkle", [1, 3], [0, 0.03], ["#FFF6DA", "ac4"]), L("ember", 30, "rise", [0.6, 1.8], [0.15, 0.35], ["ac", "ac3"])],
    lines: ["Waiting for the moonrise", "Finding love in your story", "Writing lines worth the wait", "Decorating the thali of channels", "Seeing the moon through the sieve"],
    working: "Waiting for the moon",
  },
  Dussehra: {
    glyph: "bow",
    layers: [L("ember", 140, "rise", [0.8, 3], [0.5, 1.3], ["ac", "ac3", "#FFE08A"])],
    fireworks: 3.5,
    lines: ["Drawing the bow", "Finding the victory in your story", "Writing lines that hit the mark", "Lining up the channels", "Lighting the final effigy"],
    working: "Drawing the bow",
  },
  "Maha Shivratri": {
    glyph: "trishul",
    layers: [L("sparkle", 70, "twinkle", [1, 3], [0, 0.03], ["#E0E7FF", "ac"]), L("smoke", 8, "rise", [40, 90], [0.12, 0.25], ["#C7D2FE"], { alpha: 0.06 })],
    lines: ["Lighting the night-long diya", "Finding stillness in your story", "Writing lines worth chanting", "Planning a night of channels", "Offering the final bel leaf"],
    working: "Keeping the night vigil",
  },
  "New Year": {
    glyph: "firework",
    layers: [L("confetti", 50, "fall", [3, 6], [0.6, 1.4], ["ac", "ac2", "ac3", "ac5"]), L("sparkle", 30, "twinkle", [1, 3], [0, 0.04], ["#FFFFFF"])],
    fireworks: 1.6,
    lines: ["Starting the countdown", "Finding the big moment", "Writing resolutions that pop", "Planning the year of channels", "Launching the final firework"],
    working: "Counting down",
  },
  "Valentine's Day": {
    glyph: "heart",
    layers: [L("heart", 34, "rise", [4, 10], [0.3, 0.8], ["ac", "ac5", "ac3"]), L("petal", 30, "fall", [4, 8], [0.3, 0.7], ["#C9184A", "#FF4D6D"])],
    lines: ["Finding the first spark", "Discovering what your fans love", "Writing lines from the heart", "Planning where love travels", "Sealing it with a kiss"],
    working: "Adding the love",
  },
  Easter: {
    glyph: "egg",
    layers: [L("egg", 18, "fall", [7, 11], [0.3, 0.6], ["#F9A8D4", "#A5F3FC", "#FDE68A", "#C4B5FD", "#BBF7D0"]), L("flower", 30, "fall", [3, 6], [0.3, 0.6], ["#FFFFFF", "#FDE68A"])],
    lines: ["Painting the first egg", "Finding the new beginning", "Writing lines for spring", "Hiding treats across channels", "Finding the final golden egg"],
    working: "Painting the eggs",
  },
  Ramadan: {
    glyph: "fanoos",
    layers: [L("sparkle", 70, "twinkle", [1, 3], [0, 0.03], ["#FFF6DA", "ac2"]), L("lantern", 16, "rise", [5, 10], [0.15, 0.35], ["ac", "ac2"])],
    lines: ["Lighting the fanoos", "Finding the spirit of giving", "Writing lines worth the iftar table", "Planning nights of channels", "Waiting for the final suhoor"],
    working: "Lighting the fanoos",
  },
  Hanukkah: {
    glyph: "menorah",
    layers: [L("ember", 70, "rise", [0.8, 2.4], [0.2, 0.5], ["#FFE08A", "ac"]), L("sparkle", 40, "twinkle", [1.5, 3.5], [0, 0.03], ["#DBEAFE", "#FFFFFF"])],
    lines: ["Lighting the shamash", "Finding the miracle in your story", "Writing lines that glow for eight nights", "Spinning the dreidel of channels", "Lighting the final candle"],
    working: "Lighting the menorah",
  },
  "Chinese New Year": {
    glyph: "lantern",
    layers: [L("lantern", 22, "rise", [6, 13], [0.25, 0.6], ["ac", "ac", "ac3"]), L("confetti", 40, "fall", [3, 5], [0.5, 1.1], ["ac", "ac2"])],
    lines: ["Hanging the first lantern", "Finding your lucky story", "Writing lines of good fortune", "Leading the dragon through channels", "Sealing the final red envelope"],
    working: "Raising the lanterns",
  },
  Halloween: {
    glyph: "pumpkin",
    layers: [L("bat", 14, "fly", [10, 18], [0.6, 1.3], ["#1B0B2E", "#2A1340"], { alpha: 0.85 }), L("leaf", 26, "fall", [6, 11], [0.4, 0.9], ["ac", "#B45309", "#7C2D12"])],
    lines: ["Carving the first pumpkin", "Finding the thrill in your story", "Writing lines with a little fright", "Planning the trick-or-treat route", "Lighting the final jack-o'-lantern"],
    working: "Carving the pumpkins",
  },
  Thanksgiving: {
    glyph: "leaf",
    layers: [L("leaf", 40, "fall", [6, 12], [0.4, 1], ["ac", "ac3", "#B45309", "#DC2626"])],
    lines: ["Setting the harvest table", "Finding what you're grateful for", "Writing lines worth sharing", "Passing dishes across channels", "Raising the final toast"],
    working: "Setting the table",
  },
  "Black Friday": {
    glyph: "sale",
    layers: [L("text", 40, "fall", [12, 22], [0.7, 1.6], ["ac", "#FFFFFF"], { text: ["%", "SALE", "-50%", "%"] }), L("confetti", 40, "fall", [3, 6], [0.6, 1.4], ["ac", "ac5"])],
    lines: ["Unlocking the doors", "Finding your hottest deal", "Writing lines that convert", "Placing budget where buyers are", "Stamping the final price tag"],
    working: "Stamping the deals",
  },
  "Cyber Monday": {
    glyph: "cart",
    layers: [L("text", 70, "fall", [10, 16], [1, 2.4], ["ac", "ac2"], { text: ["0", "1", "%", "0", "1"] })],
    lines: ["Booting up the store", "Finding your best online deal", "Writing lines that click", "Routing budget across channels", "Checking out the final cart"],
    working: "Loading the carts",
  },
  Oktoberfest: {
    glyph: "stein",
    layers: [L("bubble", 60, "rise", [2, 8], [0.4, 1.1], ["#FFF3C4", "ac"]), L("confetti", 20, "fall", [3, 5], [0.5, 1], ["#38BDF8", "#FFFFFF"])],
    lines: ["Tapping the first barrel", "Finding your brand's cheer", "Writing lines worth a toast", "Setting up the tents", "Raising the final stein"],
    working: "Pouring the cheer",
  },
  "Mother's Day": {
    glyph: "tulip",
    layers: [L("petal", 50, "fall", [4, 8], [0.3, 0.7], ["ac", "#FBCFE8", "ac5"]), L("heart", 14, "rise", [4, 7], [0.2, 0.5], ["ac"])],
    lines: ["Picking the first flowers", "Finding a mother's story", "Writing lines she'll keep", "Planning gifts across channels", "Tying the final bouquet"],
    working: "Arranging the bouquet",
  },
  "Father's Day": {
    glyph: "tie",
    layers: [L("sparkle", 40, "twinkle", [1.5, 3.5], [0, 0.04], ["ac", "ac2", "#FFFFFF"]), L("confetti", 30, "fall", [3, 5], [0.5, 1], ["ac", "ac5"])],
    lines: ["Straightening the tie", "Finding a father's story", "Writing lines he'll quote", "Planning gifts across channels", "Wrapping the final gift"],
    working: "Wrapping the gift",
  },
  "Singles' Day": {
    glyph: "elevens",
    layers: [L("text", 40, "fall", [14, 24], [0.7, 1.5], ["ac", "ac5"], { text: ["11", "11.11", "1"] }), L("confetti", 40, "fall", [3, 6], [0.6, 1.4], ["ac", "ac2"])],
    lines: ["Setting the clock to 11:11", "Finding your best treat-yourself deal", "Writing lines that sell out", "Placing budget where buyers are", "Opening the final flash sale"],
    working: "Counting to 11.11",
  },
};

export function getFestivalMotif(festival?: string): FestivalMotif {
  return (festival && M[festival]) || M.Diwali;
}
