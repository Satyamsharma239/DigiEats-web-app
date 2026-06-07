import { createSlice } from "@reduxjs/toolkit";

const getInitialCartItems = () => {
  const storedItems = localStorage.getItem("cartItems");
  if (storedItems) {
    return JSON.parse(storedItems);
  }
  return [];
};

const getInitialTotalAmount = () => {
  const storedAmount = localStorage.getItem("totalAmount");
  if (storedAmount) {
    return JSON.parse(storedAmount);
  }
  return 0;
};

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    shopInMyCity: null,
    itemsInMyCity: null,
    cartItems: getInitialCartItems(),
    totalAmount: getInitialTotalAmount(),
    myOrders: [],
    searchItems: null,
    socket: null
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload
    },
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload
    },
    setShopsInMyCity: (state, action) => {
      state.shopInMyCity = action.payload
    },
    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = action.payload
    },
    setSocket: (state, action) => {
      state.socket = action.payload
    },

    addToCart: (state, action) => {
      const cartItem = action.payload
      const existingItem = state.cartItems.find(i => i.id === cartItem.id)
      if (existingItem) {
        existingItem.quantity = cartItem.quantity
      } else {
        state.cartItems.push(cartItem)
      }
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems))
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount))
    },

    setTotalAmount: (state, action) => {
      state.totalAmount = action.payload
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount))
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.cartItems.find(i => i.id === id)
      if (item) {
        item.quantity = quantity
      }
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems))
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount))
    },
    removeCartItem: (state, action) => {
      state.cartItems = state.cartItems.filter(i => i.id !== action.payload)
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems))
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount))
    },

    // NEW: Added this specifically for the FoodCard minus button
    removeFromCart: (state, action) => {
      const { id } = action.payload
      state.cartItems = state.cartItems.filter(i => i.id !== id)
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems))
      localStorage.setItem("totalAmount", JSON.stringify(state.totalAmount))
    },

    setMyOrders: (state, action) => {
      state.myOrders = action.payload
    },
    addMyOrder: (state, action) => {
      state.myOrders = [action.payload, ...state.myOrders]
    },
    updateOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload
      const order = state.myOrders.find(o => o._id === orderId)
      if (order) {
        if (order.shopOrders && order.shopOrders.shop._id === shopId) {
          order.shopOrders.status = status
        }
      }
    },
    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload
      const order = state.myOrders.find(o => o._id === orderId)
      if (order) {
        if (Array.isArray(order.shopOrders)) {
          const shopOrder = order.shopOrders.find(so => so.shop._id === shopId)
          if (shopOrder) {
            shopOrder.status = status
          }
        }
      }
    },
    setSearchItems: (state, action) => {
      state.searchItems = action.payload
    },
    clearCart: (state) => {
      state.cartItems = []
      state.totalAmount = 0
      localStorage.removeItem("cartItems")
      localStorage.removeItem("totalAmount")
    }
  }
})

export const {
  setUserData,
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
  setShopsInMyCity,
  setItemsInMyCity,
  addToCart,
  updateQuantity,
  removeCartItem,
  removeFromCart, // <-- Make sure to export this new action!
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  setSearchItems,
  setTotalAmount,
  setSocket,
  updateRealtimeOrderStatus,
  clearCart
} = userSlice.actions

export default userSlice.reducer
