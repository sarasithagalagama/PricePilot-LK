export function formatColomboDate(value: string): string {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

export function formatRelativeHours(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
