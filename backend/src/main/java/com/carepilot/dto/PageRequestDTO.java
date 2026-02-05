package com.carepilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PageRequestDTO {

    @Builder.Default
    private int page = 1;

    @Builder.Default
    private int size = 10;

    private String type;    // 검색 종류
    private String keyword; // 검색어

    public String[] getTypes() {
        if (type == null || type.isEmpty()) {
            return null;
        }
        return type.split("");
    }

    // JPA의 Pageable 객체로 변환
    public Pageable getPageable(String... props) {
        return PageRequest.of(this.page - 1, this.size, Sort.by(props).descending());
    }

    private String link;

    // 페이지 이동 시 검색 조건을 유지하기 위한 쿼리 스트링 생성
    public String getLink() {
        if (link == null) {
            StringBuilder builder = new StringBuilder();
            builder.append("page=").append(this.page);
            builder.append("&size=").append(this.size);

            if (type != null && !type.isEmpty()) {
                builder.append("&type=").append(type);
            }
            if (keyword != null) {
                try {
                    builder.append("&keyword=").append(URLEncoder.encode(keyword, "UTF-8"));
                } catch (UnsupportedEncodingException e) {
                }
            }
            link = builder.toString();
        }
        return link;
    }
}