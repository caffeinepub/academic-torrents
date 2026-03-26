export function formatBytes(bytes: bigint | number): string {
  const n = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (n === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${Number.parseFloat((n / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(timestamp: bigint | number): string {
  const ms =
    typeof timestamp === "bigint" ? Number(timestamp) / 1_000_000 : timestamp;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(ms));
}

export function formatRelativeDate(timestamp: bigint | number): string {
  const ms =
    typeof timestamp === "bigint" ? Number(timestamp) / 1_000_000 : timestamp;
  const now = Date.now();
  const diff = now - ms;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}...${principal.slice(-4)}`;
}
