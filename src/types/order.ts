import { Product } from "./product";

export interface Order {
    id: string;
    userId: string;
    status: OrderStatus;
    products: OrderProduct[];
    subtotal: number;
    total: number;
    discountId?: string;
}

export interface OrderProduct {
    productId: string;
    product: {
        name: string;
        price: number;
    };
}

export enum OrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}