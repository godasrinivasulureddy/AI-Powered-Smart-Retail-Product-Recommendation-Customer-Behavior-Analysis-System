export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface Envelope<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
}

export interface Customer {
  id: number;
  external_id: string;
  country: string;
  created_at: string;
  features?: CustomerFeatures;
  segment?: CustomerSegment;
  recent_orders?: Order[];
}

export interface CustomerFeatures {
  customer_id: number;
  recency_days: number;
  frequency: number;
  monetary: number;
  avg_order_value: number;
  last_computed_at: string;
}

export interface CustomerSegment {
  customer_id: number;
  model_version: string;
  segment_label: string;
  computed_at: string;
}

export interface Product {
  id: number;
  external_id: string;
  description: string;
  unit_price: number;
  category?: string;
  total_units_sold?: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  line_revenue: number;
}

export interface Order {
  id: number;
  invoice_no: string;
  customer_id: number;
  order_date: string;
  country: string;
  total_amount: number;
  items: OrderItem[];
}

export interface PurchasePredictionResult {
  customer_id: number;
  probability: number;
  prediction: boolean;
  model_version: string;
  risk_level?: 'Low' | 'Medium' | 'High';
  factors?: { feature: string; impact: number; description: string }[];
}

export interface RecommendationItem {
  product_id: number;
  external_id: string;
  description: string;
  score: number;
  reason: string;
  unit_price?: number;
}

export interface RecommendationResult {
  customer_id: number;
  model_version: string;
  recommendations: RecommendationItem[];
}

export interface ExecutiveMetrics {
  total_customers: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
}

export interface CustomersSummary {
  total_customers: number;
  customers_with_orders: number;
}

export interface SegmentSummaryItem {
  segment_label: string;
  count: number;
  percentage?: number;
  color?: string;
}

export interface TopProductSummaryItem {
  product_id: number;
  external_id: string;
  description: string;
  units_sold: number;
  revenue?: number;
}

export interface ModelMetricEntry {
  model_name: string;
  version: string;
  metrics: Record<string, number | string | Record<string, number>>;
  trained_at: string;
  is_active?: boolean;
}

export interface HealthResponse {
  status: string;
  env: string;
  version: string;
}
