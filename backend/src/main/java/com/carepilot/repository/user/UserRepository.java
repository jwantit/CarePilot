package com.carepilot.repository.user;

import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.domain.user.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUserId(Long userId);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    List<User> findByOrganizationAndRole(Organization organization, UserRole role);
}


