import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

export interface CartItem {
  link: string;
  title?: string;
  snippet?: string;
  source?: string;
  content?: string;
  origin?: 'rss' | 'serper';
  isAlert?: boolean;
  matchedKeywords?: string[];
  articleId?: string | number;
  addedAt?: string | Date;
  [key: string]: unknown;
}

interface CartState {
  items: Record<string, CartItem>;
  isVisible: boolean;
}

const initialState: CartState = {
  items: {},
  isVisible: false,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const item = action.payload;
      if (item.link) {
        state.items[item.link] = {
          ...item,
          articleId: item.articleId || item.link,
        };
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      const link = action.payload;
      delete state.items[link];
    },
    clearCart(state) {
      state.items = {};
    },
    toggleCartVisibility(state) {
      state.isVisible = !state.isVisible;
    },
    setCartVisibility(state, action: PayloadAction<boolean>) {
      state.isVisible = action.payload;
    },
    addMultipleToCart(state, action: PayloadAction<CartItem[]>) {
      action.payload.forEach(item => {
        if (item.link) {
          state.items[item.link] = {
            ...item,
            articleId: item.articleId || item.link,
          };
        }
      });
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  toggleCartVisibility,
  setCartVisibility,
  addMultipleToCart,
} = cartSlice.actions;

export default cartSlice.reducer;

export const selectCartItems = (state: RootState) => Object.values(state.cart.items);
export const selectCartItemsCount = (state: RootState) => Object.keys(state.cart.items).length;
export const selectCartIsVisible = (state: RootState) => state.cart.isVisible;
export const selectIsInCart = (link: string) => (state: RootState) => Boolean(state.cart.items[link]);
export const selectCartItem = (link: string) => (state: RootState) => state.cart.items[link];
