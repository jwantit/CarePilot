package com.carepilot.service.upload;


import com.carepilot.domain.call.Call;
import com.carepilot.domain.caretarget.CareTarget;
import com.carepilot.domain.file.UploadFileType;
import com.carepilot.domain.file.UploadTargetType;
import com.carepilot.domain.file.UploadFile;
import com.carepilot.domain.notice.Notice;
import com.carepilot.domain.organization.Organization;
import com.carepilot.domain.user.User;
import com.carepilot.dto.upload.TargetFileDTO;
import com.carepilot.dto.upload.UploadFileResponseDTO;
import com.carepilot.repository.call.CallRepository;
import com.carepilot.repository.caretarget.CareTargetRepository;
import com.carepilot.repository.notice.NoticeRepository;
import com.carepilot.repository.organization.OrganizationRepository;
import com.carepilot.repository.upload.UploadFileRepository;
import com.carepilot.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UploadFileService {

    //저장 사용법 단일 파일인경우 리스트화 해서
//    List<MultipartFile> files = Collections.singletonList(file);
//    TargetFileDTO targetFileDTO = TargetFileDTO.builder()
//            .targetType(UploadTargetType.CARE_TARGET)
//            .targetId(careTargetId)
//            .organizationId(organizationId)
//            .files(files)
//            .build();


    private final UploadFileRepository uploadFileRepository;
    private final UserRepository userRepository;
    private final CareTargetRepository careTargetRepository;
    private final OrganizationRepository organizationRepository;
    private final NoticeRepository noticeRepository;
    private final CallRepository callRepository;

    private static final String BASE_DIR = "uploads";


//


//요청-------------------------------------------------
    //케어대상자 -> CARE_TARGET + careTargetId + organizationId
    //공지사항 -> NOTICE + targetId + organizationId

    //음성 -> CALL_LOG + targetId + careTargetId + organizationId

    public List<UploadFileResponseDTO> saveFiles(
            TargetFileDTO fileDTO
    ) {

        //파일자체 존재여부 확인과 id확인-----
        if (fileDTO == null || fileDTO.getFiles() == null || fileDTO.getFiles().isEmpty()) {
            return List.of();
        } else if (fileDTO.getTargetId() == null) {
            return List.of();
        }

        List<UploadFileResponseDTO> result = new ArrayList<>();


        CareTarget careTarget = null;
        Call call = null;
        Organization organization = organizationRepository.findById(fileDTO.getOrganizationId())
                .orElseThrow(() -> new IllegalArgumentException("조직 정보가 없습니다."));
        if (fileDTO.getTargetType() == UploadTargetType.CALL_LOG) {
            call = callRepository.findById(fileDTO.getTargetId()).orElse(null);
            careTarget = careTargetRepository.findById(fileDTO.getCareTargetId()).orElse(null);

        } else if (fileDTO.getTargetType() == UploadTargetType.CARE_TARGET) {
            Long idToUse = (fileDTO.getCareTargetId() != null) ? fileDTO.getCareTargetId() : fileDTO.getTargetId();

            if (idToUse != null) {
                careTarget = careTargetRepository.findById(idToUse).orElse(null);
                if (fileDTO.getTargetId() == null) {
                    fileDTO.setTargetId(idToUse);
                }
            }
        }
        User user = (fileDTO.getUserId() != null) ? userRepository.findById(fileDTO.getUserId()).orElse(null) : null;
        Notice notice = (fileDTO.getTargetType() == UploadTargetType.NOTICE) ? noticeRepository.findById(fileDTO.getTargetId()).orElse(null) : null;



        //파일리스트 순회  ------------
        for (MultipartFile file : fileDTO.getFiles()) {
            //각 파일 존재여부
            if (file == null || file.isEmpty()) {
                log.debug("[FILE][SKIP] empty multipart part");
                continue;
            }
            //원본파일명 null일 경우 unknown
            String originalName = Optional.ofNullable(file.getOriginalFilename())
                    .filter(s -> !s.isBlank())
                    .orElse("unknown");

            //타입 null일시 기본 타입
            String contentType = Optional.ofNullable(file.getContentType())
                    .filter(s -> !s.isBlank())
                    .orElse("application/octet-stream");

            //하위 파일 경로를 만들기
            String thumbnailflag = "";
            String storageKey = generateStorageKey(
                    fileDTO.getTargetType(), fileDTO.getTargetId(), originalName, thumbnailflag);

            //로컬에 원본저장
            saveToLocal(storageKey, file);

            //이미지 파일인 경우 썸네일 생성
            String thumbnailStorageKey = null;
            if (isImageFile(contentType)) {
                try {                                        //원본 하위경로 | 타입 | 타겟id
                    thumbnailStorageKey = generateThumbnail(storageKey, fileDTO.getTargetType(), fileDTO.getTargetId(), originalName);
                    log.info("[FILE][THUMBNAIL] created: {}", thumbnailStorageKey);
                } catch (Exception e) {
                    log.warn("[FILE][THUMBNAIL] failed to create thumbnail for {}", originalName, e);
                    // 썸네일 생성 실패해도 원본 파일은 저장됨
                }
            }

            UploadFileType uploadFileType = determineFileType(fileDTO.getTargetType(), contentType);

            UploadFile save = uploadFileRepository.save(
                    UploadFile.builder()
                            .organization(organization) //업체엔티티
                            .targetType(fileDTO.getTargetType()) //타입 NOTICE, CARE_TARGET, CALL_LOG
                            .fileType(uploadFileType)
                            .notice(notice) //공지사항 엔티티
                            .careTarget(careTarget)
                            .call(call)
                            .originalName(originalName)
                            .storagePath(storageKey)
                            .contentType(contentType)
                            .thumbnailStoragePath(thumbnailStorageKey)
                            .fileSize(file.getSize())
                            .uploadedBy(user)
                            .build()
            );

            result.add(toDTO(save));
        }
        return result;
    }


    /**
     * URL에서 이미지를 다운로드하여 로컬 저장 및 UploadFile 등록 (수신 문자 URL용)
     *
     * @param imageUrl      다운로드할 이미지 URL (직접 이미지 링크)
     * @param organizationId 조직 ID
     * @param targetId      InboundSms ID (저장 경로용)
     * @return 저장된 storagePath (실패 시 null)
     */
    public String saveFromUrl(String imageUrl, Long organizationId, Long targetId) {
        if (imageUrl == null || imageUrl.isBlank()) return null;
        try {
            URL url = new URL(imageUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(15000);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (compatible; CarePilot/1.0)");

            int responseCode = connection.getResponseCode();
            if (responseCode < 200 || responseCode >= 300) {
                log.warn("[FILE][SAVE_FROM_URL] HTTP {} for url={}", responseCode, imageUrl);
                return null;
            }

            String contentType = connection.getContentType();
            if (contentType != null && !contentType.toLowerCase().contains("image")) {
                log.warn("[FILE][SAVE_FROM_URL] Not image content-type: {} for url={}", contentType, imageUrl);
                return null;
            }
            String ext = ".jpg";
            if (contentType != null) {
                if (contentType.toLowerCase().contains("png")) ext = ".png";
                else if (contentType.toLowerCase().contains("gif")) ext = ".gif";
                else if (contentType.toLowerCase().contains("webp")) ext = ".webp";
            } else if (imageUrl.toLowerCase().matches(".*\\.(png|gif|webp)(\\?.*)?$")) {
                if (imageUrl.toLowerCase().contains(".png")) ext = ".png";
                else if (imageUrl.toLowerCase().contains(".gif")) ext = ".gif";
                else if (imageUrl.toLowerCase().contains(".webp")) ext = ".webp";
            }

            String originalName = "image" + ext;
            String storageKey = generateStorageKey(UploadTargetType.INBOUND_SMS, targetId, originalName, "");

            try (InputStream inputStream = connection.getInputStream()) {
                saveToLocalFromStream(storageKey, inputStream);
            }

            long fileSize = 0;
            try {
                Path path = Paths.get(BASE_DIR, storageKey);
                if (Files.exists(path)) fileSize = Files.size(path);
            } catch (IOException ignored) {}

            String thumbnailStorageKey = null;
            if (isImageFile(contentType != null ? contentType : "image/jpeg")) {
                try {
                    thumbnailStorageKey = generateThumbnail(storageKey, UploadTargetType.INBOUND_SMS, targetId, originalName);
                } catch (Exception e) {
                    log.warn("[FILE][SAVE_FROM_URL] Thumbnail failed for {}", imageUrl, e);
                }
            }

            Organization organization = organizationRepository.findById(organizationId)
                    .orElseThrow(() -> new IllegalArgumentException("조직 정보가 없습니다."));

            UploadFile saved = uploadFileRepository.save(UploadFile.builder()
                    .organization(organization)
                    .targetType(UploadTargetType.INBOUND_SMS)
                    .fileType(UploadFileType.IMAGE)
                    .notice(null)
                    .careTarget(null)
                    .call(null)
                    .originalName(originalName)
                    .storagePath(storageKey)
                    .contentType(contentType != null ? contentType : "image/jpeg")
                    .thumbnailStoragePath(thumbnailStorageKey)
                    .fileSize(fileSize)
                    .uploadedBy(null)
                    .build());

            log.info("[FILE][SAVE_FROM_URL] success url={}, path={}", imageUrl, storageKey);
            return saved.getStoragePath();
        } catch (Exception e) {
            log.error("[FILE][SAVE_FROM_URL] failed url={}, error={}", imageUrl, e.getMessage(), e);
            return null;
        }
    }

    /**
     * 이미 디스크에 저장된 파일(MMS 등)에 대한 UploadFile 레코드 생성
     * prescription 등에서 upload_file_id 참조용
     */
    public UploadFile createUploadFileForExistingPath(String storagePath, Long organizationId, String contentType) {
        if (storagePath == null || organizationId == null) return null;
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("조직 정보가 없습니다."));
        long fileSize = 0;
        try {
            Path path = Paths.get(BASE_DIR, storagePath);
            if (Files.exists(path)) fileSize = Files.size(path);
        } catch (IOException ignored) {}
        return uploadFileRepository.save(UploadFile.builder()
                .organization(organization)
                .targetType(UploadTargetType.INBOUND_SMS)
                .fileType(UploadFileType.IMAGE)
                .notice(null)
                .careTarget(null)
                .call(null)
                .originalName(storagePath.substring(storagePath.lastIndexOf('/') + 1))
                .storagePath(storagePath)
                .contentType(contentType != null ? contentType : "image/jpeg")
                .thumbnailStoragePath(null)
                .fileSize(fileSize)
                .uploadedBy(null)
                .build());
    }

    public Optional<UploadFile> findUploadFileByStoragePath(String storagePath) {
        return storagePath == null ? Optional.empty() : uploadFileRepository.findFirstByStoragePath(storagePath);
    }

    //저장후 반환-------------------
    UploadFileResponseDTO toDTO(UploadFile file){
        return UploadFileResponseDTO.builder()
                .fileId(file.getFileId())
                .originalName(file.getOriginalName())
                .contentType(file.getContentType())
                .fileSize(file.getFileSize())
                .uploadTargetType(file.getTargetType())
                .fileUrl(file.getStoragePath())
                .thumbnailUrl(file.getThumbnailStoragePath())
                .build();
    }
    //파일타입---------
    private UploadFileType determineFileType(UploadTargetType targetType, String contentType) {
        if (targetType == UploadTargetType.CARE_TARGET) return UploadFileType.IMAGE;
        if (targetType == UploadTargetType.CALL_LOG) return UploadFileType.AUDIO;
        if (targetType == UploadTargetType.INBOUND_SMS) return UploadFileType.IMAGE;

        if (contentType.contains("image")) return UploadFileType.IMAGE;
        if (contentType.contains("pdf") || contentType.contains("word") || contentType.contains("text")) return UploadFileType.DOCUMENT;

        throw new IllegalArgumentException("지원하지 않는 형식입니다.");
    }
    //---------------------------



    //-------------------------------------------------------------------------------------------------
    //  --내
    //  --부
    //--  메서드-----------------------------------------------------------------------------------------


    //  정제된 파일명(uuid) -> 1차 파일 경로를 만들기------------------------------------------------------------
    //  원본 / 썸네일 둘다 대응------------------------------------------------------------
    private String generateStorageKey(UploadTargetType targetType, Long targetId, String originalName, String thumbnailStorageKey) {
        String ext = extractExt(originalName);  //"" or .jpg

        if (thumbnailStorageKey != null && !thumbnailStorageKey.isEmpty()) {
            int lastSlashIndex = thumbnailStorageKey.lastIndexOf("/");
            int lastDotIndex = thumbnailStorageKey.lastIndexOf(".");

            String path = thumbnailStorageKey.substring(0, lastSlashIndex + 1);
            String fileName = thumbnailStorageKey.substring(lastSlashIndex + 1);

            if (lastDotIndex <= lastSlashIndex) {
                fileName += ".jpg";
            }

            return path + "s_" + fileName;
            // return CARE_TARGET/11/ + s_ + dfdg83fj4444.jpg
        } else {
            return targetType.name() + "/" + targetId + "/" + UUID.randomUUID() + ext;
        }//return CARE_TARGET/11/dfdg83fj4444.jpg
    }
    //-------------------------------------------------------------------------------------------------


    // 원본 파일명을 제외하고 확장자 추출--------------------------------------------------------------------------
    private String extractExt(String filename) {
        if (filename == null) return ""; //파일이름 없으면 ""
        int idx = filename.lastIndexOf("."); //(.점)의 위치를 찾기 가장 마지막 (.점)
        if (idx < 0 || idx == filename.length() - 1) return ""; //(.점)이 존재하지 않는경우 ""로 반환 |||| 예시 dog  | 존재하는 경우는 dog.jpg
        return filename.substring(idx); //(.점)을 포함하여 (.점)뒤의 문자를 가져옴 -> jpg -> 반환
    }
    //-------------------------------------------------------------------------------------------------


    //로컬 저장-------------------------------------------------------------------------------------------------
    private void saveToLocal(String storageKey, MultipartFile file) {
        try {
            //전체경로 만들기
            Path path = Paths.get(BASE_DIR, storageKey); //베이스 경로 uploads  + CARE_TARGET/11/dfdg83fj4444.jpg
            //디렉토리 생성 있으면 넘어가기
            Files.createDirectories(path.getParent()); //path.getParent() -> 부모의 경로만 [uploads/CARE_TARGET/11/]
            //Files.copy -> 로컬저장 (파일, 전체경로, 옵션:같은파일은 덮어쓰기)
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

            log.info("[FILE][UPLOAD] {}", path.toAbsolutePath());
        } catch (Exception e) {
            throw new RuntimeException("File save failed", e);
        }
    }

    /** URL에서 InputStream으로 로컬 저장 (saveFromUrl 전용) */
    private void saveToLocalFromStream(String storageKey, InputStream inputStream) throws IOException {
        Path path = Paths.get(BASE_DIR, storageKey);
        Files.createDirectories(path.getParent());
        Files.copy(inputStream, path, StandardCopyOption.REPLACE_EXISTING);
        log.info("[FILE][UPLOAD_FROM_URL] {}", path.toAbsolutePath());
    }
    //-------------------------------------------------------------------------------------------------


    // 이미지 파일인지 확인 (PDF 포함)----------------------------------------------------------------------
    private boolean isImageFile(String contentType) {
        if (contentType == null) return false;
        // PDF도 이미지 파일로 처리
        if (contentType.equals("application/pdf")) return true;
        return contentType.startsWith("image/");
    }
    //-------------------------------------------------------------------------------------------------


    //썸네일 -----------------------------------------------------------------------------------------
    // 썸네일 생성 (최대 300x300)                           //원본 하위경로 | 타입 | 타겟id
    private String generateThumbnail(
            String originalStorageKey,
            UploadTargetType targetType,
            Long targetId,
            String originalName) throws IOException {


        Path originalPath = Paths.get(BASE_DIR, originalStorageKey);
        if (!Files.exists(originalPath)) {
            throw new IOException("Original file not found: " + originalPath);
        }

        // 원본 이미지 읽기 ImageIO.read -> 읽고 - (디코딩) - 자바가 만질 수 있게 변환
        //BufferedImage -> 이미지 조작(비트맵 이미지 데이터)
        BufferedImage originalImage = ImageIO.read(originalPath.toFile());
        if (originalImage == null) {
            throw new IOException("Failed to read image: " + originalPath);
        }


        //이미지 사이즈 결정------------
        int maxSize = 300;
        //원본이미지의 가로, 세로 값 읽기
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        int thumbnailWidth, thumbnailHeight;
        //PC화면과 같이 가로가 긴경우
        if (originalWidth > originalHeight) {
            thumbnailWidth = Math.min(maxSize, originalWidth);  //최대픽셀제한 300 , 원본가로1000  -> 300을 채택
            thumbnailHeight = (int) ((double) originalHeight * thumbnailWidth / originalWidth);
        } else {
            thumbnailHeight = Math.min(maxSize, originalHeight);
            thumbnailWidth = (int) ((double) originalWidth * thumbnailHeight / originalHeight);
        }
        //---------

        //투명도 -----                 //원본 하위경로
        String extension = extractExt(originalStorageKey).toLowerCase(); //확장자 추출 함수
        boolean hasAlpha = originalImage.getColorModel().hasAlpha(); //투명도값이 있으면 true
        int imageType = hasAlpha && extension.equals(".png") //투명도가 있고 / png라면
                ? BufferedImage.TYPE_INT_ARGB//투명도 true (알파, 빨강, 초록, 파랑만 있음)  int imageType = 2
                : BufferedImage.TYPE_INT_RGB;//투명도 false (빨강, 초록, 파랑만 있음)  int imageType = 1
        //------------

        // 빈 썸네일 준비                         ( 가로, 세로, 1 or 2)
        BufferedImage thumbnail = new BufferedImage(thumbnailWidth, thumbnailHeight, imageType);
        //썸네일 2D 조작
        Graphics2D g2d = thumbnail.createGraphics();

        //설정 PNG 전용 특수 설정
        if (hasAlpha && extension.equals(".png")) {
            g2d.setComposite(AlphaComposite.Src);
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        } else {
            // RGB 이미지의 경우 흰색 배경 설정
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, thumbnailWidth, thumbnailHeight);
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        }

        //실제 그리는 단계 -> 원본이미지 ,  x축 끝부터 y축 끝까지 드로우 적용  , 정했던 가로, 세로 값(300px)
        g2d.drawImage(originalImage, 0, 0, thumbnailWidth, thumbnailHeight, null);
        g2d.dispose(); //조작 끝

        String thumbnailStorageKey = generateStorageKey(targetType, targetId, originalName, originalStorageKey);
        Path thumbnailPath = Paths.get(BASE_DIR, thumbnailStorageKey); //전체경로
        Files.createDirectories(thumbnailPath.getParent());

        String format = "jpg"; // 기본값
        if (extension.equals(".png")) {
            format = "png";
        } else if (extension.equals(".gif")) {
            format = "gif";
        } else if (extension.equals(".bmp")) {
            format = "bmp";
        } else if (extension.equals(".jpg") || extension.equals(".jpeg")) {
            format = "jpg";
        }

        //로컬 파일 쓰기
        ImageIO.write(thumbnail, format, thumbnailPath.toFile());

        //반환 썸네일 경로
        return thumbnailStorageKey;
    }


    //케어대상자 이미지 조회
    //----------------------------------------------------------------------------------------------------
    public List<UploadFileResponseDTO> careTargetFiles(Long organizationId, Long careTargetId){

        UploadTargetType uploadTargetType = UploadTargetType.CARE_TARGET;
        List<UploadFile> uploadFiles = uploadFileRepository.findByCareTargetAndType(careTargetId, organizationId, uploadTargetType);
        return uploadFiles.stream()
                .map(this::toDTO) // 모든 파일을 toDTO 메서드로 변환
                .collect(Collectors.toList()); // 리스트로 모으기
    }
    //케어대상자 이미지 삭제
    //----------------------------------------------------------------------
    public void deletecareTargetFiles(Long organizationId, Long careTargetId){
        UploadTargetType uploadTargetType = UploadTargetType.CARE_TARGET;
        List<UploadFile> uploadFiles = uploadFileRepository.findByCareTargetAndType(careTargetId, organizationId, uploadTargetType);
        deleteFiles(organizationId,careTargetId,uploadFiles);
    }





    //삭제 로직
    //------------------------------------------------------------------
    public void deleteFiles(Long organizationId, Long targetId, List<UploadFile> uploadFiles) {
        if (uploadFiles != null && !uploadFiles.isEmpty()) {
            for (UploadFile uploadFile : uploadFiles) {

                String storagePath = BASE_DIR + File.separator + uploadFile.getStoragePath();
                String thStoragePath = (uploadFile.getThumbnailStoragePath() != null)
                        ? BASE_DIR + File.separator + uploadFile.getThumbnailStoragePath()
                        : null;

                try {
                    File file = new File(storagePath);
                    if (file.exists() && file.delete()) {
                        System.out.println("물리 원본 파일 삭제 성공: " + storagePath);
                    }
                    if (thStoragePath != null) {
                        File sFile = new File(thStoragePath);
                        if (sFile.exists() && sFile.delete()) {
                            System.out.println("물리 썸네일 파일 삭제 성공: " + thStoragePath);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("파일 삭제 중 오류 발생 [" + uploadFile.getOriginalName() + "]: " + e.getMessage());
                }
            }

            uploadFileRepository.deleteAll(uploadFiles);
        }
    }
    //------------------------------------------------------------------

}