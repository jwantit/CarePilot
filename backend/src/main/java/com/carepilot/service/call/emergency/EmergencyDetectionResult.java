package com.carepilot.service.call.emergency;

import lombok.Getter;

@Getter
public class EmergencyDetectionResult {
    private final boolean emergency;
    private final String emergencyMessage;
    private final boolean needsDeepCheck;
    
    private EmergencyDetectionResult(boolean emergency, String emergencyMessage, boolean needsDeepCheck) {
        this.emergency = emergency;
        this.emergencyMessage = emergencyMessage;
        this.needsDeepCheck = needsDeepCheck;
    }
    
    public static EmergencyDetectionResult emergency(String message) {
        return new EmergencyDetectionResult(true, message, false);
    }
    
    public static EmergencyDetectionResult normal() {
        return new EmergencyDetectionResult(false, null, false);
    }
    
    public static EmergencyDetectionResult needsDeepCheck(String message) {
        return new EmergencyDetectionResult(false, message, true);
    }
}

