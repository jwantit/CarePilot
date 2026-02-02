import React, { useEffect, useState } from "react";
import { API_SERVER_HOST } from "../../api/apiClient";
import { getInboundSmsList } from "../../api/callApi";

const InboundSmsTab = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await getInboundSmsList();
      setList(res);
    } catch (error) {
      console.error("수신 문자 목록 조회 실패", error);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR");
  };

  if (loading) return <div className="p-4">로딩 중...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          Twilio 번호로 수신된 SMS/MMS (테스트용)
        </p>
        <button
          onClick={loadList}
          className="px-3 py-1 text-sm bg-[#008080] text-white rounded hover:bg-teal-700"
        >
          새로고침
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">
          수신된 문자가 없습니다.
          <br />
          Twilio 콘솔에서 해당 번호의 &quot;A MESSAGE COMES IN&quot; 웹훅을
          <br />
          <code className="bg-gray-100 px-1">
            {API_SERVER_HOST}/api/twilio/sms/inbound
          </code>
          (ngrok URL 사용) 으로 설정하세요.
        </p>
      ) : (
        <div className="space-y-4">
          {list.map((sms) => (
            <div
              key={sms.inboundSmsId}
              className="border rounded-lg p-4 bg-gray-50"
            >
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>발신: {sms.fromNumber}</span>
                <div className="flex items-center gap-2">
                  {sms.smsType && (
                    <span className="px-2 py-0.5 text-xs rounded bg-teal-100 text-teal-800">
                      {sms.smsType}
                    </span>
                  )}
                  <span>{formatDate(sms.receivedAt)}</span>
                </div>
              </div>
              {sms.body && (
                <p className="mb-3 whitespace-pre-wrap">{sms.body}</p>
              )}
              {sms.mediaUrls && sms.mediaUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {sms.mediaUrls.map((url, idx) => {
                    const fullUrl = `${API_SERVER_HOST}${url}`;
                    const isImage =
                      /\.(jpg|jpeg|png|gif|webp)$/i.test(url) ||
                      url.includes("image");
                    return (
                      <div key={idx} className="border rounded overflow-hidden">
                        {isImage ? (
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={fullUrl}
                              alt={`첨부 ${idx + 1}`}
                              className="max-h-48 object-contain"
                            />
                          </a>
                        ) : (
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-2 bg-white text-[#008080] hover:underline"
                          >
                            미디어 보기
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InboundSmsTab;
