package com.carepilot.controller;


import com.carepilot.domain.user.User;
import com.carepilot.dto.caretarget.*;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupListResponseDTO;
import com.carepilot.dto.caretarget.caretargetgroup.CareGroupRequestDTO;
import com.carepilot.service.caretarget.CareGroupService;
import com.carepilot.service.caretarget.CareService;
import com.carepilot.util.CsvUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/caregroup")
public class CareTargetGroupController {

    private final CareGroupService careGroupService;

    @PostMapping("/insert")
    public ResponseEntity<List<CareGroupListResponseDTO>> csvCareTarget(
            @RequestBody CareGroupRequestDTO careGroupRequestDTO

    ) {

        Long userId = 7L;
        List<CareGroupListResponseDTO> result = careGroupService.insertCareGroup(careGroupRequestDTO, userId);

        return ResponseEntity.ok(result);
    }
}
