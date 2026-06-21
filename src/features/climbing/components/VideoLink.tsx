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

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-lg border border-stone-700 px-2.5 py-1 text-xs text-stone-300 hover:border-stone-500 hover:text-stone-100 transition-colors"
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
      {title && <span className="text-stone-500">· {title}</span>}
    </a>
  );
}
