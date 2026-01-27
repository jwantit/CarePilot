package com.carepilot.repository.call;

import com.carepilot.domain.call.CallRecording;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CallRecordingRepository extends JpaRepository<CallRecording, Long> {
    Optional<CallRecording> findByCall_CallId(Long callId);
}
