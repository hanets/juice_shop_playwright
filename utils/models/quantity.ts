export interface Quantity {
  ProductId: number;
  id: number;
  quantity: number;
  limitPerUser: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuantitiesResponse {
  status: 'success' | 'error';
  data: Quantity[];
}
