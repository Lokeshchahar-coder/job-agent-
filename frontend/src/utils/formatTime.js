export function formatDuration(ms) {
  if (!ms) return '-';
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatFileSize(kb) {
  if (!kb) return '-';
  return `${kb} KB`;
}
