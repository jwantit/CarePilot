package com.carepilot.service.auth;

import com.carepilot.dto.auth.ApprovalResponseDTO;
import com.carepilot.dto.auth.LoginRequestDTO;
import com.carepilot.dto.auth.LoginResponseDTO;
import com.carepilot.dto.auth.LogoutResponseDTO;
import com.carepilot.dto.auth.OrganizationSignupRequestDTO;
import com.carepilot.dto.auth.OrganizationSignupResponseDTO;
import com.carepilot.dto.auth.UserSignupRequestDTO;
import com.carepilot.dto.auth.UserSignupResponseDTO;

public interface AuthService {
    
    OrganizationSignupResponseDTO signupOrganization(OrganizationSignupRequestDTO request);
    
    UserSignupResponseDTO signupUser(UserSignupRequestDTO request);
    
    ApprovalResponseDTO approveUser(String token);
    
    LoginResponseDTO login(LoginRequestDTO request);
    
    LogoutResponseDTO logout();
}

