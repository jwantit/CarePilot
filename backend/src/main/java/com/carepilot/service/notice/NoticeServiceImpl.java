package com.carepilot.service.notice;

import com.carepilot.domain.notice.Notice;
import com.carepilot.domain.user.User;
import com.carepilot.dto.notice.NoticeResponseDTO;
import com.carepilot.dto.notice.NoticeSaveRequest;
import com.carepilot.repository.notice.NoticeRepository;
import com.carepilot.repository.user.UserRepository;
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
    private final UserRepository userRepository;

    // 모든 공지사항 조회
    @Override
    public Page<NoticeResponseDTO> getAllNotices(Pageable pageable) {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc(pageable)
                .map(NoticeResponseDTO::from);
    }

    // 공지사항 상세 조회
    @Override
    public NoticeResponseDTO getNoticeById(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다. id=" + id));
        return NoticeResponseDTO.from(notice);
    }

    // 새 글 생성 및 저장
    @Override
    @Transactional
    public void saveNotice(NoticeSaveRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자가 없습니다. id=" + userId));

        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(request.getIsPinned())
                .user(user)
                .organization(user.getOrganization())
                .build();

        noticeRepository.save(notice);
    }

    // 글 수정
    @Override
    @Transactional
    public void updateNotice(Long id, NoticeSaveRequest request, Long userId) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("수정할 공지사항이 없습니다. id=" + id));

        // 작성자와 요청자가 같은지 확인
        notice.validateWriter(userId);

        notice.update(request.getTitle(), request.getContent(), request.getIsPinned());
    }

    // 글 삭제
    @Override
    @Transactional
    public void deleteNotice(Long id, Long userId) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("삭제할 공지사항이 없습니다. id=" + id));

        notice.validateWriter(userId);

        notice.changeDeletedStatus(true);
    }

    @Override
    @Transactional
    public void incrementViewCount(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 없습니다. id=" + id));
        notice.setViewCount(notice.getViewCount() + 1);
    }
}