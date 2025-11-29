export type Item = {
  id: string;
  name: string;
  variant?: string;
  image?: string;
  volume: number;
  price: number;
  amount?: number;
  barcodes?: string[];
  nutrition_info?: NutritionInfo[];
  is_active?: boolean;
};

type NutritionInfo = {
  name: string;
  value: string;
};
