import { Product } from "./product";

export interface Order {
    id: string;
    userId: string;
    status: OrderStatus;
    products: OrderProduct[];
    subtotal: number;
    total: number;
    discountId?: string;
    createdAt: Date;
}

export interface OrderProduct {
    productId: string;
    product: {
        id: string;
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

export interface OrderWithDetails extends Order {
    products: OrderProduct[];
    discount?: {
        code: string;
        type: string;
        value: number;
    } | null;
}