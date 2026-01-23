package com.carepilot.domain.call;

import com.carepilot.domain.common.BaseEntity;
import com.carepilot.domain.file.UploadFile;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "call_recording")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CallRecording extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recording_id")
    private Long recordingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_id", nullable = false)
    private Call call;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id", nullable = false)
    private UploadFile file;

    @Column(name = "transcript", columnDefinition = "TEXT")
    private String transcript;

    @Builder
    public CallRecording(Call call, UploadFile file, String transcript) {
        this.call = call;
        this.file = file;
        this.transcript = transcript;
    }
}

