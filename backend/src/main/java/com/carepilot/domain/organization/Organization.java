package com.carepilot.domain.organization;

import com.carepilot.domain.common.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "organization")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Organization extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "organization_id")
    private Long organizationId;

    // @Column(name = "name", nullable = false, length = 255)
    @Column(name = "name", length = 255)
    private String name;

    // @Column(name = "organization_number", unique = true, nullable = false, length = 50)
    @Column(name = "organization_number", unique = true, length = 50)
    private String organizationNumber;
}

