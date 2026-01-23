import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/menu/Layout';
import Loading from '../components/common/Loading';

// Lazy load pages
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const CareTargetPage = lazy(() => import('../pages/careTarget/CareTargetPage'));
const CareTargetGroupPage = lazy(() => import('../pages/careTargetGroup/CareTargetGroupPage'));
const CallPage = lazy(() => import('../pages/call/CallPage'));
const TaskPage = lazy(() => import('../pages/task/TaskPage'));
const ReportPage = lazy(() => import('../pages/report/ReportPage'));
const SettingPage = lazy(() => import('../pages/setting/SettingPage'));
const NoticePage = lazy(() => import('../pages/notice/NoticePage'));
const NotificationPage = lazy(() => import('../pages/notification/NotificationPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const UserManagementPage = lazy(() => import('../pages/usermanagement/UserManagementPage'));

// Wrapper component for Suspense
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
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
        path: 'care-target',
        element: (
          <SuspenseWrapper>
            <CareTargetPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'care-target-group',
        element: (
          <SuspenseWrapper>
            <CareTargetGroupPage />
          </SuspenseWrapper>
        ),
      },
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
            <NoticePage />
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
]);

export default router;
