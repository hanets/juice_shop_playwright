export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  deluxePrice: number;
  image: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProductSearchResponse {
  status: string;
  data: Product[];
}
