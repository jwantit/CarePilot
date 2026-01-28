import { lazy, Suspense } from 'react';
import Loading from '../../components/common/Loading';

// 지연 로딩(Lazy Loading) 설정
const CareTargetGroupPage = lazy(() => import('../../pages/careTargetGroup/CareTargetGroupPage'));
const CareTargetGroupDetailPage = lazy(() => import('../../pages/careTargetGroup/CareTargetGroupDetailPage'));
// 만약 상세 페이지나 등록 페이지가 추가로 있다면 여기에 import를 추가하세요.

// Suspense 공통 래퍼 컴포넌트
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
);


const careTargetGroupRouter = () => {
    return [
      {
        path: 'care-target-group',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <CareTargetGroupPage />
              </SuspenseWrapper>
            ),
          },
          {
            // 수정: 'detail/:groupId'로 변경 (중간에 / 필수)
            path: 'detail/:groupId', 
            element: (
              <SuspenseWrapper>
                <CareTargetGroupDetailPage />
              </SuspenseWrapper>
            ),
          } 
        ],
      },
    ];
  };
  
  export default careTargetGroupRouter;