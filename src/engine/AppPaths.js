function detectBasePath() {
  const firstSegment = window.location.pathname.split('/').filter(Boolean)[0] || '';
  return firstSegment && !firstSegment.includes('.') ? '/' + firstSegment : '';
}

export const APP_BASE_PATH = detectBasePath();

export function appPath(pathname = '/') {
  const path = pathname.startsWith('/') ? pathname : '/' + pathname;
  return APP_BASE_PATH + (path === '/' ? '/' : path);
}
