import LogoIcon from "@/public/icons/logo-icon.svg";

export default function KarakeepLogo({ height = 40 }: { height?: number }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoIcon
        height={height}
        width={height}
        className="shrink-0 fill-primary"
      />
      <span
        className="select-none font-bold tracking-tight text-foreground"
        style={{ fontSize: Math.max(16, Math.round(height * 0.45)) }}
      >
        Save Content
      </span>
    </span>
  );
}
