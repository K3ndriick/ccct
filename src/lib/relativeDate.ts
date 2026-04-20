export function formatRelativeDate(isoString: string): string {
  const parsedDate = new Date(isoString);
  const currentDate = new Date();

  const diffMs = currentDate.getTime() - parsedDate.getTime();

  if (diffMs < 60000) {
    return "Just now";
  } else if (diffMs < 3600000) {
    return `${Math.floor(diffMs / 60_000)}m ago`;
  } else if (diffMs < 86400000) {
    return `${Math.floor(diffMs / 3600000)}h ago`;
  } else if (diffMs < 172800000) {
    return "Yesterday";
  } else if (parsedDate.getFullYear() === currentDate.getFullYear()) {
    return parsedDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' });
  } else {
    return parsedDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric', hour:'2-digit', minute:'2-digit'});
  }
}
