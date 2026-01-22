import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Menu() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const menuItems = [
    { path: '/', label: '대시보드' },
    { path: '/care-target', label: '케어 대상자' },
    { path: '/care-target-group', label: '케어 그룹' },
    { path: '/call', label: '통화' },
    { path: '/task', label: '작업' },
    { path: '/report', label: '보고서' },
    { path: '/setting', label: '설정' },
    { path: '/notification', label: '알림' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    // 정확히 일치하거나, 경로 뒤에 / 가 오는 경우만 활성화
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 메뉴 항목들 */}
          <div className="flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* 유저 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>유저</span>
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    개인 정보
                  </Link>
                  <Link
                    to="/user-management"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    회원 관리
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      // 로그아웃 로직 추가
                      console.log('로그아웃');
                      setIsUserMenuOpen(false);
                      // navigate('/login'); // 로그인 페이지로 이동
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    로그아웃
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Menu;

