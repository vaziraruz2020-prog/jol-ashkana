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
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const err = new Error('api_missing');
    err.status = res.status;
    err.data = { error: 'api_missing' };
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data.error || 'error');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchHealth() {
  try {
    const res = await fetch('/api/health', { credentials: 'include' });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return data && typeof data === 'object' ? data : { ok: false };
  } catch {
    return { ok: false, error: 'network', hint: '' };
  }
}
