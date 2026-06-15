const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
  }
  return 'https://api.vortiq.in'; // Production fallback
};

export const vortiqClient = {
  async callQuery(procedure: string, input: any = {}) {
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('vortiq-org-id') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('vortiq-user-id') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (orgId) headers['x-org-id'] = orgId;
    if (userId) headers['x-user-id'] = userId;
    
    const queryParam = encodeURIComponent(JSON.stringify(input));
    const url = `${getApiUrl()}/trpc/${procedure}?input=${queryParam}`;
    
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || err.message || 'API query failed';
      throw new Error(msg);
    }
    const json = await res.json();
    return json.result.data;
  },

  async callMutation(procedure: string, input: any = {}) {
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('vortiq-org-id') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('vortiq-user-id') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (orgId) headers['x-org-id'] = orgId;
    if (userId) headers['x-user-id'] = userId;
    
    const url = `${getApiUrl()}/trpc/${procedure}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || err.message || 'API mutation failed';
      throw new Error(msg);
    }
    const json = await res.json();
    return json.result.data;
  }
};
export default vortiqClient;
