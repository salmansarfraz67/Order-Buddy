export type OrderStatus = 'New' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
export type ProductType = 'Physical' | 'Digital';

export interface Order {
  id: string;
  userId: string; 
  customerName: string;
  phone: string;
  address?: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
  status: OrderStatus;
  type: ProductType;
  trackingNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  uid: string;
  shopName: string;
  phone?: string;
  email?: string;
  address?: string;
  planName?: string;
  daysRemaining?: number;
  subscriptionExpiryDate?: string; // Stores the exact date/time the sub ends
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'suspended';
  createdAt?: string;
}

export type ViewState = 'landing' | 'login' | 'dashboard' | 'privacy' | 'terms' | 'upgrade' | 'admin';

export interface PricingPlan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
}