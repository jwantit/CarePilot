import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCareTargetList } from '../../api/caretarget/careTargetGroupApi';
// 호출할 API 함수명을 실제 사용하는 이름으로 변경해서 임포트하세요.

// 비동기 Thunk 생성
export const fetchCareTargets = createAsyncThunk(
  'careTarget/fetchAll',
  async ({ organizationId }, { rejectWithValue }) => {
    try {
      // API 정의서에 따라 organizationId만 전달
      const data = await getCareTargetList(organizationId);
      
      // 콘솔로 데이터가 잘 들어오는지 확인 (디버깅용)
      console.log("API Response Data:", data);
      
      return data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || "데이터 로딩 실패");
    }
  }
);

const careTargetSlice = createSlice({
  name: 'careTarget',
  initialState: {
    list: [],        
    loading: false,
    error: null,
  },
  reducers: {
    clearList: (state) => {
      state.list = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCareTargets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCareTargets.fulfilled, (state, action) => {
        state.loading = false;
        // API에서 온 배열 데이터를 list 상태에 저장
        state.list = action.payload;
      })
      .addCase(fetchCareTargets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearList } = careTargetSlice.actions;
export default careTargetSlice.reducer;