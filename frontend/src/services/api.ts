import {
  Customer,
  ExecutiveMetrics,
  SegmentSummaryItem,
  TopProductSummaryItem,
  ModelMetricEntry,
  PurchasePredictionResult,
  RecommendationResult,
  HealthResponse,
  Envelope,
  User,
} from '../types/index.ts';

const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const body = await res.json();
  
  if (res.status === 401 || (body?.error && ['INVALID_TOKEN', 'TOKEN_EXPIRED', 'MISSING_TOKEN'].includes(body.error.code))) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    const errorMsg = body?.error?.message || 'Authentication session invalid or expired.';
    throw new Error(errorMsg);
  }

  if (!res.ok || (body.error && body.error !== null)) {
    const errorMsg = body?.error?.message || `HTTP Error ${res.status}`;
    throw new Error(errorMsg);
  }
  return body.data !== undefined ? body.data : body;
}




export const api = {
  getHealth: async (): Promise<HealthResponse> => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  getExecutiveMetrics: async (): Promise<ExecutiveMetrics> => {
    return fetchJson<ExecutiveMetrics>(`${API_BASE}/dashboard/executive`);
  },

  getSegmentsSummary: async (): Promise<SegmentSummaryItem[]> => {
    return fetchJson<SegmentSummaryItem[]>(`${API_BASE}/dashboard/segments`);
  },

  getTopProducts: async (limit = 10): Promise<TopProductSummaryItem[]> => {
    return fetchJson<TopProductSummaryItem[]>(`${API_BASE}/dashboard/products?limit=${limit}`);
  },

  getModelMetrics: async (): Promise<ModelMetricEntry[]> => {
    return fetchJson<ModelMetricEntry[]>(`${API_BASE}/dashboard/model-metrics`);
  },

  getMonthlySales: async (): Promise<{ month: string; revenue: number; orders: number }[]> => {
    return fetchJson<{ month: string; revenue: number; orders: number }[]>(`${API_BASE}/dashboard/analytics/monthly-sales`);
  },

  getCountrySales: async (limit = 8): Promise<{ country: string; revenue: number; orders: number; customers: number }[]> => {
    return fetchJson<{ country: string; revenue: number; orders: number; customers: number }[]>(`${API_BASE}/dashboard/analytics/countries?limit=${limit}`);
  },

  getRfmStats: async (): Promise<Record<string, number>> => {
    return fetchJson<Record<string, number>>(`${API_BASE}/dashboard/analytics/rfm-stats`);
  },

  getRfmDistributions: async (): Promise<{ recency: { bin: string; count: number }[]; frequency: { bin: string; count: number }[]; monetary: { bin: string; count: number }[] }> => {
    return fetchJson<{ recency: { bin: string; count: number }[]; frequency: { bin: string; count: number }[]; monetary: { bin: string; count: number }[] }>(`${API_BASE}/dashboard/analytics/rfm-distributions`);
  },



  getCustomers: async (params?: { limit?: number; offset?: number; segment?: string; search?: string }): Promise<Customer[]> => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    if (params?.segment && params.segment !== 'All') query.set('segment', params.segment);
    if (params?.search) query.set('search', params.search);
    return fetchJson<Customer[]>(`${API_BASE}/customers?${query.toString()}`);
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    return fetchJson<Customer>(`${API_BASE}/customers/${id}`);
  },

  predictPurchase: async (payload: number | { customer_id?: number; recency_days?: number; frequency?: number; monetary?: number }): Promise<PurchasePredictionResult> => {
    const bodyPayload = typeof payload === 'number' ? { customer_id: payload } : payload;
    return fetchJson<PurchasePredictionResult>(`${API_BASE}/predict/purchase`, {
      method: 'POST',
      body: JSON.stringify(bodyPayload),
    });
  },


  getRecommendations: async (customerId: number, topN = 5): Promise<RecommendationResult> => {
    return fetchJson<RecommendationResult>(`${API_BASE}/recommend`, {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId, top_n: topN }),
    });
  },

  login: async (email: string, password: string): Promise<{ access_token: string; refresh_token: string }> => {
    const data = await fetchJson<{ access_token: string; refresh_token: string }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

