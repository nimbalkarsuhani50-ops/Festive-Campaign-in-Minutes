import { motion } from "motion/react";
import type { InstagramPost } from "../types";
import { CopyButton } from "./CopyButton";

interface InstagramPostsSectionProps {
  posts: InstagramPost[];
}

export function InstagramPostsSection({ posts }: InstagramPostsSectionProps) {
  return (
    <motion.section
      id="instagram-posts"
      aria-label="Instagram Posts"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
        <span className="text-[#F28C38] tabular-nums">04</span>
        <span aria-hidden="true">·</span>
        <h2 className="text-base font-bold text-white">Instagram Posts</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {posts.slice(0, 3).map((post, index) => {
          const fullText = `${post.caption}\n\n${post.hashtags}`;
          return (
            <article
              key={index}
              className="glass-card glass-card-interactive flex flex-col justify-between gap-6 rounded-2xl p-6 sm:p-7"
            >
              <div className="space-y-4">
                <p className="text-xs font-semibold text-[#D4AF37] tabular-nums">
                  Post 0{index + 1}
                </p>
                <p className="text-base sm:text-[1.0625rem] font-medium leading-relaxed text-slate-100">
                  {post.caption}
                </p>
                <p className="text-sm font-medium leading-relaxed text-[#F28C38] break-words">
                  {post.hashtags}
                </p>
              </div>

              <div className="flex justify-end border-t border-white/10 pt-4">
                <CopyButton textToCopy={fullText} label="Copy post" />
              </div>
            </article>
          );
        })}
      </div>
    </motion.section>
  );
}
