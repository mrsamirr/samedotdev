import { createSlice } from "@reduxjs/toolkit";

interface SidebarState {
  sidebarToggle: boolean;
}

const initialState: SidebarState = {
  sidebarToggle: false,
};

export const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarToggle = !state.sidebarToggle;
    },
    setSidebar: (state, action: { payload: boolean }) => {
      state.sidebarToggle = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebar } = sidebarSlice.actions;
export default sidebarSlice.reducer;
