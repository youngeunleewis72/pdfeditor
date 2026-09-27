# PDF Editor (Rust + Tauri v2 + React)

Rust와 Tauri v2, React 19, TypeScript, Tailwind CSS v4, PDF.js를 활용하여 구축된 고성능 데스크톱 PDF 편집기입니다.

---

## 🚀 주요 기능

- **PDF 파일 열기 및 썸네일 렌더링**
  - 네이티브 파일 다이얼로그로 PDF 파일 선택
  - `PDF.js`를 이용한 고속 페이지별 썸네일 생성 및 그리드 뷰
- **PDF 페이지 관리**
  - **페이지 회전**: 시계 방향 / 반시계 방향 90° 회전 (개별 및 전체 일괄 회전 지원)
  - **순서 변경**: 페이지 앞/뒤 이동을 통한 순서 재배열
  - **페이지 삭제**: 불필요한 페이지 제외 (최소 1페이지 유지)
  - **초기화**: 작업 도중 원본 순서 및 각도로 복원
- **새 PDF로 내보내기/저장**
  - Rust의 `lopdf` 라이브러리를 통해 변경된 페이지 순서, 회전, 삭제가 즉각 적용된 깨끗한 새 PDF 파일 생성
- **여러 PDF 병합 (Merge)**
  - 여러 PDF 파일을 선택하고 순서를 지정하여 하나의 PDF로 결합
- **PDF 분할 (Split)**
  - PDF의 각 페이지를 개별 PDF 파일로 한 번에 분할 저장
- **페이지 확대 미리보기**
  - 모달 다이얼로그를 통한 단일 페이지 확대 및 회전 검토

---

## 🛠️ 기술 스택 및 아키텍처

| 영역 | 기술 스택 | 설명 |
|------|-----------|------|
| **코어 백엔드** | **Rust 1.98+**, **lopdf 0.45** | 메모리 안전성과 빠른 속도로 PDF 트리 파싱, 회전, 재배열, 병합, 분할 처리 |
| **데스크톱 런타임** | **Tauri v2** | 경량 네이티브 웹뷰 및 안전한 IPC 통신, 시스템 다이얼로그 플러그인 연동 |
| **프론트엔드 UI** | **React 19**, **TypeScript** | 반응형 모던 컴포넌트 아키텍처 |
| **PDF 뷰어 엔진** | **PDF.js (pdfjs-dist)** | 캔버스 기반 클라이언트 사이드 고속 썸네일 및 페이지 렌더링 |
| **스타일링 & 아이콘** | **Tailwind CSS v4**, **Lucide React** | 다크모드 대응 모던 UI |

---

## 📁 프로젝트 구조

```
pdf_editor/
├── src/                          # 프론트엔드 (React + TypeScript)
│   ├── components/
│   │   ├── Navbar.tsx            # 상단 내비게이션 및 핵심 액션 바
│   │   ├── Toolbar.tsx           # 일괄 회전, 분할, 그리드 크기 조절
│   │   ├── PageCard.tsx          # 개별 페이지 썸네일 및 카드 컨트롤
│   │   ├── MergeModal.tsx        # 여러 PDF 병합 모달
│   │   └── PreviewModal.tsx      # 개별 페이지 확대 미리보기 모달
│   ├── services/
│   │   └── pdfService.ts         # PDF.js 썸네일 렌더러 및 Tauri IPC 통신 계층
│   ├── types.ts                  # 공통 TypeScript 인터페이스
│   ├── App.tsx                   # 메인 애플리케이션 화면
│   ├── App.css                   # Tailwind CSS v4 진입점
│   └── main.tsx
├── src-tauri/                    # 데스크톱 백엔드 (Rust + Tauri)
│   ├── src/
│   │   ├── lib.rs                # Tauri 커맨드 핸들러 및 플러그인 등록
│   │   ├── main.rs               # 진입점
│   │   └── pdf_ops.rs            # lopdf 기반 PDF 메타데이터 읽기, 회전/재배열 내보내기, 병합, 분할 로직
│   ├── capabilities/
│   │   └── default.json          # Tauri v2 권한 설정 (다이얼로그 등)
│   ├── tauri.conf.json           # Tauri 앱 설정 (창 크기, 번들 정보)
│   └── Cargo.toml                # Rust 의존성 (lopdf, tauri-plugin-dialog 등)
├── package.json
└── vite.config.ts
```

---

## 💻 실행 방법

### 1. 개발 모드 실행

Tauri 데스크톱 앱과 프론트엔드 Vite 핫 리로드를 함께 시작합니다:

```bash
npm run tauri dev
```

### 2. 프로덕션 빌드

배포 가능한 macOS 앱(`.app`, `.dmg`) 번들을 생성합니다:

```bash
npm run tauri build
```

---

## 🔧 주요 IPC 명령어 (Rust ↔ Frontend)

- `get_pdf_info(path)`: PDF 파일의 총 페이지 수, 크기, 각 페이지의 초기 회전각 반환
- `read_pdf_bytes(path)`: PDF 파일의 원시 바이트 스트림을 고속으로 프론트엔드에 전달
- `export_pdf(source_path, target_path, pages)`: 선택된 페이지들의 원본 인덱스와 변경된 회전각을 적용해 새 PDF 생성
- `merge_pdfs(source_paths, target_path)`: 다중 PDF 파일들을 순서대로 결합
- `split_pdf(source_path, output_dir, base_name)`: 각 페이지를 `[base_name]_page_[N].pdf`로 분할 저장
