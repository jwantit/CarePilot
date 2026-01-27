package com.carepilot.service.notice;

import com.carepilot.domain.notice.Notice;
import com.carepilot.repository.notice.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;
    private final NoticeCommentService noticeCommentService;

    // 모든 공지사항 조회
    @Override
    public Page<Notice> getAllNotices(Pageable pageable) {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc(pageable);
    }
    // 공지사항 상세 조회
    @Override
    public Notice getNoticeById(Long id) {
        return noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다. id=" + id));
    }
    // 새 글 생성 및 저장
    @Override
    @Transactional
    public void saveNotice(Notice notice) {
        noticeRepository.save(notice);
    }
    // 내용 수정
    @Override
    @Transactional
    public void updateNotice(Long id, Notice updateParam) {
        Notice notice = noticeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("수정할 공지사항이 없습니다. id="+ id));
        notice.update(updateParam.getTitle(), updateParam.getContent(), updateParam.getIsPinned());
    }
    // 글 삭제
    @Override
    @Transactional
    public void deleteNotice(Long id) {
        noticeCommentService.disconnectCommentsFromNotice(id);
        noticeRepository.deleteById(id);
    }
    // 조회수 증가
    @Override
    @Transactional
    public void incrementViewCount(Long id) {
        Notice notice = noticeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 없습니다. id="+ id));

        notice.setViewCount(notice.getViewCount() + 1);
    }
}