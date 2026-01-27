package com.carepilot.service.user;

import com.carepilot.dto.user.UserResponseDTO;
import com.carepilot.dto.user.UserUpdateRequestDTO;

import java.util.List;

//사용자 정보 조회 및 수정
public interface UserService {
    
    //현재 로그인한 사용자 개인정보 조회
    UserResponseDTO getCurrentUserProfile();
    
    //개인정보 수정
    UserResponseDTO updateCurrentUserProfile(UserUpdateRequestDTO request);

    // [직원 관리] 현재 매니저가 속한 업체의 직원 목록 조회
    List<UserResponseDTO> getStaffList();

    // [직원 관리] 직원 상태 변경 (승인 ACTIVE, 거부 DENIED, 중지 DISABLED 등)
    void updateStaffStatus(Long userId, String status);

    // [직원 관리] 직원 권한 변경 (USER, MANAGER 등)
    void updateStaffRole(Long userId, String role);
}
