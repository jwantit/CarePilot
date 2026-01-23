package com.carepilot.controller;

import com.carepilot.dto.CsvDTO;
import com.carepilot.util.CsvUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/caretarget")
public class CareTargetController {

    private final CsvUtil csvUtil;


    //CSV, 엑셀대응
    @PostMapping(value = "/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<CsvDTO>> csvCareTarget(
            @RequestPart(value = "csv", required = false) List<MultipartFile> files
    ) {
        log.info("컨트롤러 진입");

        List<CsvDTO> csvs = csvUtil.csvOrEx(files);

        log.info("DTO완료");

        return ResponseEntity.ok(csvs);
    }
}
