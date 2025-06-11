// src/domain/entities/InventoryData.ts
export interface InventoryData {
  id?: number;
  inputDate: string;
  staffCode: string;
  shopCode: string;
  shelfNumber: number;
  shelfPosition: number;
  janCode?: string;
  quantity: number;
  cost: number;
  price: number;
  systemQuantity: number;
  quantityDiscrepancy: number;
  note: string;
  updateDate?: string;
  updateTime?: string;
  createdAt: Date;
  updatedAt: Date;
}