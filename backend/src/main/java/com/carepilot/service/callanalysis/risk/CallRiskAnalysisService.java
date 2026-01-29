package com.carepilot.service.callanalysis.risk;

import com.carepilot.dto.callanalysis.RiskAnalysisResultDTO;

public interface CallRiskAnalysisService {

    //시그널 JSON을 기반으로 해당 통화의 위험도 점수를 산정.
    //시그널별 weight × severity 보정 계수 합산 후 100 cap.
    RiskAnalysisResultDTO analyze(String signalsJson, String transcript);
}
