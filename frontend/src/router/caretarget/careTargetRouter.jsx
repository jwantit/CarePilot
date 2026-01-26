import { lazy, Suspense } from 'react';
import Loading from '../../components/common/Loading';

const CareTargetPage = lazy(() => import('../../pages/careTarget/CareTargetPage'));
const CareTargetDetailPage = lazy(() => import('../../pages/careTarget/CareTargetDetailPage'));

const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
);

const careTargetRouter = () => {
  return [
    {
      path: 'care-target',
      children: [
        {
          index: true,
          element: <SuspenseWrapper><CareTargetPage /></SuspenseWrapper>,
        },
        {
          path: 'detail/:targetId',
          element: <SuspenseWrapper><CareTargetDetailPage /></SuspenseWrapper>,
        }
      ]
    }
  ];
};

export default careTargetRouter;