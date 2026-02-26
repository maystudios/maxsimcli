import { Github, Package, ArrowUp } from "lucide-react";
import { motion, useAnimationFrame, useMotionValue, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

function MovingBorderButton({
  children,
  onClick,
  duration = 3000,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  duration?: number;
  className?: string;
}) {
  const rectRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue(0);

  useAnimationFrame((time) => {
    if (!rectRef.current) return;
    const length = rectRef.current.getTotalLength();
    progress.set(((time % duration) / duration) * length);
  });

  const px = useTransform(progress, (v) =>
    rectRef.current ? rectRef.current.getPointAtLength(v).x : 0
  );
  const py = useTransform(progress, (v) =>
    rectRef.current ? rectRef.current.getPointAtLength(v).y : 0
  );

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative inline-flex overflow-hidden rounded-lg cursor-pointer",
        className
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          ref={rectRef}
          fill="none"
          stroke="none"
          width="100%"
          height="100%"
          rx="8"
        />
      </svg>

      <motion.span
        className="absolute h-20 w-20 rounded-full blur-[18px] bg-accent/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ x: px, y: py, translateX: "-50%", translateY: "-50%" }}
      />

      <span className="absolute inset-0 rounded-lg border border-border/60 group-hover:border-accent/30 transition-colors duration-300" />

      <span className="relative flex items-center gap-2 bg-surface/40 px-5 py-2.5 text-xs font-mono text-muted group-hover:text-foreground transition-colors duration-200">
        {children}
      </span>
    </button>
  );
}

function FooterLink({
  href,
  children,
  external,
  pushState,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  pushState?: boolean;
}) {
  const handleClick = pushState
    ? (e: React.MouseEvent) => {
        e.preventDefault();
        window.history.pushState({}, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    : undefined;

  return (
    <a
      href={href}
      onClick={handleClick}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group relative inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors duration-200 w-fit cursor-pointer"
    >
      {children}
      <span className="absolute -bottom-px left-0 h-px w-0 bg-accent group-hover:w-full transition-all duration-300 ease-out" />
    </a>
  );
}

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Docs", href: "#docs" },
  { label: "Documentation", href: "/docs", pushState: true },
];

const EXTERNAL_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/maystudios/maxsimcli",
    icon: <Github size={13} strokeWidth={1.5} />,
  },
  {
    label: "npm",
    href: "https://www.npmjs.com/package/maxsimcli",
    icon: <Package size={13} strokeWidth={1.5} />,
  },
];

export function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

          <div className="md:col-span-1 flex flex-col gap-4">
            <span className="font-mono font-bold tracking-tight text-foreground">
              MAXSIM
            </span>

            <p className="text-sm text-muted leading-relaxed max-w-xs">
              Meta-prompting, context engineering, and spec-driven development
              for AI coding agents — by MayStudios.
            </p>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted">v{__MAXSIM_VERSION__}</span>
              <span className="h-3 w-px bg-border" />
              <span className="text-xs font-mono text-muted uppercase tracking-widest">MIT</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-xs font-mono uppercase tracking-widest text-muted/40">
              Navigate
            </span>
            <nav className="flex flex-col gap-3.5">
              {NAV_LINKS.map((link) => (
                <FooterLink key={link.href} href={link.href} pushState={"pushState" in link ? link.pushState : false}>
                  {link.label}
                </FooterLink>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-xs font-mono uppercase tracking-widest text-muted/40">
              Connect
            </span>
            <nav className="flex flex-col gap-3.5">
              {EXTERNAL_LINKS.map((link) => (
                <FooterLink key={link.href} href={link.href} external>
                  {link.icon}
                  {link.label}
                </FooterLink>
              ))}
            </nav>
          </div>
        </div>

        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-mono text-muted/40">
              &copy; {new Date().getFullYear()} May Studios — Build with MAXSIM.
            </p>
            <p className="text-xs font-mono text-muted/30">
              by{" "}
              <a
                href="https://sven-maibaum.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted/50 hover:text-muted transition-colors underline underline-offset-2"
              >
                Sven Maibaum
              </a>
            </p>
          </div>
          <MovingBorderButton onClick={scrollToTop}>
            <ArrowUp size={13} strokeWidth={2} />
            Back to top
          </MovingBorderButton>
        </div>

      </div>
    </footer>
  );
}
