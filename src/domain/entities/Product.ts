// src/domain/entities/Product.ts - Updated with alert fields
export interface Product {
    janCode: string;
    productName: string;
    boxQuantity: number;
    supplierCode: string;
    stockInAlert: number;
    stockOutAlert: number;
    createdAt: Date;
    updatedAt: Date;
}
