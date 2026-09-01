export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error('network');
    err.status = 0;
    err.data = { error: 'network' };
    throw err;
  }

  const text = await res.text();
  const trimmed = (text || '').trim();
  const looksJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  let data = {};
  if (looksJson) {
    try {
      data = JSON.parse(trimmed);
    } catch {
      data = {};
    }
  }

  if (!res.ok) {
    if (!looksJson) {
      const isMissing = res.status === 404;
      const err = new Error(isMissing ? 'api_missing' : 'server');
      err.status = res.status;
      err.data = {
        error: isMissing ? 'api_missing' : 'server',
        hint:
          res.status >= 500
            ? 'The API crashed. Set JWT_SECRET in Vercel (Production), then Redeploy.'
            : 'API returned a web page instead of JSON.',
      };
      throw err;
    }
    const err = new Error(data.error || 'error');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  if (!looksJson) {
    const err = new Error('api_missing');
    err.status = res.status;
    err.data = { error: 'api_missing' };
    throw err;
  }
  return data;
}

export async function fetchHealth() {
  try {
    const res = await fetch('/api/health', { credentials: 'include' });
    const text = await res.text();
    const trimmed = (text || '').trim();
    if (!trimmed.startsWith('{')) return { ok: false, error: 'network', hint: '' };
    const data = JSON.parse(trimmed);
    return data && typeof data === 'object' ? data : { ok: false };
  } catch {
    return { ok: false, error: 'network', hint: '' };
  }
}
