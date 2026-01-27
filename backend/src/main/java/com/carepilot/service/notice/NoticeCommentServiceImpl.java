package com.carepilot.service.notice;

import com.carepilot.domain.notice.Notice;
import com.carepilot.domain.notice.NoticeComment;
import com.carepilot.domain.user.User;
import com.carepilot.dto.notice.CommentResponseDTO;
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
    public Long saveComment(Long noticeId, Long userId, Long parentId, String content) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시물이 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 사용자가 없습니다."));

        NoticeComment parent = null;
        if (parentId != null) {
            parent = commentRepository.findById(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글이 없습니다."));
        }

        NoticeComment comment = NoticeComment.builder()
                .notice(notice)
                .user(user)
                .parentComment(parent)
                .content(content)
                .build();

        return commentRepository.save(comment).getCommentId();
    }

    @Override
    public List<CommentResponseDTO> getCommentsByNoticeId(Long noticeId) {
        // 1. DB에서 해당 게시물의 모든 댓글을 정렬해서 가져옴
        List<NoticeComment> comments = commentRepository.findAllByNoticeId(noticeId);

        // 2. 변환 및 트리 구조 조립을 위한 준비
        List<CommentResponseDTO> rootComments = new ArrayList<>();
        Map<Long, CommentResponseDTO> map = new HashMap<>();

        // 3. 모든 댓글을 DTO로 변환하여 Map에 저장
        comments.forEach(c -> {
            CommentResponseDTO dto = CommentResponseDTO.builder()
                    .commentId(c.getCommentId())
                    .content(c.getIsDeleted() ? "삭제된 댓글입니다" : c.getContent())
                    .userName(c.getIsDeleted() ? "" : c.getUser().getName())
                    .userId(c.getUser().getUserId())
                    .parentId(c.getParentComment() != null ? c.getParentComment().getCommentId() : null)
                    .createdAt(c.getCreatedAt())
                    .children(new ArrayList<>()) // 자식 리스트 초기화
                    .build();

            map.put(dto.getCommentId(), dto);

            // 부모가 없으면 최상위 댓글 리스트에 추가, 있으면 부모의 children에 추가
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
    public void updateComment(Long commentId, String content, Long userId) {
        NoticeComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 댓글이 없습니다. id=" + commentId));

        if (!comment.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("댓글 수정 권한이 없습니다.");
        }
        comment.updateContent(content);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        // 1. 삭제할 댓글 존재 확인
        NoticeComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 댓글이 없습니다. id=" + commentId));

        if (!comment.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("댓글 삭제 권한이 없습니다.");
        }
        comment.changeDeletedStatus(true);
    }

    @Override
    @Transactional
    public void disconnectCommentsFromNotice(Long noticeId) {
        List<NoticeComment> comments = commentRepository.findAllByNoticeId(noticeId);
        comments.forEach(NoticeComment::setNoticeNull);
    }
}