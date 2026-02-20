package com.carepilot.domain.sms;

import com.carepilot.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "outbound_sms")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class OutboundSms extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "outbound_sms_id")
    private Long outboundSmsId;

    @Column(name = "message_sid", length = 34)
    private String messageSid;

    @Column(name = "from_number", length = 20)
    private String fromNumber;

    @Column(name = "to_number", length = 20)
    private String toNumber;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "sent_by", length = 10, nullable = false)
    private SentBy sentBy;
}
