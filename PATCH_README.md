# detail-app 패치 (2026-03-14)

## 파일 교체 경로
```
cusomelab/detail-app/src/
├── components/ResultPreview.tsx  ← 교체
├── services/geminiService.ts     ← 교체
└── types.ts                      ← 교체 (PlanSection, ProductInfoDisclosure 타입 추가)
```

## 수정 내역

### 1. 옵션 이미지 텍스트 → 파일명 초기값
- `useEffect`에서 `getEnrichedCopy()` 사용으로 planSections 데이터 정상 반영
- 옵션 블록: `img.fileName` → `stripExtension(file.name)` 로직 정상 동작 확인
- 새 파일 업로드/드래그 시에도 파일명 자동 설정

### 2. AI 수정 마크다운 버그 수정
- **geminiService.ts**: 프롬프트에 "PLAIN TEXT ONLY. No markdown" 지시 추가
- **geminiService.ts**: 응답 후처리에 정규식 strip 추가 (이중 방어)
- **ResultPreview.tsx**: 모듈 레벨 `stripMarkdown()` 헬퍼 추가
- **MagicRewriter**: `onUpdate(stripMarkdown(newText))` 적용

### 3. 정보고시 중복 삭제
- INFO 섹션 내 **상단 Product Info 테이블** (소재/제조국/세탁방법 4x3 테이블) 완전 삭제
- **하단 상품 정보고시** 테이블에 누락 데이터 보완:
  - `제품명` 행 추가
  - `원산지`, `소재/재질` → infoDisclosure 우선, 없으면 editableCopy fallback
  - FASHION 카테고리: `세탁방법` 기본값 = "미지근한 물에 중성세제로 손세탁 또는 세탁망에 넣어 울코스 세탁을 권장합니다"
- copyright 텍스트는 정보고시 상단에 유지

### 4. 13개 기획안 → 실제 디자인 섹션 반영
- **SectionType 확장**: 6개 신규 타입 추가
  - `VISUAL_CLOSEUP` (비주얼 클로즈업) - 2x2 그리드 갤러리
  - `REVIEW` (고객 후기) - 별점 카드 레이아웃
  - `RECOMMEND` (추천 대상) - 체크마크 리스트
  - `SIZE_GUIDE` (사이즈 가이드) - 사이즈표 연동
  - `PRODUCT_GUIDE` (제품 가이드) - 스텝 바이 스텝
  - `CAUTION_NOTE` (구매 전 확인사항) - 경고 박스
- **getInitialSectionOrder()**: planSection.type → SectionType 1:1 매핑 (축소 금지)
- **editablePlanData** state: 모든 신규 섹션의 title/content 편집 가능
- **삭제 가능**: HERO/DETAILS/INFO 제외 모든 섹션에 삭제 버튼 활성화
- 모든 신규 섹션이 3가지 디자인 무드(MODERN/EMOTIONAL/IMPACT) + 6가지 테마 컬러 지원

## types.ts 추가 타입
```typescript
export interface PlanSection {
  type: string;
  title: string;
  content: string;
  enabled: boolean;
}

export interface ProductInfoDisclosure {
  manufacturer?: string;
  origin?: string;
  material?: string;
  // ... (총 15개 필드)
}
```
