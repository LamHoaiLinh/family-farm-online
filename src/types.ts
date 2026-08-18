export type CropId =
  | 'wheat'|'corn'|'carrot'|'soybean'|'sugarcane'|'potato'|'sweet_potato'|'tomato'|'lettuce'|'cabbage'
  | 'onion'|'bell_pepper'|'pumpkin'|'strawberry'|'watermelon'|'pineapple'|'grape'|'orange'|'apple'|'mango';

export interface CropConfig {
  id: CropId;
  name: string;
  emoji: string;
  level: number;
  seedCost: number;
  growMinutes: number;
  baseYield: number;
  sellPrice: number;
  exp: number;
  waterToleranceHours: number;
  diseaseRisk: number;
  category: 'ruộng'|'vườn';
  colors: string[];
}

export interface PlotState {
  id: string;
  row: number;
  col: number;
  cropId?: CropId;
  plantedAt?: string;
  wateredAt?: string;
  harvestAt?: string;
  deadAt?: string;
  deathReason?: string;
  stolenTotal?: number;
}

export interface PlayerState {
  id: string;
  name: string;
  level: number;
  exp: number;
  gold: number;
  diamonds: number;
  warehouseCapacity: number;
  inventoryUsed: number;
}
