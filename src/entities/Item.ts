export interface ShopItem {
  id: string;
  name: string;
  category: 'food' | 'drink' | 'automotive' | 'household';
  purchasePrice: number;
  salePrice: number;
  stock: number;
  maxStock: number;
  description: string;
}
