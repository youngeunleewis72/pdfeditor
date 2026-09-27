pub mod pdf_ops;

use pdf_ops::{ExportPageConfig, PdfDocumentInfo};

#[tauri::command]
fn get_pdf_info(path: String) -> Result<PdfDocumentInfo, String> {
    pdf_ops::get_pdf_info(&path)
}

#[tauri::command]
fn read_pdf_bytes(path: String) -> Result<Vec<u8>, String> {
    pdf_ops::read_pdf_bytes(&path)
}

#[tauri::command]
fn export_pdf(
    source_path: String,
    target_path: String,
    pages: Vec<ExportPageConfig>,
) -> Result<(), String> {
    pdf_ops::export_pdf(&source_path, &target_path, pages)
}

#[tauri::command]
fn merge_pdfs(source_paths: Vec<String>, target_path: String) -> Result<(), String> {
    pdf_ops::merge_pdfs(source_paths, &target_path)
}

#[tauri::command]
fn split_pdf(
    source_path: String,
    output_dir: String,
    base_name: String,
) -> Result<Vec<String>, String> {
    pdf_ops::split_pdf(&source_path, &output_dir, &base_name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_pdf_info,
            read_pdf_bytes,
            export_pdf,
            merge_pdfs,
            split_pdf
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
