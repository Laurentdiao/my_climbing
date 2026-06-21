const platformLabels: Record<string, string> = {
  xiaohongshu: "Xiaohongshu",
  wechat: "WeChat",
  bilibili: "Bilibili",
  douyin: "Douyin",
  other: "Video",
};

interface VideoLinkProps {
  url: string;
  platform: string;
  title: string;
}

export function VideoLink({ url, platform, title }: VideoLinkProps) {
  const label = platformLabels[platform] ?? platform;
  const safeUrl = getSafeExternalUrl(url);

  if (!safeUrl) {
    return (
      <span className="inline-flex items-center rounded-lg border border-amber-800/70 bg-amber-950/20 px-2.5 py-1 text-xs text-amber-300">
        视频链接格式无效
      </span>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-950/55 px-2.5 py-1 text-xs text-stone-300 hover:border-lime-700 hover:text-stone-100 transition-colors"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
      <span>{label}</span>
      {title && <span className="truncate text-stone-500">{title}</span>}
    </a>
  );
}

function getSafeExternalUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
