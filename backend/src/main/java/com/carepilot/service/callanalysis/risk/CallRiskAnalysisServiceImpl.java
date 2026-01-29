package com.carepilot.service.callanalysis.risk;

import com.carepilot.domain.callanalysis.RiskSignal;
import com.carepilot.dto.callanalysis.RiskAnalysisResultDTO;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

// 시그널 기반 위험도 산정 (Top-K 합산 + Tier별 제한).
// - Emergency/High: 모두 합산
// - Medium/Low: Top-3만 합산
// - 전체: Top-4까지만 반영
@Service
@Log4j2
public class CallRiskAnalysisServiceImpl implements CallRiskAnalysisService {

    private static final Type SIGNAL_LIST_TYPE = new TypeToken<List<Map<String, Object>>>() {}.getType();
    private static final Gson GSON = new Gson();

    /**
     * LLM이 enum에 없는 signal을 내보내는 경우를 흡수하기 위한 alias 매핑.
     * - key: LLM이 준 signal 문자열
     * - value: RiskSignal enum 코드명
     */
    private static final Map<String, String> SIGNAL_ALIASES = new HashMap<>() {{
        put("SWEATING", "HYPOGLYCEMIA_SUSPECTED"); // 식은땀 → 저혈당 의심으로 흡수
        put("NAUSEA", "GI_INFECTION");            // 메스꺼움/울렁거림 → 장염 의심(과도한 구토 시그널 방지)
        put("FATIGUE", "POOR_INTAKE");            // 피로/기운없음(별도 enum 없음) → 식사 부족 쪽으로 흡수
    }};

    /** severity 0→0.3, 1→0.6, 2→0.9, 3→1.2 */
    private static double severityFactor(int severity) {
        int s = Math.max(0, Math.min(3, severity));
        return 0.3 * (s + 1);
    }

    /** 시그널 기여도 정보 */
    private static class SignalContribution {
        final RiskSignal signal;
        final int severity;
        final int contribution;

        SignalContribution(RiskSignal signal, int severity, int contribution) {
            this.signal = signal;
            this.severity = severity;
            this.contribution = contribution;
        }
    }

