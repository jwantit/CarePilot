package com.carepilot.security.util;

import com.carepilot.security.filter.JwtCheckFilter;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Spring Security Context에서 현재 사용자 정보를 가져오는 유틸리티
 */
@Component
@Log4j2
public class SecurityUtil {

    /**
     * 현재 인증된 사용자의 ID를 가져옴
     * @return 사용자 ID (없으면 null)
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        
        try {
            return Long.parseLong(authentication.getPrincipal().toString());
        } catch (NumberFormatException e) {
            log.warn("사용자 ID 파싱 실패: principal={}", authentication.getPrincipal());
            return null;
        }
    }

    /**
     * 현재 인증된 사용자의 Role을 가져옴
     * @return Role (없으면 null)
     */
    public static String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || authentication.getDetails() == null) {
            return null;
        }
        
        if (authentication.getDetails() instanceof JwtCheckFilter.JwtAuthenticationDetails) {
            JwtCheckFilter.JwtAuthenticationDetails details = 
                    (JwtCheckFilter.JwtAuthenticationDetails) authentication.getDetails();
            return details.getRole();
        }
        
        return null;
    }

    /**
     * 현재 인증된 사용자의 Organization ID를 가져옴
     * @return Organization ID (없으면 null)
     */
    public static Long getCurrentUserOrganizationId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || authentication.getDetails() == null) {
            return null;
        }
        
        if (authentication.getDetails() instanceof JwtCheckFilter.JwtAuthenticationDetails) {
            JwtCheckFilter.JwtAuthenticationDetails details = 
                    (JwtCheckFilter.JwtAuthenticationDetails) authentication.getDetails();
            return details.getOrganizationId();
        }
        
        return null;
    }

    /**
     * 현재 인증된 사용자의 Status를 가져옴
     * @return Status (없으면 null)
     */
    public static String getCurrentUserStatus() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || authentication.getDetails() == null) {
            return null;
        }
        
        if (authentication.getDetails() instanceof JwtCheckFilter.JwtAuthenticationDetails) {
            JwtCheckFilter.JwtAuthenticationDetails details = 
                    (JwtCheckFilter.JwtAuthenticationDetails) authentication.getDetails();
            return details.getStatus();
        }
        
        return null;
    }

    /**
     * 현재 사용자가 MANAGER인지 확인
     * @return MANAGER이면 true
     */
    public static boolean isManager() {
        String role = getCurrentUserRole();
        return "MANAGER".equals(role);
    }

    /**
     * 현재 사용자가 ADMIN인지 확인
     * @return ADMIN이면 true
     */
    public static boolean isAdmin() {
        String role = getCurrentUserRole();
        return "ADMIN".equals(role);
    }

    /**
     * 현재 사용자가 특정 조직에 속해있는지 확인
     * @param organizationId 확인할 조직 ID
     * @return 같은 조직이면 true
     */
    public static boolean belongsToOrganization(Long organizationId) {
        Long currentOrgId = getCurrentUserOrganizationId();
        return currentOrgId != null && currentOrgId.equals(organizationId);
    }
}

