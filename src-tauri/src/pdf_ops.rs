use lopdf::{Document, Object, ObjectId};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs::File;
use std::io::Read;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct PageInfo {
    pub page_number: u32,
    pub rotation: i32,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfDocumentInfo {
    pub file_name: String,
    pub file_path: String,
    pub file_size: u64,
    pub page_count: u32,
    pub pages: Vec<PageInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportPageConfig {
    pub original_page: u32, // 1-based page number from original PDF
    pub rotation: i32,      // Rotation in degrees (0, 90, 180, 270)
}

/// 파일 내용을 바이트로 읽기 (프론트엔드 PDF.js 렌더링용)
pub fn read_pdf_bytes(path: &str) -> Result<Vec<u8>, String> {
    let mut file = File::open(path).map_err(|e| format!("Failed to open file: {}", e))?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(buffer)
}

/// PDF 메타데이터 및 페이지 정보 읽기
pub fn get_pdf_info(path: &str) -> Result<PdfDocumentInfo, String> {
    let doc = Document::load(path).map_err(|e| format!("Failed to load PDF: {}", e))?;
    let file_path = Path::new(path);
    let file_name = file_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "document.pdf".to_string());
    let file_size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);

    let pages = doc.get_pages();
    let mut page_infos = Vec::new();

    for (page_num, page_id) in &pages {
        let mut rotation = 0;
        let mut width = 595.0; // 기본 A4 (points)
        let mut height = 842.0;

        if let Ok(page_dict) = doc.get_dictionary(*page_id) {
            if let Ok(rot_obj) = page_dict.get(b"Rotate") {
                if let Ok(rot) = rot_obj.as_i64() {
                    rotation = rot as i32;
                }
            }

            if let Ok(media_box) = page_dict.get(b"MediaBox") {
                if let Ok(box_arr) = media_box.as_array() {
                    if box_arr.len() == 4 {
                        let x1 = box_arr[0]
                            .as_float()
                            .or_else(|_| box_arr[0].as_i64().map(|v| v as f32))
                            .unwrap_or(0.0);
                        let y1 = box_arr[1]
                            .as_float()
                            .or_else(|_| box_arr[1].as_i64().map(|v| v as f32))
                            .unwrap_or(0.0);
                        let x2 = box_arr[2]
                            .as_float()
                            .or_else(|_| box_arr[2].as_i64().map(|v| v as f32))
                            .unwrap_or(595.0);
                        let y2 = box_arr[3]
                            .as_float()
                            .or_else(|_| box_arr[3].as_i64().map(|v| v as f32))
                            .unwrap_or(842.0);
                        width = ((x2 - x1).abs()) as f64;
                        height = ((y2 - y1).abs()) as f64;
                    }
                }
            }
        }

        page_infos.push(PageInfo {
            page_number: *page_num,
            rotation,
            width,
            height,
        });
    }

    Ok(PdfDocumentInfo {
        file_name,
        file_path: path.to_string(),
        file_size,
        page_count: pages.len() as u32,
        pages: page_infos,
    })
}

/// 페이지 회전, 순서 변경, 삭제가 적용된 새 PDF 내보내기
pub fn export_pdf(
    source_path: &str,
    target_path: &str,
    selected_pages: Vec<ExportPageConfig>,
) -> Result<(), String> {
    if selected_pages.is_empty() {
        return Err("최소 1개 이상의 페이지를 선택해야 합니다.".to_string());
    }

    let mut doc =
        Document::load(source_path).map_err(|e| format!("PDF 불러오기 실패: {}", e))?;
    let original_pages = doc.get_pages();

    // 1. 필요한 페이지들의 회전 각도 갱신
    for page_cfg in &selected_pages {
        if let Some(&page_id) = original_pages.get(&page_cfg.original_page) {
            if let Ok(page_dict) = doc
                .get_object_mut(page_id)
                .and_then(|obj| obj.as_dict_mut())
            {
                page_dict.set("Rotate", Object::Integer(page_cfg.rotation as i64));
            }
        }
    }

    // 2. 루트 Pages 딕셔너리 찾기
    let root_id = doc
        .trailer
        .get(b"Root")
        .map_err(|e| format!("Trailer에서 Root 카탈로그를 찾을 수 없습니다: {:?}", e))?
        .as_reference()
        .map_err(|e| format!("Invalid Root reference: {:?}", e))?;

    let pages_id = doc
        .get_dictionary(root_id)
        .map_err(|e| format!("Catalog dictionary error: {}", e))?
        .get(b"Pages")
        .map_err(|e| format!("Pages dictionary not found in Catalog: {:?}", e))?
        .as_reference()
        .map_err(|e| format!("Invalid Pages reference: {:?}", e))?;

    // 3. 사용자가 지정한 순서의 Kids 목록 생성
    let mut new_kids = Vec::new();
    for page_cfg in &selected_pages {
        if let Some(&page_id) = original_pages.get(&page_cfg.original_page) {
            new_kids.push(Object::Reference(page_id));

            // 각 페이지의 Parent를 루트 Pages ID로 설정
            if let Ok(page_dict) = doc
                .get_object_mut(page_id)
                .and_then(|obj| obj.as_dict_mut())
            {
                page_dict.set("Parent", Object::Reference(pages_id));
            }
        }
    }

    // 4. Pages 딕셔너리 업데이트
    if let Ok(pages_dict) = doc
        .get_object_mut(pages_id)
        .and_then(|obj| obj.as_dict_mut())
    {
        pages_dict.set("Kids", Object::Array(new_kids));
        pages_dict.set("Count", Object::Integer(selected_pages.len() as i64));
    } else {
        return Err("Pages 딕셔너리를 갱신할 수 없습니다.".to_string());
    }

    // 5. 사용되지 않는 불필요한 객체(삭제된 페이지 등) 정리
    doc.prune_objects();

    // 6. 파일 저장
    doc.save(target_path)
        .map_err(|e| format!("PDF 저장 실패: {}", e))?;

    Ok(())
}

