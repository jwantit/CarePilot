import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../../api/authApi';
import { extractUserInfo } from '../../utils/authUtils';

// 초기 상태
const initialState = {
  user: null, // { userId, role, organizationId, status }
  isAuthenticated: false,
  isInitialized: false, // 앱 초기화 여부
  loading: false,
  error: null,
};

// 비동기 액션: 로그인 (에러 처리는 호출부에서)
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // 로그인 요청 (토큰은 쿠키로 설정됨)
      await authApi.login(credentials);
      
      // 로그인 성공 후 실제 사용자 정보를 다시 가져옴 (쿠키가 설정된 후)
      const userInfo = await authApi.getCurrentUserInfo();
      const user = extractUserInfo(userInfo);
      
      if (!user) {
        return rejectWithValue({
          message: '사용자 정보를 가져올 수 없습니다.',
          code: 'INVALID_USER_INFO',
        });
      }
      
      return { user };
    } catch (error) {
      // 로그인 실패는 일반 에러로 처리 (리다이렉트 없음)
      // 백엔드 응답: {error: "BAD_CREDENTIALS"} 또는 {error: "NOT_APPROVED"}
      const backendError = error.response?.data?.error;
      let message = '로그인에 실패했습니다.';
      
      if (backendError === 'BAD_CREDENTIALS') {
        message = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (backendError === 'NOT_APPROVED') {
        message = '승인되지 않은 계정입니다. 관리자 승인 후 로그인할 수 있습니다.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      return rejectWithValue({
        message,
        code: backendError || (error.response?.status === 401 ? 'INVALID_CREDENTIALS' : 'LOGIN_ERROR'),
        status: error.response?.status,
      });
    }
  }
);

// 비동기 액션: 로그아웃
export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return null;
    } catch (error) {
      // 로그아웃 실패해도 상태는 초기화
      console.error('로그아웃 실패:', error);
      return null;
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
      const message = error.response?.data?.message || error.message || '회원가입에 실패했습니다.';
      return rejectWithValue({ message, code: 'SIGNUP_ERROR' });
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
      const message = error.response?.data?.message || error.message || '회원가입에 실패했습니다.';
      return rejectWithValue({ message, code: 'SIGNUP_ERROR' });
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
      const message = error.response?.data?.message || error.message || '승인에 실패했습니다.';
      return rejectWithValue({ message, code: 'APPROVE_ERROR' });
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
      const message = error.response?.data?.message || error.message || '회원가입에 실패했습니다.';
      return rejectWithValue({ message, code: 'SIGNUP_ERROR' });
    }
  }
);

// 비동기 액션: 인증 상태 초기화 (앱 시작 시)
export const initializeAuthAsync = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue, getState }) => {
    // 이미 초기화 완료된 경우에만 스킵 (loading 체크 제거 - pending 상태에서 항상 true이므로)
    const state = getState();
    
    // isInitialized만 체크 (loading은 pending 상태에서 항상 true이므로 제외)
    if (state.auth.isInitialized) {
      return state.auth.user ? { user: state.auth.user } : { user: null };
    }

    try {
      const userInfo = await authApi.getCurrentUserInfo();
      const user = extractUserInfo(userInfo);
      
      if (!user) {
        console.error('[initializeAuthAsync] 사용자 정보 추출 실패');
        return rejectWithValue({
          message: '사용자 정보를 가져올 수 없습니다.',
          code: 'INVALID_USER_INFO',
        });
      }
      
      return { user };
    } catch (error) {
      // 401은 정상 (로그인 안 된 상태)
      if (error.response?.status === 401) {
        return { user: null };
      }
      
      // 기타 에러는 로그 출력
      console.error('[initializeAuthAsync] 인증 상태 확인 실패', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
      
      return rejectWithValue({
        message: '인증 상태 확인에 실패했습니다.',
        code: 'AUTH_CHECK_ERROR',
      });
    }
  }
);

// Slice 생성
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 인증 정보 설정 (직접 사용자 정보를 설정할 때 사용)
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated ?? true;
      state.error = null;
    },
    // 인증 상태 초기화
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    // 인증 상태 리셋 (resetAuth로 이름 변경)
    resetAuth: (state) => {
      console.warn('[authSlice] resetAuth 호출됨 - 로그아웃 처리');
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
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
        console.log('[authSlice] 로그인 성공', {
          userId: action.payload.user?.userId,
          role: action.payload.user?.role,
        });
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        console.warn('[authSlice] 로그인 실패', action.payload);
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
        console.log('[authSlice] 로그아웃 완료');
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

    // 인증 초기화
    builder
      .addCase(initializeAuthAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuthAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        if (action.payload.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          console.log('[authSlice] 인증 초기화 완료 - 로그인 상태 유지', {
            userId: action.payload.user.userId,
            role: action.payload.user.role,
          });
        } else {
          state.user = null;
          state.isAuthenticated = false;
          console.log('[authSlice] 인증 초기화 완료 - 로그인 안 된 상태');
        }
        state.error = null;
      })
      .addCase(initializeAuthAsync.rejected, (state, action) => {
        console.error('[authSlice] 인증 초기화 실패', action.payload);
        state.loading = false;
        state.isInitialized = true;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
  },
});

export const { setCredentials, clearAuth, resetAuth, clearError } = authSlice.actions;
export default authSlice.reducer;

