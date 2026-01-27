import React, { useState, useEffect } from "react";
import { createSchedule, updateSchedule } from "../../api/callApi";

const ScheduleModal = ({ isOpen, onClose, onSaveSuccess, organizationId, editingSchedule }) => {
  // 폼 데이터 초기 상태
  const [formData, setFormData] = useState({
    organizationId: organizationId || 1,
    careTargetId: "",
    scheduledTime: "",
    type: "ONE_TIME",
    priority: "MEDIUM",
    memo: "",
    recurrence: "",
    recurrenceEndDate: "",
  });

  // 수정 모드일 때 폼 데이터 초기화
  useEffect(() => {
    if (isOpen && editingSchedule) {
      // scheduledTime을 datetime-local 형식으로 변환 (yyyy-MM-ddTHH:mm)
      const scheduledTimeStr = editingSchedule.scheduledTime
        ? editingSchedule.scheduledTime.replace(" ", "T").slice(0, 16)
        : "";
      const recurrenceEndDateStr = editingSchedule.recurrenceEndDate
        ? editingSchedule.recurrenceEndDate.replace(" ", "T").slice(0, 16)
        : "";

      setFormData({
        organizationId: organizationId || 1,
        careTargetId: editingSchedule.careTargetId || "",
        scheduledTime: scheduledTimeStr,
        type: editingSchedule.type || "ONE_TIME",
        priority: editingSchedule.priority || "MEDIUM",
        memo: editingSchedule.memo || "",
        recurrence: editingSchedule.recurrence || "",
        recurrenceEndDate: recurrenceEndDateStr,
      });
    } else if (isOpen && !editingSchedule) {
      // 새로 만들기 모드일 때 초기화
      setFormData({
        organizationId: organizationId || 1,
        careTargetId: "",
        scheduledTime: "",
        type: "ONE_TIME",
        priority: "MEDIUM",
        memo: "",
        recurrence: "",
        recurrenceEndDate: "",
      });
    }
  }, [isOpen, editingSchedule, organizationId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "type" && value !== "RECURRING") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        recurrence: "",
        recurrenceEndDate: "",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // API 호출
      const payload = {
        careTargetId: formData.careTargetId,
        scheduledTime: formData.scheduledTime,
        type: formData.type,
        priority: formData.priority,
        recurrence:
          formData.type === "RECURRING" ? formData.recurrence || null : null,
        recurrenceEndDate:
          formData.type === "RECURRING" && formData.recurrenceEndDate
            ? formData.recurrenceEndDate
            : null,
        memo: formData.memo,
      };

      if (editingSchedule) {
        // 수정 모드
        await updateSchedule(editingSchedule.scheduleId, payload);
        alert("일정이 성공적으로 수정되었습니다.");
      } else {
        // 생성 모드
        await createSchedule({ ...payload, organizationId: formData.organizationId });
        alert("일정이 성공적으로 등록되었습니다.");
      }
      onSaveSuccess(); // 목록 새로고침 함수 호출
      onClose(); // 모달 닫기
    } catch (error) {
      console.error(editingSchedule ? "일정 수정 실패:" : "일정 등록 실패:", error);
      alert(editingSchedule ? "수정 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold">
            {editingSchedule ? "통화 일정 수정" : "새 통화 일정 등록"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-2xl"
          >
            &times;
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              대상자 ID (연동 필요)
            </label>
            <input
              type="number"
              name="careTargetId"
              required
              value={formData.careTargetId}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md p-2"
              placeholder="대상자 ID를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              예정 시간
            </label>
            <input
              type="datetime-local"
              name="scheduledTime"
              required
              value={formData.scheduledTime}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                일정 유형
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md p-2"
              >
                <option value="ONE_TIME">일회성</option>
                <option value="RECURRING">반복</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                우선순위
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md p-2"
              >
                <option value="LOW">낮음</option>
                <option value="MEDIUM">보통</option>
                <option value="HIGH">높음</option>
                <option value="URGENT">긴급</option>
              </select>
            </div>
          </div>

          {formData.type === "RECURRING" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  반복 주기
                </label>
                <select
                  name="recurrence"
                  value={formData.recurrence}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                >
                  <option value="">선택</option>
                  <option value="DAILY">일일</option>
                  <option value="WEEKLY">주간</option>
                  <option value="MONTHLY">월간</option>
                </select>
              </div>
              {formData.recurrence && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    반복 종료일 (선택)
                  </label>
                  <input
                    type="datetime-local"
                    name="recurrenceEndDate"
                    value={formData.recurrenceEndDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border rounded-md p-2"
                    min={formData.scheduledTime || undefined}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    반복 일정이 종료될 날짜와 시간을 선택하세요. 선택하지 않으면 무기한 반복됩니다.
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              메모
            </label>
            <textarea
              name="memo"
              rows="3"
              value={formData.memo}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md p-2"
              placeholder="통화 시 참고할 내용을 적어주세요."
            ></textarea>
          </div>

          {/* 푸터 버튼 */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#008080] text-white rounded-md hover:bg-[#006666] transition"
            >
              {editingSchedule ? "수정하기" : "등록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
