package com.carepilot.util;

import com.carepilot.domain.caretarget.Gender;
import com.carepilot.dto.caretarget.CsvDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

//EXCEL읽기 쓰기 라이브러리-------------------------
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.DataFormatter;
//-------------------------

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;



@Component
@RequiredArgsConstructor
@Slf4j
public class CsvUtil {

    //요청시 files 구조

    //엑셀 - Csv공통
    //row 1(자동스킵)이름  나이   성별   전화번호   질환   보호자이름   보호자 번호   보호자 관계
    //row 2         a     3     남    010-...  감염     b           010-..     자녀
    //row 3....

    //*순서지켜야함 -> a -> 3
    //*빈값허용

    //응답시
    //반환CsvDTO
//    private String name;        // 이름
//    private int age;        // 나이
//    private String gender;      // 성별
//    private String phone;        // 전화번호
//    private String disease;      // 질환
//    private String guardianName;     // 보호자 이름
//    private String guardianPhone;    // 보호자 번호
//    private String guardianRelationship;     // 보호자 관계



    //CSV, EXCEL 진입점
    // 다중 파일 다중 파일타입 대응-------------------------
    public List<CsvDTO> csvOrEx(List<MultipartFile> files) {

        if (files == null || files.isEmpty()) {
            return null;
        }

        List<CsvDTO> csvs = new ArrayList<>();

        for (MultipartFile file : files) {
            String contentType = file.getContentType();
            if (contentType == null) continue;

            if (contentType.contains("csv")) {
                // CSV 처리 메서드 호출
                csvs.addAll(csv(file));
                log.info("CSV 파일진입");
            } else if (contentType.contains("excel") || contentType.contains("spreadsheetml")) {
                // 엑셀 처리 메서드 호출
                csvs.addAll(excel(file));
                log.info("EXCEL 파일진입");
            }else {
                log.info("지원하지 않는 파일 형식");
                throw new RuntimeException("지원하지 않는 파일입니다.");
            }

        }
        return csvs;
    }

    //CSV파일대응-----------------------------------------------------------------------------
    public List<CsvDTO> csv(MultipartFile file) {
        List<CsvDTO> csvFinal = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            reader.readLine();

            while ((line = reader.readLine()) != null) {
                String[] data = line.split(",", -1);

                String gender = data[2];
                String genderNameFinal = genderNameFix(gender);

                int age = safeParseInt(data[1]);

                CsvDTO csv = CsvDTO.builder()
                        .name(data[0])
                        .age(age)
                        .gender(genderNameFinal)
                        .phone(data[3])
                        .disease(data[4])
                        .guardianName(data[5])
                        .guardianPhone(data[6])
                        .guardianRelationship(data[7]).build();
                csvFinal.add(csv);
            }
        } catch (Exception e) {
            log.info("실패");

        }
        return csvFinal;
    }
    //-------------------------------------------------------------------------------------------

    //EXCEL파일대응-----------------------------------------------------------------------------
    public List<CsvDTO> excel(MultipartFile file){
        List<CsvDTO> excelFinal = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        try(Workbook workbook = new XSSFWorkbook(file.getInputStream())){

            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet){
                //헤더 스킵
                if (row.getRowNum() == 0) continue;

                String gender = genderNameFix(formatter.formatCellValue(row.getCell(2)));

                int age = safeParseInt(formatter.formatCellValue(row.getCell(1)));

                CsvDTO csv = CsvDTO.builder()
                        .name(formatter.formatCellValue(row.getCell(0)))
                        .age(age)
                        .gender(gender)
                        .phone(formatter.formatCellValue(row.getCell(3)))
                        .disease(formatter.formatCellValue(row.getCell(4)))
                        .guardianName(formatter.formatCellValue(row.getCell(5)))
                        .guardianPhone(formatter.formatCellValue(row.getCell(6)))
                        .guardianRelationship(formatter.formatCellValue(row.getCell(7))).build();
                excelFinal.add(csv);
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return excelFinal;
    }
    //-------------------------------------------------------------------------------------------


    //성별문자 통일---------------------------------------------------------------------------------------
    public String genderNameFix(String genderName){
        return Gender.find(genderName).getKoName();
    }
    //나이 통일----------------------------------------------------------------------------
    private int safeParseInt(String str) {
        if (str == null || str.trim().isEmpty()) return 0;
        try {
            // 25.0 처럼 소수점이 붙어오는 엑셀 숫자 대응
            String value = str.trim().split("\\.")[0];
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

}