/// 여러 PDF 문서 병합
pub fn merge_pdfs(source_paths: Vec<String>, target_path: &str) -> Result<(), String> {
    if source_paths.is_empty() {
        return Err("병합할 PDF 파일 목록이 비어있습니다.".to_string());
    }

    let mut max_id = 1;
    let mut documents_pages = BTreeMap::new();
    let mut documents_objects = BTreeMap::new();
    let mut target_doc = Document::with_version("1.5");

    for path in source_paths {
        let mut doc =
            Document::load(&path).map_err(|e| format!("'{}' 로드 실패: {}", path, e))?;

        doc.renumber_objects_with(max_id);
        max_id = doc.max_id + 1;

        let pages = doc.get_pages();
        for (_, object_id) in pages {
            if let Ok(obj) = doc.get_object(object_id) {
                documents_pages.insert(object_id, obj.clone());
            }
        }

        documents_objects.extend(doc.objects);
    }

    let mut catalog_object: Option<(ObjectId, Object)> = None;
    let mut pages_object: Option<(ObjectId, Object)> = None;

    for (object_id, object) in documents_objects.into_iter() {
        match object.type_name().unwrap_or(b"") {
            b"Catalog" => {
                if catalog_object.is_none() {
                    catalog_object = Some((object_id, object));
                }
            }
            b"Pages" => {
                if let Ok(dictionary) = object.as_dict() {
                    let mut dictionary = dictionary.clone();
                    if let Some((_, ref existing_pages)) = pages_object {
                        if let Ok(old_dict) = existing_pages.as_dict() {
                            dictionary.extend(old_dict);
                        }
                    }
                    pages_object = Some((
                        pages_object.map(|(id, _)| id).unwrap_or(object_id),
                        Object::Dictionary(dictionary),
                    ));
                }
            }
            b"Page" => {} // Page는 나중에 처리
            b"Outlines" | b"Outline" => {}
            _ => {
                target_doc.objects.insert(object_id, object);
            }
        }
    }

    let (catalog_id, catalog_object) = catalog_object
        .ok_or_else(|| "Catalog 루트를 찾을 수 없습니다.".to_string())?;
    let (page_id, page_object) =
        pages_object.ok_or_else(|| "Pages 루트를 찾을 수 없습니다.".to_string())?;

    // Pages를 Parent로 설정
    for (object_id, object) in &documents_pages {
        if let Ok(dictionary) = object.as_dict() {
            let mut dictionary = dictionary.clone();
            dictionary.set("Parent", Object::Reference(page_id));
            target_doc
                .objects
                .insert(*object_id, Object::Dictionary(dictionary));
        }
    }

    // Pages 딕셔너리 업데이트
    if let Ok(dictionary) = page_object.as_dict() {
        let mut dictionary = dictionary.clone();
        dictionary.set("Count", Object::Integer(documents_pages.len() as i64));
        dictionary.set(
            "Kids",
            Object::Array(documents_pages.keys().cloned().map(Object::Reference).collect()),
        );
        target_doc.objects.insert(page_id, Object::Dictionary(dictionary));
    }

    // Catalog 딕셔너리 업데이트
    if let Ok(dictionary) = catalog_object.as_dict() {
        let mut dictionary = dictionary.clone();
        dictionary.set("Pages", Object::Reference(page_id));
        dictionary.remove(b"Outlines");
        target_doc
            .objects
            .insert(catalog_id, Object::Dictionary(dictionary));
    }

    target_doc.trailer.set("Root", Object::Reference(catalog_id));
    target_doc.max_id = target_doc.objects.len() as u32;
    target_doc.renumber_objects();

    target_doc
        .save(target_path)
        .map_err(|e| format!("병합된 PDF 저장 실패: {}", e))?;

    Ok(())
}

/// PDF 페이지별 분할 저장
pub fn split_pdf(
    source_path: &str,
    output_dir: &str,
    base_name: &str,
) -> Result<Vec<String>, String> {
    let doc = Document::load(source_path).map_err(|e| format!("PDF 로드 실패: {}", e))?;
    let pages = doc.get_pages();
    let mut generated_files = Vec::new();

    let output_path = Path::new(output_dir);
    if !output_path.exists() {
        std::fs::create_dir_all(output_path)
            .map_err(|e| format!("출력 디렉토리 생성 실패: {}", e))?;
    }

    for (page_num, _) in &pages {
        let target_file_name = format!("{}_page_{}.pdf", base_name, page_num);
        let target_file_path = output_path.join(&target_file_name);
        let target_str = target_file_path.to_string_lossy().to_string();

        export_pdf(
            source_path,
            &target_str,
            vec![ExportPageConfig {
                original_page: *page_num,
                rotation: 0,
            }],
        )?;

        generated_files.push(target_str);
    }

    Ok(generated_files)
}
