import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../../api/authApi';
import { setTokens, removeTokens, getUserFromToken } from '../../utils/authTokenUtils';
import { handleApiError } from '../../utils/errorUtils';

// 초기 상태
const initialState = {
  user: null, // { userId, role, organizationId, status }
  isAuthenticated: false,
  loading: false,
  error: null,
};

// 비동기 액션: 로그인
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      // 토큰 저장
      setTokens(response.accessToken, response.refreshToken);
      // 사용자 정보 추출
      const user = getUserFromToken();
      return { user, tokens: response };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// 비동기 액션: 로그아웃
export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      removeTokens();
      return null;
    } catch (error) {
      // 로그아웃 실패해도 토큰은 제거
      removeTokens();
      handleApiError(error);
      return rejectWithValue(error.message);
    }
  }
);

// 비동기 액션: 업체 회원가입
export const signupOrganizationAsync = createAsyncThunk(
  'auth/signupOrganization',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.signupOrganization(data);
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// 비동기 액션: 직원 회원가입
export const signupUserAsync = createAsyncThunk(
  'auth/signupUser',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.signupUser(data);
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// 비동기 액션: 사용자 승인
export const approveUserAsync = createAsyncThunk(
  'auth/approveUser',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authApi.approveUser(token);
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// 비동기 액션: USER 소셜 회원가입
export const signupUserOAuth2Async = createAsyncThunk(
  'auth/signupUserOAuth2',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.signupUserOAuth2(data);
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Slice 생성
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 로컬 스토리지에서 사용자 정보 복원
    restoreAuth: (state) => {
      const user = getUserFromToken();
      if (user) {
        state.user = user;
        state.isAuthenticated = true;
      }
    },
    // 인증 정보 설정 (OAuth2 콜백 등에서 사용)
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated || true;
      state.error = null;
    },
    // 인증 상태 초기화
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      removeTokens();
    },
    // 에러 초기화
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 로그인
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // 로그아웃
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });

    // 업체 회원가입
    builder
      .addCase(signupOrganizationAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupOrganizationAsync.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signupOrganizationAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // 직원 회원가입
    builder
      .addCase(signupUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUserAsync.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signupUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // 사용자 승인
    builder
      .addCase(approveUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveUserAsync.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(approveUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // USER 소셜 회원가입
    builder
      .addCase(signupUserOAuth2Async.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUserOAuth2Async.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signupUserOAuth2Async.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { restoreAuth, setCredentials, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;

