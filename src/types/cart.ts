// Primeiro, vamos criar os tipos necessários
export interface AddToCartData {
    productId: string;
}

export interface CartProduct {
    cartId: string;
    productId: string;
}
