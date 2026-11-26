import { Bookmark, ChevronLeft, ChevronRight, Download, Heart, Loader2, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import { composeSlidePng, downloadDataUrl } from "../utils/kitExport";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { sparkleFrom } from "../fx/celebrate";
import { EASE_OUT, SectionHeading, SpotlightCard } from "../fx/primitives";
import { makePosterSVG } from "../posters.js";
import type { FestivalName, InstagramPost, StylePreset } from "../types";
import { CopyButton } from "./CopyButton";

interface InstagramPostsSectionProps {
  posts: InstagramPost[];
  brand: string;
  festival: FestivalName;
  stylePreset: StylePreset;
  seed: number;
  /** AI artwork per slide (falls back to the vector scene). */
  slideImages?: (string | undefined)[];
  palette?: { primary: string; secondary: string; light: string };
}

function handleOf(brand: string) {
  return (brand || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "") || "brand";
}

function PostCard({
  post,
  index,
  total,
  brand,
  festival,
  stylePreset,
  seed,
  image,
  accent,
}: {
  image?: string;
  accent?: string;
  post: InstagramPost;
  index: number;
  total: number;
  brand: string;
  festival: FestivalName;
  stylePreset: StylePreset;
  seed: number;
}) {
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(0);
  const heartRef = useRef<HTMLButtonElement | null>(null);
  const likes = useMemo(() => 1200 + ((seed * 7919 + index * 104729) % 8800), [seed, index]);

  const svg = useMemo(
    () =>
      makePosterSVG(festival, seed + index * 13 + 3, stylePreset, "instagram_feed").replace(
        "<svg ",
        '<svg preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block;" '
      ),
    [festival, seed, index, stylePreset]
  );

  function like() {
    setLiked(true);
    setBurst((b) => b + 1);
    sparkleFrom(heartRef.current, 14);
  }

  const headline = post.headline || post.caption.split(/\s+/).slice(0, 5).join(" ");
  const [saving, setSaving] = useState(false);
  async function saveImage() {
    setSaving(true);
    try {
      const png = await composeSlidePng({ post, index, total, brand, festival, image, accent, seed });
      downloadDataUrl(png, `${(brand || "brand").replace(/\s+/g, "-")}-slide-${index + 1}.png`);
    } finally {
      setSaving(false);
    }
  }
  const fullText = `${post.caption}\n\n${post.hashtags}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 18, rotateZ: index === 0 ? -3 : index === 2 ? 3 : 0 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, rotateZ: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1, delay: index * 0.14, ease: EASE_OUT }}
      style={{ transformPerspective: 1200 }}
      className="h-full"
    >
      <SpotlightCard as="article" tilt={5} className="flex h-full flex-col overflow-hidden rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[conic-gradient(from_200deg,var(--ac),var(--ac5),var(--ac2),var(--ac))] p-[2px]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A0F20] font-display text-sm font-bold text-[color:var(--ac3)]">
                {(brand || "B").charAt(0).toUpperCase()}
              </span>
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">{handleOf(brand)}</p>
              <p className="text-[11px] text-slate-400">Sponsored · {festival}</p>
            </div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>

        {/* Media */}
        <div
          className="relative aspect-[4/5] cursor-pointer select-none overflow-hidden"
          onDoubleClick={like}
          title="Double-click to like"
        >
          <motion.div
            className="h-full w-full"
            initial={{ scale: 1.15 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.2, ease: EASE_OUT }}
            {...(image ? {} : { dangerouslySetInnerHTML: { __html: svg } })}
          >
            {image && (
              <img
                src={image}
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: index > 2 ? (index === 3 ? "30% 40%" : "70% 60%") : "50% 50%", transform: index > 2 ? "scale(1.18)" : undefined }}
                draggable={false}
              />
            )}
          </motion.div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85" />
          <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur">
            {index + 1}/{total}
          </span>
          <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-[var(--ac)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#16100A] shadow-lg">
            {post.angle || `Slide ${index + 1}`}
          </span>
          <div className="pointer-events-none absolute inset-x-5 bottom-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--ac4)]/90">{festival} · {brand}</p>
            <p className="mt-2 font-display text-[1.75rem] font-extrabold leading-[1.48] text-white [text-shadow:0_3px_0_rgba(0,0,0,0.45),0_8px_24px_rgba(0,0,0,0.5)]">
              <span
                className="box-decoration-clone rounded-md bg-[var(--ac)] px-2 py-[0.04em] text-[#16100A] [text-shadow:none]"
                style={accent ? { backgroundColor: accent } : undefined}
              >
                {headline}
              </span>
            </p>
            {post.subline && <p className="mt-3 text-sm font-medium text-white/90">{post.subline}</p>}
            {index < total - 1 && (
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-[color:var(--ac3)]">Swipe →</p>
            )}
          </div>
          <AnimatePresence>
            {burst > 0 && (
              <motion.span
                key={burst}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.2, 1.25, 1, 1.4] }}
                transition={{ duration: 1, times: [0, 0.25, 0.6, 1] }}
              >
                <Heart className="h-28 w-28 fill-white text-white drop-shadow-[0_0_30px_rgba(var(--ac5-rgb),0.9)]" aria-hidden="true" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-4">
            <motion.button
              ref={heartRef}
              type="button"
              whileTap={{ scale: 0.7 }}
              onClick={() => (liked ? setLiked(false) : like())}
              aria-label={liked ? "Unlike" : "Like"}
              aria-pressed={liked}
            >
              <motion.span
                animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
                className="block"
              >
                <Heart
                  className={`h-6 w-6 transition-colors ${liked ? "fill-[#FF3B6B] text-[#FF3B6B]" : "text-white"}`}
                  aria-hidden="true"
                />
              </motion.span>
            </motion.button>
            <MessageCircle className="h-6 w-6 text-white" aria-hidden="true" />
            <Send className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <Bookmark className="h-6 w-6 text-white" aria-hidden="true" />
        </div>

        <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-2">
          <p className="text-sm font-semibold tabular-nums text-white">
            {(likes + (liked ? 1 : 0)).toLocaleString()} likes
          </p>
          <p className="text-[15px] leading-relaxed text-slate-200">
            <span className="mr-1.5 font-semibold text-white">{handleOf(brand)}</span>
            {post.caption}
          </p>
          <p className="break-words text-sm font-medium leading-relaxed text-[color:var(--ac3)]">{post.hashtags}</p>
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={saveImage}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-[color:var(--ac2)] disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Download className="h-3.5 w-3.5" aria-hidden="true" />}
              Save image
            </button>
            <CopyButton textToCopy={fullText} label="Copy caption" />
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

export function InstagramPostsSection({ posts, brand, festival, stylePreset, seed, slideImages, palette }: InstagramPostsSectionProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const slides = posts.slice(0, 5);
  const [savingAll, setSavingAll] = useState(false);
  async function saveAll() {
    setSavingAll(true);
    try {
      for (let i = 0; i < slides.length; i++) {
        const png = await composeSlidePng({ post: slides[i], index: i, total: slides.length, brand, festival, image: slideImages?.[i], accent: palette?.light, seed });
        downloadDataUrl(png, `${(brand || "brand").replace(/\s+/g, "-")}-slide-${i + 1}.png`);
        await new Promise((r) => setTimeout(r, 300));
      }
    } finally {
      setSavingAll(false);
    }
  }
  const scrollBy = (dir: number) => {
    const el = railRef.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <section id="instagram-posts" aria-label="Instagram Posts" className="scroll-section space-y-7">
      <SectionHeading
        index="06"
        kicker="Feed-ready"
        title="Instagram Carousel"
        right={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveAll}
              disabled={savingAll}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-sm font-semibold text-white hover:border-[color:var(--ac2)] disabled:opacity-60 cursor-pointer"
            >
              {savingAll ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              Save all slides
            </button>
            <p className="hidden text-sm text-slate-400 xl:block">{slides.length} slides · swipe or use the arrows</p>
            <button type="button" onClick={() => scrollBy(-1)} aria-label="Previous slides" className="rounded-full border border-white/15 bg-white/[0.05] p-2 text-white hover:border-[color:var(--ac2)] cursor-pointer">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => scrollBy(1)} aria-label="Next slides" className="rounded-full border border-white/15 bg-white/[0.05] p-2 text-white hover:border-[color:var(--ac2)] cursor-pointer">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        }
      />
      <div ref={railRef} className="-mx-2 flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 pb-4 [scrollbar-width:thin]">
        {slides.map((post, index) => (
          <div key={index} className="w-[86%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%]">
            <PostCard
              post={post}
              index={index}
              total={slides.length}
              brand={brand}
              festival={festival}
              stylePreset={stylePreset}
              seed={seed}
              image={slideImages?.[index]}
              accent={palette?.light}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
