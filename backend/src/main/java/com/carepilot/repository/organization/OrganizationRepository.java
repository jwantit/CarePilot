package com.carepilot.repository.organization;

import com.carepilot.domain.organization.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    
    Optional<Organization> findByOrganizationNumber(String organizationNumber);
    
    boolean existsByOrganizationNumber(String organizationNumber);
    
    Optional<Organization> findByOrganizationId(Long organizationId);
}

