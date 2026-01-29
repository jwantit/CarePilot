package com.carepilot.service.notice;

import com.carepilot.domain.notice.Notice;
import com.carepilot.domain.notice.NoticeComment;
import com.carepilot.domain.user.User;
import com.carepilot.dto.notice.CommentResponseDTO;
import com.carepilot.dto.notice.CommentSaveRequest;
import com.carepilot.repository.notice.NoticeCommentRepository;
import com.carepilot.repository.notice.NoticeRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeCommentServiceImpl implements NoticeCommentService {

    private final NoticeCommentRepository commentRepository;
    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Long saveComment(Long noticeId, CommentSaveRequest request) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시물이 없습니다. id=" + noticeId));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자가 없습니다. id=" + request.getUserId()));

        NoticeComment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글이 없습니다. id=" + request.getParentId()));
        }

        NoticeComment comment = NoticeComment.builder()
                .notice(notice)
                .user(user)
                .content(request.getContent())
                .parentComment(parent)
                .isDeleted(false)
                .build();

        return commentRepository.save(comment).getCommentId();
    }

    @Override
    public List<CommentResponseDTO> getCommentsByNoticeId(Long noticeId) {
        List<NoticeComment> comments = commentRepository.findAllByNotice_NoticeIdOrderByCreatedAtAsc(noticeId);

        List<CommentResponseDTO> rootComments = new ArrayList<>();
        Map<Long, CommentResponseDTO> map = new HashMap<>();

        comments.forEach(c -> {
            CommentResponseDTO dto = CommentResponseDTO.from(c);

            map.put(dto.getCommentId(), dto);

            if (c.getParentComment() == null) {
                rootComments.add(dto);
            } else {
                CommentResponseDTO parentDto = map.get(c.getParentComment().getCommentId());
                if (parentDto != null) {
                    parentDto.getChildren().add(dto);
                }
            }
        });
        return rootComments;
    }

    @Override
    @Transactional
    public void updateComment(Long commentId, CommentSaveRequest request) {
        NoticeComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 댓글이 없습니다. id=" + commentId));

        comment.validateWriter(request.getUserId());

        comment.updateContent(request.getContent());
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        // 1. 삭제할 댓글 존재 확인
        NoticeComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 댓글이 없습니다. id=" + commentId));

        comment.validateWriter(userId);

        comment.changeDeletedStatus(true);
    }
}