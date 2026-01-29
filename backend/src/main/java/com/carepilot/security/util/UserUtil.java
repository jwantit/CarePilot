package com.carepilot.security.util;

import com.carepilot.common.exception.ApiException;
import com.carepilot.common.exception.ErrorCode;
import com.carepilot.domain.user.User;
import com.carepilot.dto.auth.UserDTO;
import com.carepilot.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Log4j2
@Component
@RequiredArgsConstructor
public class UserUtil {

    private final UserRepository userRepository;

    public User getCurrentUser() {
        UserDTO dto = getCurrentUserDTO();
        return userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }

    public UserDTO getCurrentUserDTO() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDTO userDTO) {
            return userDTO;
        }
        throw new ApiException(ErrorCode.AUTH_REQUIRED);
    }
}

