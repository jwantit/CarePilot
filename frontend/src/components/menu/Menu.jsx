import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUnreadCount } from '../../api/notificationApi';
import { useAuth } from '../../hooks/useAuth';

function Menu() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Redux에서 사용자 정보 가져오기
  const userId = user?.userId;

  // 읽지 않은 알림 개수 조회
  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount(userId);
        setUnreadCount(count);
      } catch (error) {
        console.error('읽지 않은 알림 개수 조회 실패:', error);
      }
    };

    fetchUnreadCount();

    // 새 알림이 도착하거나 읽음 처리되면 개수 업데이트
    const handleNotificationReceived = () => {
      fetchUnreadCount();
    };

    const handleNotificationUpdated = () => {
      fetchUnreadCount();
    };

    window.addEventListener('notification-received', handleNotificationReceived);
    window.addEventListener('notification-updated', handleNotificationUpdated);

    // 주기적으로 개수 업데이트 (30초마다)
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      window.removeEventListener('notification-received', handleNotificationReceived);
      window.removeEventListener('notification-updated', handleNotificationUpdated);
      clearInterval(interval);
    };
  }, [userId]);

  const menuItems = [
    { path: '/', label: '대시보드' },
    { path: '/care-target', label: '케어 대상자' },
    { path: '/care-target-group', label: '케어 그룹' },
    { path: '/call', label: '통화' },
    { path: '/task', label: '작업' },
    { path: '/report', label: '보고서' },
    { path: '/setting', label: '설정' },
    { path: '/notice', label: '공지사항' },
    { path: '/notification', label: '알림', isIcon: true },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    // 정확히 일치하거나, 경로 뒤에 / 가 오는 경우만 활성화
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* 로고 영역 */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="CarePilot"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                console.error('Logo failed to load');
                e.target.style.display = 'none';
              }}
            />
            <span className="text-xl font-semibold" style={{ color: '#333' }}>
              Care<span className="text-teal-500">Pilot</span>
            </span>
          </Link>

          {/* 메뉴 항목들 */}
          <div className="flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 text-base font-semibold transition-colors relative ${
                  isActive(item.path)
                    ? 'text-teal-600'
                    : 'hover:text-teal-600'
                }`}
                style={{ color: isActive(item.path) ? undefined : '#333' }}
              >
                {item.isIcon ? (
                  <div className="relative">
                    {/* 벨 아이콘 */}
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {/* 읽지 않은 알림 개수 배지 */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                ) : (
                  item.label
                )}
              </Link>
            ))}
          </div>

          {/* 우측 버튼 영역 */}
          <div className="flex items-center space-x-3">
            {/* 유저 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 px-4 py-2 text-base font-semibold hover:text-teal-600 transition-colors"
                style={{ color: '#333' }}
              >
                <span>{user?.name || user?.email || '유저'}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-20 border border-gray-100">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-base hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      style={{ color: '#333' }}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      개인 정보
                    </Link>
                    <Link
                      to="/user-management"
                      className="block px-4 py-2 text-base hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      style={{ color: '#333' }}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      회원 관리
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Menu;