    @Override
    public RiskAnalysisResultDTO analyze(String signalsJson, String transcript) {
        log.info("[시그널 디버그] 위험도 산정 입력 signalsJson: {}", signalsJson);
        if (signalsJson == null || signalsJson.isBlank()) {
            log.info("[시그널 디버그] signalsJson 없음 → riskScore=0");
            return RiskAnalysisResultDTO.builder().riskScore(0).build();
        }

        List<Map<String, Object>> list;
        try {
            list = GSON.fromJson(signalsJson.trim(), SIGNAL_LIST_TYPE);
        } catch (Exception e) {
            log.warn("[시그널 디버그] signalsJson 파싱 실패, riskScore=0: {}", e.getMessage());
            return RiskAnalysisResultDTO.builder().riskScore(0).build();
        }
        if (list == null || list.isEmpty()) {
            log.info("[시그널 디버그] 파싱 결과 빈 리스트 → riskScore=0");
            return RiskAnalysisResultDTO.builder().riskScore(0).build();
        }

        // 1. 모든 시그널의 contribution 계산
        List<SignalContribution> allContributions = new ArrayList<>();
        boolean aloneFromSignals = false; // 과거/예외적으로 LLM이 독거 시그널을 넣는 경우를 대비
        for (Map<String, Object> item : list) {
            String signalName = item != null && item.get("signal") != null ? item.get("signal").toString() : null;
            if (signalName == null || signalName.isBlank()) {
                log.debug("[시그널 디버그] signal 이름 없음, 스킵: item={}", item);
                continue;
            }

            // 독거 시그널은 enum에서 제외했으므로 점수에는 직접 반영하지 않고, 보정치 트리거로만 활용
            if ("LIVING_ALONE_HIGH_RISK".equalsIgnoreCase(signalName.trim())) {
                aloneFromSignals = true;
                log.info("[시그널 디버그] 독거 시그널 감지(점수 합산 제외, 보정치 트리거로만 사용): {}", signalName);
                continue;
            }

            int severity = 1;
            if (item.get("severity") != null && item.get("severity") instanceof Number n) {
                severity = n.intValue();
            }

            RiskSignal signal;
            try {
                String normalized = signalName.trim().toUpperCase();
                if (SIGNAL_ALIASES.containsKey(normalized)) {
                    String mapped = SIGNAL_ALIASES.get(normalized);
                    log.info("[시그널 디버그] signal alias 매핑: {} → {}", normalized, mapped);
                    normalized = mapped;
                }
                signal = RiskSignal.valueOf(normalized);
            } catch (IllegalArgumentException e) {
                log.warn("[시그널 디버그] 알 수 없는 시그널명이라 스킵: signal={} (RiskSignal enum에 없음)", signalName);
                continue;
            }

            double factor = severityFactor(severity);
            int contribution = (int) Math.round(signal.getWeight() * factor);
            allContributions.add(new SignalContribution(signal, severity, contribution));
            log.info("[시그널 디버그] 시그널 계산: signal={}, tier={}, severity={}, weight={}, factor={}, contribution={}",
                    signalName, signal.getTier(), severity, signal.getWeight(), factor, contribution);
        }

        if (allContributions.isEmpty()) {
            log.info("[시그널 디버그] 유효한 시그널 없음 → riskScore=0");
            return RiskAnalysisResultDTO.builder().riskScore(0).build();
        }

        // 2. Tier별로 분류
        List<SignalContribution> emergencyHigh = allContributions.stream()
                .filter(sc -> sc.signal.getTier() == RiskSignal.Tier.EMERGENCY || sc.signal.getTier() == RiskSignal.Tier.HIGH)
                .collect(Collectors.toList());

        List<SignalContribution> mediumLow = allContributions.stream()
                .filter(sc -> sc.signal.getTier() == RiskSignal.Tier.MEDIUM || sc.signal.getTier() == RiskSignal.Tier.LOW)
                .sorted(Comparator.comparing((SignalContribution sc) -> sc.contribution).reversed())
                .limit(3)  // Top-3만
                .collect(Collectors.toList());

        // 3. Emergency/High + Medium/Low Top-3 합치기
        List<SignalContribution> selected = new ArrayList<>(emergencyHigh);
        selected.addAll(mediumLow);

        // 4. 전체에서 Top-5만 최종 선택
        List<SignalContribution> finalSelected = selected.stream()
                .sorted(Comparator.comparing((SignalContribution sc) -> sc.contribution).reversed())
                .limit(5)  // 전체 Top-5
                .collect(Collectors.toList());

        int rawSum = finalSelected.stream()
                .mapToInt(sc -> sc.contribution)
                .sum();

        // 독거(현재 혼자)는 "응급/High 시그널이 있을 때만" 보정치로 반영
        boolean hasEmergencyOrHigh = !emergencyHigh.isEmpty();
        boolean isAlone = aloneFromSignals || isAloneFromTranscript(transcript);
        if (hasEmergencyOrHigh && isAlone) {
            rawSum += 20;
            log.info("[시그널 디버그] 독거 보정치 적용: hasEmergencyOrHigh={}, isAlone={} → +20", hasEmergencyOrHigh, isAlone);
        } else {
            log.info("[시그널 디버그] 독거 보정치 미적용: hasEmergencyOrHigh={}, isAlone={}", hasEmergencyOrHigh, isAlone);
        }

        log.info("[시그널 디버그] Tier별 제한 적용: Emergency/High={}개, Medium/Low Top-3={}개, 최종 Top-5={}개",
                emergencyHigh.size(), mediumLow.size(), finalSelected.size());
        log.info("[시그널 디버그] 최종 반영 시그널: {}", finalSelected.stream()
                .map(sc -> sc.signal.name() + "(tier=" + sc.signal.getTier() + ", severity=" + sc.severity + ", contribution=" + sc.contribution + ")")
                .collect(Collectors.joining(", ")));

        int score = Math.min(100, rawSum);
        log.info("[시그널 디버그] 위험도 산정 결과: rawSum={}, riskScore={}", rawSum, score);
        return RiskAnalysisResultDTO.builder().riskScore(score).build();
    }

    // transcript에서 "현재 혼자 있음" 여부를 아주 단순한 룰로 판정
    private static boolean isAloneFromTranscript(String transcript) {
        if (transcript == null || transcript.isBlank()) return false;
        String t = transcript.replace("\r", " ").replace("\n", " ");
        // 부정 표현(혼자 아니/아닙니다)이 있으면 false 우선
        if (t.contains("혼자 아니") || t.contains("혼자 아닙")) return false;
        // 긍정 패턴
        return t.contains("혼자 있어") || t.contains("혼자 계") || t.contains("독거");
    }
}
