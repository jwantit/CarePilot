import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/menu/Layout';
import Loading from '../components/common/Loading';
import RequireLoginRoute from './RequireLoginRoute';
import careTargetRouter from './caretarget/careTargetRouter';
import careTargetGroupRouter from './caretarget/careTargetGroupRouter';


// Lazy load pages
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const CallPage = lazy(() => import('../pages/call/CallPage'));
const TaskPage = lazy(() => import('../pages/task/TaskPage'));
const ReportPage = lazy(() => import('../pages/report/ReportPage'));
const SettingPage = lazy(() => import('../pages/setting/SettingPage'));
const NoticeListPage = lazy(() => import('../pages/notice/NoticeListPage'));
const NoticeFormPage = lazy(() => import('../pages/notice/NoticeFormPage'));
const NoticeDetailPage = lazy(() => import('../pages/notice/NoticeDetailPage'));
const NotificationPage = lazy(() => import('../pages/notification/NotificationPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const UserManagementPage = lazy(() => import('../pages/usermanagement/UserManagementPage'));

// Lazy load auth pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const OAuth2CompletePage = lazy(() => import('../pages/auth/OAuth2CompletePage'));
const ApprovalPage = lazy(() => import('../pages/auth/ApprovalPage'));

// Wrapper component for Suspense
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
);

const router = createBrowserRouter([
  // 인증 페이지 (로그인 불필요)
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/signup',
    element: (
      <SuspenseWrapper>
        <SignupPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/oauth2/complete',
    element: (
      <SuspenseWrapper>
        <OAuth2CompletePage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/approve',
    element: (
      <SuspenseWrapper>
        <ApprovalPage />
      </SuspenseWrapper>
    ),
  },
  // 보호된 라우트 (로그인 필요)
  {
    path: '/',
    element: <RequireLoginRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <DashboardPage />
              </SuspenseWrapper>
            ),
          },
      {

        index: true,
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      ...careTargetRouter(),

      ...careTargetGroupRouter(),
    
      {
        path: 'call',
        element: (
          <SuspenseWrapper>
            <CallPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'task',
        element: (
          <SuspenseWrapper>
            <TaskPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'report',
        element: (
          <SuspenseWrapper>
            <ReportPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'setting',
        element: (
          <SuspenseWrapper>
            <SettingPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'notice',
        element: (
          <SuspenseWrapper>
            <NoticeListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'notice/create',
        element: (
          <SuspenseWrapper>
            <NoticeFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'notice/:id',
        element: (
          <SuspenseWrapper>
            <NoticeDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'notice/:id/edit',
        element: (
          <SuspenseWrapper>
            <NoticeFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'notification',
        element: (
          <SuspenseWrapper>
            <NotificationPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'profile',
        element: (
          <SuspenseWrapper>
            <ProfilePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'user-management',
        element: (
          <SuspenseWrapper>
            <UserManagementPage />
          </SuspenseWrapper>
        ),
      },
        ],
      },
    ],
  },
]);

export default router;
