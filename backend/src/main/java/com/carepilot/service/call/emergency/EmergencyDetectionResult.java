package com.carepilot.service.call.emergency;

import lombok.Getter;

@Getter
public class EmergencyDetectionResult {
    private final boolean emergency;
    private final String emergencyMessage;
    
    private EmergencyDetectionResult(boolean emergency, String emergencyMessage) {
        this.emergency = emergency;
        this.emergencyMessage = emergencyMessage;
    }
    
    public static EmergencyDetectionResult emergency(String message) {
        return new EmergencyDetectionResult(true, message);
    }
    
    public static EmergencyDetectionResult normal() {
        return new EmergencyDetectionResult(false, null);
    }
}

