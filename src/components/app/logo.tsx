// Logo Post-it campus : un post-it jaune penché avec un « P », la punaise rouge à la place du tiret.

export function IconeLogo({ taille = 32 }: { taille?: number }) {
  return (
    <span
      aria-hidden
      className="relative flex shrink-0 -rotate-6 items-center justify-center rounded-[3px_3px_10px_3px/3px_3px_5px_3px] bg-postit-jaune shadow-[1px_2px_0_0_var(--color-encre)]"
      style={{ width: taille, height: taille }}
    >
      <span className="titre-charte pt-[8%] text-encre" style={{ fontSize: taille * 0.78 }}>
        P
      </span>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <IconeLogo />
      <span className={`items-center gap-1.5 ${compact ? "hidden sm:flex" : "flex"}`}>
        <span className="titre-charte flex items-center gap-[3px] text-[1.35rem]">
          Post
          <span className="mb-0.5 size-2 rounded-full bg-accent" aria-hidden />
          it
        </span>
        <span className="-rotate-3 font-main text-base leading-none text-alerte">campus</span>
        <span className="sr-only">Post-it campus</span>
      </span>
    </span>
  );
}
