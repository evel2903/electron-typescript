// src/domain/entities/Product.ts
export interface Product {
    janCode: string;
    productName: string;
    boxQuantity: number;
    supplierCode: string;
    createdAt: Date;
    updatedAt: Date;
}
