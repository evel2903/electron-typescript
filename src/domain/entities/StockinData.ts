// src/domain/entities/StockinData.ts
export interface StockinData {
    id?: number;
    inputDate: string;
    supplierCode?: string;
    supplierName?: string;
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
    ignoreTrigger: boolean;
    createdAt: Date;
    updatedAt: Date;
}
