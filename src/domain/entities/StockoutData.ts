// src/domain/entities/StockoutData.ts
export interface StockoutData {
  id?: number;
  inputDate: string;
  supplierCode: string;
  slipNumber: string;
  location: string;
  shelfNo: number;
  shelfPosition: number;
  productCode: string;
  quantity: number;
  staffCode: string;
  shopCode: string;
  note: string;
  updateDate?: string;
  updateTime?: string;
  deptCode: string;
  deptName: string;
  ignoreTrigger: boolean;
  createdAt: Date;
  updatedAt: Date;
}