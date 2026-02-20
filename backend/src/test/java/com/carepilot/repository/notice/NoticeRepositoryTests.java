package com.carepilot.repository.notice;

import com.carepilot.domain.notice.NoticeComment;
import com.carepilot.domain.notice.Notice;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.util.ReflectionTestUtils; // 필드 주입을 위해 반드시 필요

import java.util.stream.IntStream;

@SpringBootTest
@Log4j2
public class NoticeRepositoryTests {

    @Autowired
    private NoticeRepository noticeRepository;

    @Autowired
    private NoticeCommentRepository noticeCommentRepository;

    @Test
    @Transactional
    @Rollback(false)
    public void testInsertNoticesWithComments() {

        IntStream.rangeClosed(1, 20).forEach(i -> {

            // 1. userRepository 없이 유저 객체를 로직 상에서 생성
            // 빌더를 통해 빈 객체를 만들고, Reflection으로 ID(PK)만 강제로 세팅합니다.
            User admin = User.builder().build();
            ReflectionTestUtils.setField(admin, "userId", 1L); // "userId"는 실제 엔티티 변수명과 맞춰주세요.

            User user = User.builder().build();
            ReflectionTestUtils.setField(user, "userId", 2L);

            User replyUser = User.builder().build();
            ReflectionTestUtils.setField(replyUser, "userId", 3L);


            com.carepilot.domain.organization.Organization org = com.carepilot.domain.organization.Organization.builder().build();

            Organization organizationId = Organization.builder()
                    .name("테스트 기관")
                    .organizationNumber("123-45-67890")
                    .build();

            // Organization의 PK 필드명이 'orgId'라고 가정하고 1번을 주입합니다.
            // 만약 필드명이 'id'라면 "id"로 수정하세요.
            ReflectionTestUtils.setField(org, "organizationId", 1L);

            // 3. 이제 공지사항 생성 (빨간 줄이 사라집니다)
            Notice notice = Notice.builder()
                    .title("시스템 점검 안내 (" + i + ")")
                    .content("안녕하세요... 점검 번호: " + i)
                    .isPinned(i > 18)
                    .user(admin)
                    .organization(org) // 이제 위에서 선언한 org 변수를 인식합니다.
                    .build();

            Notice savedNotice = noticeRepository.save(notice);
            log.info("공지사항 생성 완료: ID = {}", savedNotice.getNoticeId());

            // 3. 댓글 생성
            IntStream.rangeClosed(1, 3).forEach(j -> {
                NoticeComment comment = NoticeComment.builder()
                        .content("공지사항 " + i + "번에 대한 댓글 " + j + "입니다.")
                        .user(user)
                        .notice(savedNotice)
                        .build();

                NoticeComment savedComment = noticeCommentRepository.save(comment);

                // 4. 대댓글 생성
                if (j == 1) {
                    IntStream.rangeClosed(1, 2).forEach(k -> {
                        NoticeComment reply = NoticeComment.builder()
                                .content(j + "번 댓글에 대한 대댓글 " + k + "입니다.")
                                .user(replyUser)
                                .notice(savedNotice)
                                .build();

                        // parent 필드 주입 (메인 코드의 필드명이 parent가 맞는지 확인)
                        ReflectionTestUtils.setField(reply, "parent", savedComment);

                        noticeCommentRepository.save(reply);
                    });
                }
            });
        });

        log.info("더미 데이터 생성이 모두 완료되었습니다.");
    }
}