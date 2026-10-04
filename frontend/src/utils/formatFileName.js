export function formatFileName(name) {
  if (!name) return 'Resume';
  const clean = name.replace(/\.pdf$/i, '');
  return clean
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getDisplayFileName(name) {
  if (!name) return 'resume.pdf';
  return name;
}
