package com.carepilot.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Log4j2
public class CsvUtil {

    /**
     * CSV/EXCEL 제너릭 파서
     * - mapper: String[] -> T 변환기
     * - expectedCols: 컬럼 수(부족하면 빈 문자열로 padding)
     */
    public <T> List<T> csvOrEx(List<MultipartFile> files, RowMapper<T> mapper, int expectedCols) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        List<T> out = new ArrayList<>();

        for (MultipartFile file : files) {
            String contentType = file.getContentType();
            if (contentType == null) continue;

            if (contentType.contains("csv")) {
                out.addAll(parseCsv(file, mapper, expectedCols));
                log.info("CSV 파일진입");
            } else if (contentType.contains("excel") || contentType.contains("spreadsheetml")) {
                out.addAll(parseExcel(file, mapper, expectedCols));
                log.info("EXCEL 파일진입");
            } else {
                log.info("지원하지 않는 파일 형식");
                throw new RuntimeException("지원하지 않는 파일입니다.");
            }
        }

        return out;
    }

    private <T> List<T> parseCsv(MultipartFile file, RowMapper<T> mapper, int expectedCols) {
        List<T> out = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            // 헤더 스킵
            reader.readLine();

            String line;
            while ((line = reader.readLine()) != null) {
                String[] data = line.split(",", -1);
                out.add(mapper.map(normalize(data, expectedCols)));
            }
        } catch (Exception e) {
            throw new RuntimeException("CSV 파싱 실패", e);
        }
        return out;
    }

    private <T> List<T> parseExcel(MultipartFile file, RowMapper<T> mapper, int expectedCols) {
        List<T> out = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {

            Sheet sheet = workbook.getSheetAt(0);

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // 헤더 스킵

                String[] cols = new String[expectedCols];
                for (int i = 0; i < expectedCols; i++) {
                    cols[i] = formatter.formatCellValue(row.getCell(i));
                }
                out.add(mapper.map(normalize(cols, expectedCols)));
            }
        } catch (Exception e) {
            throw new RuntimeException("Excel 파싱 실패", e);
        }
        return out;
    }

    private String[] normalize(String[] cols, int expectedCols) {
        String[] out = new String[expectedCols];
        for (int i = 0; i < expectedCols; i++) {
            out[i] = (cols != null && i < cols.length && cols[i] != null) ? cols[i].trim() : "";
        }
        return out;
    }
}