import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../utils/api";
import { toast } from "sonner";

// ✅ Add to Wishlist
export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async ({ product_id }, { rejectWithValue }) => {
    try {
      const response = await api.post("/wishlist", { product_id });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add to wishlist"
      );
    }
  }
);

// ✅ Fetch Wishlist
export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/wishlist");
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue("Failed to fetch wishlist");
    }
  }
);

// ✅ Remove from Wishlist
export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (product_id, { rejectWithValue }) => {
    try {
      await api.delete(`/wishlist/${product_id}`);
      return product_id;
    } catch (error) {
      return rejectWithValue("Failed to remove from wishlist");
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.items.push(action.payload);
        toast.success("Added to wishlist!");
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        toast.error(action.payload);
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item.product_id !== action.payload
        );
        toast.success("Removed from wishlist");
      });
  },
});

export default wishlistSlice.reducer;
