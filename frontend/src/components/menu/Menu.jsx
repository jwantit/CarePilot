import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getUnreadCount } from "../../api/notificationApi";
import { useAuth } from "../../hooks/useAuth";
import ThemeToggle from "../common/ThemeToggle";

function Menu() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        console.error("읽지 않은 알림 개수 조회 실패:", error);
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

    window.addEventListener(
      "notification-received",
      handleNotificationReceived,
    );
    window.addEventListener("notification-updated", handleNotificationUpdated);

    // 주기적으로 개수 업데이트 (30초마다)
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      window.removeEventListener(
        "notification-received",
        handleNotificationReceived,
      );
      window.removeEventListener(
        "notification-updated",
        handleNotificationUpdated,
      );
      clearInterval(interval);
    };
  }, [userId]);

  const menuItems = [
    { path: "/", label: "대시보드" },
    { path: "/care-target", label: "케어 대상자" },
    { path: "/care-target-group", label: "케어 그룹" },
    { path: "/call", label: "통화" },
    { path: "/task", label: "작업" },
    { path: "/report", label: "통계" },
    { path: "/setting", label: "설정" },
    { path: "/notice", label: "공지사항" },
    { path: "/notification", label: "알림", isIcon: true },
  ];

  const mainMenuItems = menuItems.filter((item) => !item.isIcon);
  const notificationItem = menuItems.find((item) => item.isIcon);

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    // 정확히 일치하거나, 경로 뒤에 / 가 오는 경우만 활성화
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // 화면 크기가 PC 사이즈 이상으로 커지면 모바일 메뉴/유저 드롭다운 자동 닫기
  useEffect(() => {
    const handleResize = () => {
      // CSS에서 1150px 기준으로 데스크탑 메뉴를 노출하므로 동일 기준 사용
      if (window.innerWidth >= 1150) {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    // 초기 한 번 실행해서 현재 화면 크기에 맞게 상태 정리
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav className="bg-cp-card border-b border-cp-border shadow-lg relative z-30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* 로고 영역 */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="CarePilot"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                console.error("Logo failed to load");
                e.target.style.display = "none";
              }}
            />

            <span className="text-2xl font-bold text-cp-text">
              Care<span className="text-teal-400">Pilot</span>
            </span>
          </Link>

          {/* 가운데: 데스크탑 메뉴 (1150px 이상에서만 보이도록 CSS에서 제어) */}
          <div className="menu-desktop flex items-center space-x-1">
            {mainMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 text-base font-bold transition-colors relative ${
                  isActive(item.path)
                    ? "text-teal-400 border-b-2 border-teal-400"
                    : "text-cp-text/70 hover:text-teal-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* 우측 버튼 영역: 화면모드 + 알림 + 유저 드롭다운 + (1150px 이하에서 햄버거) */}
          <div className="flex items-center space-x-2">
            {/* 화면 모드 토글 */}
            <ThemeToggle />

            {/* 알림 아이콘 (항상 우측에 노출) */}
            {notificationItem && (
              <Link
                to={notificationItem.path}
                className="relative flex items-center justify-center w-9 h-9 rounded-full border border-cp-border/70 bg-cp-bg/60 text-cp-text/70 hover:text-teal-400 hover:border-teal-500/60 hover:bg-cp-bg shadow-sm transition-colors"
              >
                {/* 아이콘 */}
                <svg
                  className="w-5 h-5"
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

                {/* 뱃지 */}
                {unreadCount > 0 && (
                  <>
                    {/* 은은한 링 효과 */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/40 blur-[2px] animate-pulse" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-[2px] flex items-center justify-center leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  </>
                )}
              </Link>
            )}

            {/* 유저 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-bold text-cp-text hover:text-teal-400 hover:bg-cp-bg/40 rounded-full transition-colors"
              >
                <span className="max-w-[120px] truncate">
                  {user?.name || user?.email || "유저"}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isUserMenuOpen ? "rotate-180" : ""
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
                  <div className="absolute right-0 mt-2 w-48 bg-cp-card rounded border border-cp-border shadow-xl py-2 z-20">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-cp-text hover:bg-cp-bg/50 hover:text-teal-400 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      개인정보 수정
                    </Link>
                    {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
                      <Link
                        to="/user-management"
                        className="block px-4 py-2 text-sm text-cp-text hover:bg-cp-bg/50 hover:text-teal-400 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        직원 관리
                      </Link>
                    )}
                    <hr className="my-2 border-cp-border" />
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-cp-muted hover:bg-cp-bg/50 hover:text-red-400 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 햄버거 버튼: 1150px 이하에서만 보이도록 CSS에서 제어 */}
            <button
              className="menu-mobile-toggle inline-flex items-center justify-center p-2 rounded-md text-cp-text/70 hover:text-teal-400 hover:bg-cp-bg/40 transition-colors"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span className="sr-only">메뉴 열기</span>
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴: 상단에서 아래로 떨어지는 드롭다운 (콘텐츠는 그대로, 위에 겹쳐서 표시) */}
      {isMobileMenuOpen && (
        <div className="absolute left-0 right-0 top-16 bg-cp-card border-t border-cp-border shadow-xl z-20">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {mainMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`block px-3 py-2 rounded-md text-sm font-semibold ${
                  isActive(item.path)
                    ? "bg-teal-500/10 text-teal-400 border border-teal-500/40"
                    : "text-cp-text/80 hover:bg-cp-bg hover:text-teal-400 border border-transparent"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Menu;
