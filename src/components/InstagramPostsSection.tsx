import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";
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
}

function handleOf(brand: string) {
  return (brand || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "") || "brand";
}

function PostCard({
  post,
  index,
  brand,
  festival,
  stylePreset,
  seed,
}: {
  post: InstagramPost;
  index: number;
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
            <span className="rounded-full bg-[conic-gradient(from_200deg,#F28C38,#FF7EB6,#D4AF37,#F28C38)] p-[2px]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A0F20] font-display text-sm font-bold text-[#F5B041]">
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
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur">
            {index + 1}/3
          </span>
          <div className="pointer-events-none absolute inset-x-5 bottom-5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FFE7A3]/90">{festival}</p>
            <p className="mt-1 truncate font-display text-2xl font-bold text-white drop-shadow-lg">{brand}</p>
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
                <Heart className="h-28 w-28 fill-white text-white drop-shadow-[0_0_30px_rgba(255,126,182,0.9)]" aria-hidden="true" />
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
          <p className="break-words text-sm font-medium leading-relaxed text-[#F5B041]">{post.hashtags}</p>
          <div className="mt-auto flex justify-end border-t border-white/10 pt-3">
            <CopyButton textToCopy={fullText} label="Copy post" />
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

export function InstagramPostsSection({ posts, brand, festival, stylePreset, seed }: InstagramPostsSectionProps) {
  return (
    <section id="instagram-posts" aria-label="Instagram Posts" className="scroll-section space-y-7">
      <SectionHeading
        index="04"
        kicker="Feed-ready"
        title="Instagram Carousel"
        right={<p className="text-sm text-slate-400">Double-click a post to like it</p>}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {posts.slice(0, 3).map((post, index) => (
          <PostCard
            key={index}
            post={post}
            index={index}
            brand={brand}
            festival={festival}
            stylePreset={stylePreset}
            seed={seed}
          />
        ))}
      </div>
    </section>
  );
}
