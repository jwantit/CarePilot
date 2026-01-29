package com.carepilot.domain.callanalysis;

import lombok.Getter;

//통화 분석 시그널 정의 (한글 라벨, Weight, Tier).
//weight는 그 신호 자체의 위험 영향력(중요도)
//severity는 그 신호가 얼마나 심한지(강도)를 나타낸다.
//tier는 위험도 등급으로, 위험도 산정 시 Tier별 제한을 두기 위해 사용.
@Getter
public enum RiskSignal {

    // 🟥 Emergency
    SUICIDAL_IDEATION("자살/자해 암시", 60, Tier.EMERGENCY, "자살하고 싶어요, 죽고 싶어요, 자해"),
    STROKE_SIGNS("뇌졸중 의심(편마비/발음/의식)", 55, Tier.EMERGENCY, "편마비, 한쪽이 안 움직여요, 발음이 어눌해요, 말이 안 나와요"),
    LOSS_OF_CONSCIOUSNESS("실신/의식소실", 60, Tier.EMERGENCY, "실신했어요, 의식을 잃었어요, 기절했어요"),
    CHEST_PAIN("흉통/가슴 조임", 45, Tier.EMERGENCY, "가슴이 아파요, 흉통, 가슴이 조여요, 왼쪽 가슴이 쥐어지는, 가슴이 답답해요"),
    DYSPNEA("호흡곤란/숨참", 40, Tier.EMERGENCY, "숨이 차요, 호흡곤란, 숨참, 숨이 답답해요, 숨을 쉬기 어려워요"),

    // 🟧 High
    HEART_FAILURE_SIGNS("심부전 악화(부종/호흡곤란/체중급증)", 40, Tier.HIGH, "다리가 부었어요, 호흡곤란, 체중이 급격히 늘었어요"),
    ARRHYTHMIA_PALPITATION("심계항진/부정맥 의심", 35, Tier.HIGH, "심장이 빨리 뛰어요, 심계항진, 부정맥"),
    HYPOGLYCEMIA_SUSPECTED("저혈당 의심(떨림/식은땀/혼미)", 35, Tier.HIGH, "떨려요, 식은땀, 손떨림, 어지러워요"),
    CONFUSION("의식혼탁/섬망/지남력 저하", 35, Tier.HIGH, "정신이 혼미해요, 헷갈려요, 지남력이 없어요"),
    PNEUMONIA_SUSPECTED("폐렴 의심(가래+발열+호흡 악화)", 40, Tier.HIGH, "가래가 나와요, 발열, 호흡이 나빠졌어요"),
    UTI_SUSPECTED("요로감염 의심(배뇨통/빈뇨/혼미 동반 가능)", 30, Tier.HIGH, "소변 볼 때 아파요, 배뇨통, 자주 소변을 봐요"),
    VOMITING_PERSISTENT("구토 지속", 30, Tier.HIGH, "계속 토해요, 구토가 멈추지 않아요"),
    DIABETES_RISK("혈당 이상 의심(손떨림/식은땀/갈증)", 30, Tier.HIGH, "손떨림, 식은땀, 갈증, 물을 많이 마셔요"),
    DEMENTIA_WORSENING("인지저하 악화(최근 급격히)", 30, Tier.HIGH, "최근에 기억력이 많이 나빠졌어요, 인지저하가 심해졌어요"),
    FALL_RISK("낙상 위험(휘청/넘어질뻔/보행불안)", 25, Tier.HIGH, "휘청거려요, 넘어질 뻔했어요, 걸음이 불안해요"),
    SEVERE_PAIN("심한 통증(일상 불가 수준)", 25, Tier.HIGH, "심하게 아파요, 일상생활이 불가능해요"),
    MISUSE_MEDICATION("과복용/오복용 의심", 35, Tier.HIGH, "약을 많이 먹었어요, 약을 잘못 먹었어요"),
    HIGH_FEVER("고열 지속", 20, Tier.HIGH, "고열이 계속 나요, 열이 안 내려가요"),

    // 🟨 Medium
    HYPERTENSION_SYMPTOMS("고혈압 위험 증상(심한 두통 등)", 25, Tier.MEDIUM, "심한 두통, 고혈압 증상"),
    HYPERGLYCEMIA_SUSPECTED("고혈당 의심(갈증/잦은 소변/피로)", 25, Tier.MEDIUM, "갈증, 자주 소변을 봐요, 피로해요"),
    GI_INFECTION("장염 의심(설사/구토)", 25, Tier.MEDIUM, "설사, 구토, 장염"),
    DIARRHEA_PERSISTENT("설사 지속", 25, Tier.MEDIUM, "설사가 계속 나와요, 설사가 멈추지 않아요"),
    MED_NONADHERENCE("복약 누락/중단", 25, Tier.MEDIUM, "약 깜빡했어요, 복용 안 했어요, 약을 못 먹었어요, 약을 먹지 않았어요"),
    REFUSED_MEDICATION("복약 거부(인지/우울/부작용 가능)", 25, Tier.MEDIUM, "약을 안 먹겠다고 해요, 약을 거부해요"),
    MOOD_DEPRESSION("우울/무기력(자살사고 제외)", 20, Tier.MEDIUM, "우울해요, 무기력해요, 기운이 없어요"),
    PANIC_ANXIETY("불안발작/과호흡(패닉)", 15, Tier.MEDIUM, "불안발작, 과호흡, 패닉"),

    // 🟩 Low
    INCONTINENCE_ISSUE("요실금/대소변 문제(피부염/감염 위험)", 20, Tier.LOW, "요실금, 대소변 문제"),
    DEHYDRATION("탈수(수분 부족/어지럼)", 15, Tier.LOW, "물 거의 안 마셨어요, 수분 부족, 어지러워요, 탈수"),
    POOR_INTAKE("식사 부족/저혈당 의심", 12, Tier.LOW, "입맛 없어서 조금만 먹었어요, 식사 거름, 밥을 안 먹었어요, 식사를 제대로 안 했어요"),
    SLEEP_DISTURBANCE("불면/수면 부족(지속)", 8, Tier.LOW, "잠을 못 자요, 불면, 수면 부족");

    private final String labelKr;
    private final int weight;
    private final Tier tier;
    private final String matchingExamples;  // 통화 내용 매칭 예시

    RiskSignal(String labelKr, int weight, Tier tier, String matchingExamples) {
        this.labelKr = labelKr;
        this.weight = weight;
        this.tier = tier;
        this.matchingExamples = matchingExamples;
    }

    /** 위험도 등급 */
    public enum Tier {
        EMERGENCY,  // 🟥 Emergency
        HIGH,       // 🟧 High
        MEDIUM,     // 🟨 Medium
        LOW         // 🟩 Low
    }
}
