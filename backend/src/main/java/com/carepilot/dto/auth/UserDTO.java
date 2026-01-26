package com.carepilot.dto.auth;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class UserDTO extends User {

    private Long userId;
    private String email;
    private String name;
    private boolean isSocial;
    private String role;
    private Long organizationId;
    private String status;

    public UserDTO(Long userId, String email, String password, String name, boolean isSocial, 
                   String role, Long organizationId, String status) {
        super(email, password, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.isSocial = isSocial;
        this.role = role;
        this.organizationId = organizationId;
        this.status = status;
    }

    // JWT 발급용 claims 제공
    public Map<String, Object> getClaims() {
        Map<String, Object> dataMap = new HashMap<>();
        dataMap.put("userId", userId);
        dataMap.put("email", email);
        dataMap.put("name", name);
        dataMap.put("isSocial", isSocial);
        dataMap.put("role", role);
        dataMap.put("organizationId", organizationId);
        dataMap.put("status", status);
        return dataMap;
    }
}

