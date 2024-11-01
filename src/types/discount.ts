export interface Discount {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    minValue?: number;
    maxUses?: number;
    usedCount: number;
    validFrom: Date;
    validUntil: Date;
    active: boolean;
}

export interface DiscountUse {
    id: string;
    discountId: string;
    userId: string;
    usedAt: Date;
    orderId?: string;
}

export interface ApplyDiscountResponse {
    subtotal: number;
    discountAmount: number;
    total: number;
    discount: {
        code: string;
        type: string;
        value: number;
    };
}
