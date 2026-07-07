import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  customerId: null,
  customerName: null,
  discountType: null, // 'PERCENT' | 'FLAT' | null
  discountAmount: 0,
  orderNote: '',
  subtotal: 0,
  totalAmount: 0,
};

const calculateTotals = (state) => {
  // Recalculate subtotal
  state.subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Recalculate discount
  let discountValue = 0;
  if (state.discountType === 'PERCENT') {
    const pct = Math.min(100, Math.max(0, state.discountAmount));
    discountValue = state.subtotal * (pct / 100);
  } else if (state.discountType === 'FLAT') {
    discountValue = Math.min(state.subtotal, Math.max(0, state.discountAmount));
  }

  // Recalculate total (non-negative)
  state.totalAmount = Math.max(0, state.subtotal - discountValue);
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action) {
      const { id, name, price, imageUrl } = action.payload;
      const existing = state.items.find(item => item.productId === id);
      if (existing) {
        existing.quantity += 1;
        existing.lineTotal = existing.price * existing.quantity;
      } else {
        state.items.push({
          productId: id,
          name,
          price,
          quantity: 1,
          lineTotal: price,
          imageUrl: imageUrl || null
        });
      }
      calculateTotals(state);
    },
    removeFromCart(state, action) {
      const productId = action.payload;
      state.items = state.items.filter(item => item.productId !== productId);
      calculateTotals(state);
    },
    updateQuantity(state, action) {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.productId === productId);
      if (item && quantity > 0) {
        item.quantity = quantity;
        item.lineTotal = item.price * item.quantity;
      }
      calculateTotals(state);
    },
    setCustomer(state, action) {
      state.customerId = action.payload?.id || null;
      state.customerName = action.payload?.name || null;
    },
    setDiscount(state, action) {
      const { type, amount } = action.payload;
      state.discountType = type; // 'PERCENT' | 'FLAT' | null
      state.discountAmount = amount;
      calculateTotals(state);
    },
    setOrderNote(state, action) {
      state.orderNote = action.payload;
    },
    clearCart(state) {
      return initialState;
    },
    // Allows updating cart state after authoritative recalculation by backend
    setAuthoritativeTotals(state, action) {
      const { subtotal, totalAmount } = action.payload;
      state.subtotal = subtotal;
      state.totalAmount = totalAmount;
    }
  }
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setCustomer,
  setDiscount,
  setOrderNote,
  clearCart,
  setAuthoritativeTotals
} = cartSlice.actions;

export default cartSlice.reducer;
