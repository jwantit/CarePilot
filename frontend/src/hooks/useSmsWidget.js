import { useState, useEffect, useRef, useCallback } from 'react';
import { getSmsMessages, sendSmsTest } from '../api/callApi';
import { getCareTargetAllList } from '../api/caretarget/careTargetApi';
import { useAuth } from './useAuth';

const DEBOUNCE_MS = 300;
const MIN_W = 320;
const MIN_H = 400;

/**
 * 전화번호 비교용: 숫자만 추출하여 정규화
 * (01012345678, +821012345678 → 동일 비교 가능)
 * @param {string} phone - 원본 번호
 * @returns {string} 숫자만 남긴 문자열 (82 접두는 0으로)
 */
const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '').replace(/^82/, '0') || '';
};

/**
 * SMS 위젯의 모든 상태·로직을 담는 훅.
 * - 위젯 열림/닫힘, 미확인 문자 수(배지), 메시지 목록, 케어대상자 검색·선택
 * - 창 리사이즈, 문자 발송, WebSocket 미확인 이벤트 구독
 * @returns {object} 패널 UI에 넘길 props + open/close 핸들러
 */
export function useSmsWidget() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const [isOpen, setIsOpen] = useState(false);
  const [smsUnreadCount, setSmsUnreadCount] = useState(0);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  const [size, setSize] = useState({ width: 450, height: 600 });
  const resizeRef = useRef({ edge: null, startX: 0, startY: 0, startW: 0, startH: 0 });

  const [careTargetSearch, setCareTargetSearch] = useState('');
  const [careTargetList, setCareTargetList] = useState([]);
  const [showCareTargetDropdown, setShowCareTargetDropdown] = useState(false);
  const [selectedCareTargetDisplay, setSelectedCareTargetDisplay] = useState('');
  const [loadingCareTargets, setLoadingCareTargets] = useState(false);

  const getMaxSize = () => ({
    w: typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.9) : 900,
    h: typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.85) : 800,
  });

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /**
   * 창 테두리/꼭짓점 드래그로 크기 조절 시작.
   * mousedown 시 커서·userSelect 설정 후, mousemove/mouseup 리스너 등록.
   * @param {MouseEvent} e - 마우스 이벤트
   * @param {string} edge - 'top'|'bottom'|'left'|'right'|'top-left'|'top-right'|'bottom-left'|'bottom-right'
   */
  const handleResizeStart = useCallback((e, edge) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
    };
    const cursors = {
      right: 'ew-resize',
      left: 'ew-resize',
      top: 'ns-resize',
      bottom: 'ns-resize',
      'top-left': 'nwse-resize',
      'top-right': 'nesw-resize',
      'bottom-left': 'nesw-resize',
      'bottom-right': 'nwse-resize',
    };
    document.body.style.cursor = cursors[edge] || '';
    document.body.style.userSelect = 'none';

    const onMove = (e2) => {
      const { edge: ed, startX: sx, startY: sy, startW: sw, startH: sh } = resizeRef.current;
      if (!ed) return;
      const { w: maxW, h: maxH } = getMaxSize();
      setSize((prev) => {
        let w = prev.width;
        let h = prev.height;
        if (ed === 'right') w = clamp(sw + (e2.clientX - sx), MIN_W, maxW);
        else if (ed === 'left') w = clamp(sw + (sx - e2.clientX), MIN_W, maxW);
        else if (ed === 'bottom') h = clamp(sh + (e2.clientY - sy), MIN_H, maxH);
        else if (ed === 'top') h = clamp(sh + (sy - e2.clientY), MIN_H, maxH);
        else if (ed === 'top-left') {
          w = clamp(sw + (sx - e2.clientX), MIN_W, maxW);
          h = clamp(sh + (sy - e2.clientY), MIN_H, maxH);
        } else if (ed === 'top-right') {
          w = clamp(sw + (e2.clientX - sx), MIN_W, maxW);
          h = clamp(sh + (sy - e2.clientY), MIN_H, maxH);
        } else if (ed === 'bottom-left') {
          w = clamp(sw + (sx - e2.clientX), MIN_W, maxW);
          h = clamp(sh + (e2.clientY - sy), MIN_H, maxH);
        } else if (ed === 'bottom-right') {
          w = clamp(sw + (e2.clientX - sx), MIN_W, maxW);
          h = clamp(sh + (e2.clientY - sy), MIN_H, maxH);
        }
        return { width: w, height: h };
      });
    };
    const onUp = () => {
      resizeRef.current.edge = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [size.width, size.height]);

  /**
   * 케어대상자 목록 API 호출 (키워드 검색).
   * organizationId 없으면 호출하지 않음.
   * @param {string} [keyword] - 검색어
   */
  const fetchCareTargets = useCallback(
    async (keyword) => {
      if (!organizationId) return;
      setLoadingCareTargets(true);
      try {
        const data = await getCareTargetAllList(organizationId, keyword || '');
        setCareTargetList(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('케어대상 목록 조회 실패:', e);
        setCareTargetList([]);
      } finally {
        setLoadingCareTargets(false);
      }
    },
    [organizationId]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (showCareTargetDropdown || !selectedCareTargetDisplay) {
        fetchCareTargets(careTargetSearch);
      }
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [careTargetSearch, isOpen, showCareTargetDropdown, selectedCareTargetDisplay, fetchCareTargets]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCareTargetDropdown(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * 드롭다운에서 케어대상자 한 명 선택 시 호출.
   * 선택한 대상의 전화번호(to), 표시 문자열(selectedCareTargetDisplay) 설정 후 드롭다운 닫기.
   * @param {object} item - { careTargetId, name, careTargetPhone }
   */
  const handleCareTargetSelect = useCallback((item) => {
    setSelectedCareTargetDisplay(
      item.name ? `${item.name}${item.careTargetPhone ? ` (${item.careTargetPhone})` : ''}` : `ID ${item.careTargetId}`
    );
    setTo(item.careTargetPhone || '');
    setCareTargetSearch('');
    setShowCareTargetDropdown(false);
  }, []);

  const displayValue = selectedCareTargetDisplay || careTargetSearch;
  const filteredCareTargets = careTargetList.filter((item) => {
    const name = (item.name || '').toLowerCase();
    const keyword = (careTargetSearch || '').toLowerCase();
    return !keyword || name.includes(keyword);
  });

  const selectedPhoneNormalized = selectedCareTargetDisplay && to ? normalizePhone(to) : '';
  const displayList = selectedPhoneNormalized
    ? list.filter((msg) => {
        if (msg.direction === 'INBOUND') return normalizePhone(msg.fromNumber) === selectedPhoneNormalized;
        if (msg.direction === 'OUTBOUND') return normalizePhone(msg.toNumber) === selectedPhoneNormalized;
        return false;
      })
    : list;

  /**
   * 문자 목록 전체 다시 불러오기 (API 호출).
   * 위젯 열 때·새로고침·발송 후 호출.
   */
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSmsMessages();
      setList(res ?? []);
    } catch (error) {
      console.error('문자 목록 조회 실패', error);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadList();
  }, [isOpen, loadList]);

  /**
   * 목록/표시 목록 변경 시 스크롤을 맨 아래(최근 문자)로 이동.
   * requestAnimationFrame으로 DOM 반영 후 실행.
   */
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };
    const id = requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
    return () => cancelAnimationFrame(id);
  }, [list, loading, displayList.length]);

  /**
   * 날짜 문자열을 한국어 짧은 형식으로 포맷 (월/일 시:분).
   * @param {string} dateStr - ISO 등 날짜 문자열
   * @returns {string}
   */
  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // WebSocket NEW_INBOUND_SMS → sms-unread 이벤트 구독 (배지 숫자만 증가)
  useEffect(() => {
    const handler = (e) => {
      const delta = e.detail?.delta ?? 1;
      setSmsUnreadCount((c) => c + delta);
    };
    window.addEventListener('sms-unread', handler);
    return () => window.removeEventListener('sms-unread', handler);
  }, []);

  useEffect(() => {
    if (isOpen) setSmsUnreadCount(0);
  }, [isOpen]);

  /**
   * 문자 발송: to(수신 번호), message(본문)로 API 호출 후 목록 갱신.
   * 수신자 없음/내용 없음/발송 중이면 early return.
   */
  const handleSend = useCallback(async () => {
    const trimmedTo = to.trim();
    const trimmedMsg = message.trim();
    if (!trimmedTo || !trimmedMsg || sending) return;

    setSending(true);
    try {
      await sendSmsTest({ to: trimmedTo, message: trimmedMsg });
      setMessage('');
      await loadList();
    } catch (error) {
      console.error('문자 발송 실패', error);
      alert(error.response?.data?.message || '문자 발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  }, [to, message, sending, loadList]);

  /**
   * 드롭다운 입력 변경 시: 선택 초기화 + to 비우기 + 드롭다운 표시.
   */
  const handleCareTargetInputChange = useCallback((value) => {
    setCareTargetSearch(value);
    setSelectedCareTargetDisplay('');
    setTo('');
    setShowCareTargetDropdown(true);
  }, []);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  return {
    isOpen,
    openPanel,
    closePanel,
    smsUnreadCount,
    size,
    handleResizeStart,
    scrollRef,
    dropdownRef,
    list,
    loading,
    displayList,
    loadList,
    formatDate,
    to,
    message,
    setMessage,
    sending,
    handleSend,
    organizationId,
    careTargetSearch,
    displayValue,
    handleCareTargetInputChange,
    showCareTargetDropdown,
    setShowCareTargetDropdown,
    loadingCareTargets,
    filteredCareTargets,
    handleCareTargetSelect,
    fetchCareTargets,
    selectedCareTargetDisplay,
  };
}
