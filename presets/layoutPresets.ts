// ══════════════════════════════════════════════
// 카테고리×디자인 프리셋 시스템
// 한 번의 선택으로 전체 상세페이지 구조가 결정됨
// ══════════════════════════════════════════════

import { ProductCategory } from '../types';

// ── 타입 정의 ──
export type PageDesignType = 'MODERN' | 'EMOTIONAL' | 'IMPACT';
export type PointLayoutType = 'ZIGZAG' | 'CARDS' | 'SIMPLE';
export type PointIconStyle = 'EMOJI' | 'NUMBER' | 'NONE';
export type PointThemeColor = 'INDIGO' | 'BLACK' | 'PINK' | 'BLUE' | 'GREEN' | 'ORANGE';
export type SectionType = 'HERO' | 'STORY' | 'POINTS' | 'OPTIONS' | 'DETAILS' | 'INFO';

// ── 배너 오버레이 스타일 ──
export interface BannerStyle {
    position: 'top' | 'center' | 'bottom';
    textColor: string;
    bgColor: string; // 반투명 배경
    fontSize: string;
    fontWeight: string;
    fontFamily: string;
}

// ── 테마 스타일 ──
export interface ThemeStyles {
    bg: string;
    text: string;
    fontHead: string;
    fontBody: string;
    storyQuote: string;
    sectionDivider: string;
    cardBg: string;
    tableHeader: string;
    tableBorder: string;
}

// ── 프리셋 전체 구조 ──
export interface LayoutPreset {
    // 기본 설정
    pageDesign: PageDesignType;
    pointLayout: PointLayoutType;
    pointIconStyle: PointIconStyle;
    themeColor: PointThemeColor;
    sectionOrder: SectionType[];

    // 히어로 배지
    heroBadge: string;

    // 섹션 헤더 텍스트
    headers: {
        newArrival: string;
        whyThisItem: string;
        whySub: string;
        detailView: string;
        productInfo: string;
        moodStory: string;
    };

    // 배너 스타일 (이미지 위 오버레이)
    bannerStyle: BannerStyle;

    // 디테일 영역 배치 패턴
    detailPattern: 'IMAGE_BANNER_ALT' | 'IMAGE_ONLY' | 'GRID_2COL';
}

// ── 테마 색상 맵 ──
export const THEME_COLORS: Record<PointThemeColor, { bg: string; text: string; border: string; lightBg: string; badge: string }> = {
    INDIGO: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', lightBg: 'bg-indigo-50', badge: 'bg-indigo-600' },
    BLACK: { bg: 'bg-gray-900', text: 'text-gray-900', border: 'border-gray-900', lightBg: 'bg-gray-100', badge: 'bg-gray-900' },
    PINK: { bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500', lightBg: 'bg-pink-50', badge: 'bg-pink-500' },
    BLUE: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', lightBg: 'bg-blue-50', badge: 'bg-blue-600' },
    GREEN: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', lightBg: 'bg-emerald-50', badge: 'bg-emerald-600' },
    ORANGE: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', lightBg: 'bg-orange-50', badge: 'bg-orange-500' },
};

// ── 디자인별 테마 스타일 ──
export function getThemeStyles(design: PageDesignType): ThemeStyles {
    switch (design) {
        case 'EMOTIONAL': return {
            bg: 'bg-[#fdfbf7]', text: 'text-gray-800', fontHead: 'font-serif-kr', fontBody: 'font-serif-kr',
            storyQuote: 'text-gray-400 font-serif', sectionDivider: 'bg-[#e0dcd0]',
            cardBg: 'bg-white', tableHeader: 'bg-[#f7f5f0] text-gray-800', tableBorder: 'border-[#d4d1c9]'
        };
        case 'IMPACT': return {
            bg: 'bg-white', text: 'text-black', fontHead: 'font-sans', fontBody: 'font-sans',
            storyQuote: 'text-black font-sans', sectionDivider: 'bg-black',
            cardBg: 'bg-gray-100', tableHeader: 'bg-black text-white', tableBorder: 'border-black'
        };
        default: return {
            bg: 'bg-white', text: 'text-gray-900', fontHead: 'font-sans', fontBody: 'font-sans',
            storyQuote: 'text-gray-300 font-serif', sectionDivider: 'bg-gray-100',
            cardBg: 'bg-gray-50', tableHeader: 'bg-gray-50 text-gray-700', tableBorder: 'border-gray-200'
        };
    }
}

// ══════════════════════════════════════════════
// 카테고리별 프리셋 팩토리
// ══════════════════════════════════════════════

function fashionPresets(design: PageDesignType): LayoutPreset {
    const base = {
        themeColor: 'INDIGO' as PointThemeColor,
        pointIconStyle: 'EMOJI' as PointIconStyle,
        headers: {
            newArrival: 'New Arrival',
            whyThisItem: 'Why This Item?',
            whySub: '이 상품을 선택해야 하는 이유',
            detailView: 'Detail View',
            productInfo: 'Product Info',
            moodStory: 'Mood & Story',
        },
    };
    switch (design) {
        case 'MODERN': return {
            ...base, pageDesign: 'MODERN', pointLayout: 'ZIGZAG', heroBadge: 'NEW ARRIVAL COLLECTION',
            sectionOrder: ['HERO', 'STORY', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-black/50', fontSize: 'text-xl', fontWeight: 'font-bold', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'EMOTIONAL': return {
            ...base, pageDesign: 'EMOTIONAL', pointLayout: 'SIMPLE', heroBadge: 'Curated Collection',
            headers: { ...base.headers, newArrival: '감성 컬렉션', moodStory: 'Mood & Feeling', whyThisItem: 'Special Point', whySub: '이 옷이 특별한 이유' },
            themeColor: 'PINK' as PointThemeColor,
            sectionOrder: ['HERO', 'DETAILS', 'STORY', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'center', textColor: 'text-white', bgColor: 'bg-black/30', fontSize: 'text-2xl', fontWeight: 'font-medium', fontFamily: 'font-serif-kr' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'IMPACT': return {
            ...base, pageDesign: 'IMPACT', pointLayout: 'CARDS', heroBadge: 'BEST SELLER',
            headers: { ...base.headers, newArrival: 'MUST HAVE', whyThisItem: 'CHECK POINT', whySub: '꼭 확인하세요', moodStory: 'REVIEW' },
            themeColor: 'BLACK' as PointThemeColor,
            pointIconStyle: 'NUMBER' as PointIconStyle,
            sectionOrder: ['HERO', 'POINTS', 'DETAILS', 'OPTIONS', 'STORY', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-black/70', fontSize: 'text-2xl', fontWeight: 'font-black', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
    }
}

function livingPresets(design: PageDesignType): LayoutPreset {
    const base = {
        themeColor: 'GREEN' as PointThemeColor,
        pointIconStyle: 'EMOJI' as PointIconStyle,
        headers: {
            newArrival: 'Home & Living Best',
            whyThisItem: 'Check Point',
            whySub: '이 상품을 선택해야 하는 이유',
            detailView: 'Detail View',
            productInfo: 'Product Info',
            moodStory: 'Space & Mood',
        },
    };
    switch (design) {
        case 'MODERN': return {
            ...base, pageDesign: 'MODERN', pointLayout: 'ZIGZAG', heroBadge: 'HOME & LIVING BEST',
            sectionOrder: ['HERO', 'POINTS', 'DETAILS', 'STORY', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-emerald-900/50', fontSize: 'text-xl', fontWeight: 'font-bold', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'EMOTIONAL': return {
            ...base, pageDesign: 'EMOTIONAL', pointLayout: 'SIMPLE', heroBadge: '공간을 바꾸는 작은 변화',
            headers: { ...base.headers, newArrival: '감성 인테리어', moodStory: '나만의 공간', whyThisItem: 'Why This?', whySub: '공간이 달라지는 이유' },
            sectionOrder: ['HERO', 'DETAILS', 'STORY', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'center', textColor: 'text-white', bgColor: 'bg-black/30', fontSize: 'text-2xl', fontWeight: 'font-medium', fontFamily: 'font-serif-kr' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'IMPACT': return {
            ...base, pageDesign: 'IMPACT', pointLayout: 'CARDS', heroBadge: 'PREMIUM PICK',
            themeColor: 'BLACK' as PointThemeColor,
            pointIconStyle: 'NUMBER' as PointIconStyle,
            headers: { ...base.headers, whyThisItem: 'SPEC CHECK', whySub: '핵심 스펙을 확인하세요' },
            sectionOrder: ['HERO', 'POINTS', 'DETAILS', 'OPTIONS', 'STORY', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-black/70', fontSize: 'text-2xl', fontWeight: 'font-black', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
    }
}

function kitchenPresets(design: PageDesignType): LayoutPreset {
    const base = {
        themeColor: 'BLACK' as PointThemeColor,
        pointIconStyle: 'NUMBER' as PointIconStyle,
        headers: {
            newArrival: 'Premium Kitchenware',
            whyThisItem: 'Smart Point',
            whySub: '이 상품을 선택해야 하는 이유',
            detailView: 'Detail View',
            productInfo: 'Product Info',
            moodStory: 'Kitchen Guide',
        },
    };
    switch (design) {
        case 'MODERN': return {
            ...base, pageDesign: 'MODERN', pointLayout: 'ZIGZAG', heroBadge: 'PREMIUM KITCHENWARE',
            sectionOrder: ['HERO', 'POINTS', 'DETAILS', 'OPTIONS', 'STORY', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-gray-900/60', fontSize: 'text-xl', fontWeight: 'font-bold', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'EMOTIONAL': return {
            ...base, pageDesign: 'EMOTIONAL', pointLayout: 'SIMPLE', heroBadge: '요리가 즐거워지는 순간',
            themeColor: 'ORANGE' as PointThemeColor,
            pointIconStyle: 'EMOJI' as PointIconStyle,
            headers: { ...base.headers, newArrival: '주방의 감성', moodStory: 'Cooking Mood', whyThisItem: 'Why This?', whySub: '요리가 달라지는 이유' },
            sectionOrder: ['HERO', 'DETAILS', 'STORY', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'center', textColor: 'text-white', bgColor: 'bg-black/30', fontSize: 'text-2xl', fontWeight: 'font-medium', fontFamily: 'font-serif-kr' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'IMPACT': return {
            ...base, pageDesign: 'IMPACT', pointLayout: 'CARDS', heroBadge: 'BEST OF BEST',
            sectionOrder: ['HERO', 'POINTS', 'DETAILS', 'OPTIONS', 'STORY', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-black/70', fontSize: 'text-2xl', fontWeight: 'font-black', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
    }
}

function foodPresets(design: PageDesignType): LayoutPreset {
    const base = {
        themeColor: 'ORANGE' as PointThemeColor,
        pointIconStyle: 'EMOJI' as PointIconStyle,
        headers: {
            newArrival: 'Fresh Food Market',
            whyThisItem: 'Why This Taste?',
            whySub: '이 맛을 선택해야 하는 이유',
            detailView: 'Detail View',
            productInfo: 'Product Info',
            moodStory: 'Delicious Recipe',
        },
    };
    switch (design) {
        case 'MODERN': return {
            ...base, pageDesign: 'MODERN', pointLayout: 'ZIGZAG', heroBadge: 'FRESH FOOD MARKET',
            sectionOrder: ['HERO', 'STORY', 'POINTS', 'DETAILS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-orange-900/50', fontSize: 'text-xl', fontWeight: 'font-bold', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'EMOTIONAL': return {
            ...base, pageDesign: 'EMOTIONAL', pointLayout: 'SIMPLE', heroBadge: '맛있는 한 끼의 시작',
            headers: { ...base.headers, newArrival: '오늘의 맛', moodStory: 'Taste Note', whyThisItem: '맛의 비밀', whySub: '이 맛이 특별한 이유' },
            sectionOrder: ['HERO', 'DETAILS', 'STORY', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'center', textColor: 'text-white', bgColor: 'bg-black/30', fontSize: 'text-2xl', fontWeight: 'font-medium', fontFamily: 'font-serif-kr' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'IMPACT': return {
            ...base, pageDesign: 'IMPACT', pointLayout: 'CARDS', heroBadge: '입소문 맛집의 선택',
            themeColor: 'BLACK' as PointThemeColor,
            pointIconStyle: 'NUMBER' as PointIconStyle,
            headers: { ...base.headers, whyThisItem: 'TASTE CHECK', whySub: '맛의 핵심을 확인하세요' },
            sectionOrder: ['HERO', 'POINTS', 'DETAILS', 'OPTIONS', 'STORY', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-black/70', fontSize: 'text-2xl', fontWeight: 'font-black', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
    }
}

// ══════════════════════════════════════════════
// 메인 프리셋 팩토리 함수
// ══════════════════════════════════════════════
export function getPreset(category: ProductCategory, design: PageDesignType): LayoutPreset {
    switch (category) {
        case 'FASHION': return fashionPresets(design);
        case 'LIVING': return livingPresets(design);
        case 'KITCHEN': return kitchenPresets(design);
        case 'FOOD': return foodPresets(design);
    }
}

// ── 폰트 옵션 목록 ──
export const FONT_FAMILIES = [
    { name: '기본 (고딕)', value: 'font-sans' },
    { name: '명조체', value: 'font-serif-kr' },
    { name: '돋움체', value: 'font-dodum' },
    { name: '손글씨', value: 'font-pen' },
];

// ── 오버레이 배너 위치 계산 ──
export function getBannerPositionClass(position: BannerStyle['position']): string {
    switch (position) {
        case 'top': return 'top-0 left-0 right-0';
        case 'center': return 'top-1/2 left-0 right-0 -translate-y-1/2';
        case 'bottom': return 'bottom-0 left-0 right-0';
    }
}

// ══════════════════════════════════════════════
// 섹션 Variant 카탈로그 (Step 1: 데이터만, 렌더링 미적용)
// ──────────────────────────────────────────────
// 향후 Step 2에서 LLM이 섹션별 variant를 직접 선택하도록 확장하고,
// Step 3에서 ResultPreview가 variant에 따라 다른 컴포넌트를 렌더한다.
// ══════════════════════════════════════════════

export type HeroVariant =
    | 'IMAGE_BANNER'      // 이미지 + 오버레이 텍스트(현재 기본)
    | 'SPLIT_LEFT'        // 좌측 이미지 / 우측 카피
    | 'SPLIT_RIGHT'       // 좌측 카피 / 우측 이미지
    | 'FULL_BLEED'        // 풀폭 이미지, 텍스트는 아래
    | 'CARD_STACK';       // 카드형(이미지+카피 한 카드)

export type PointsVariant =
    | 'ZIGZAG'            // 번갈아 배치(현 PointLayoutType과 동일)
    | 'CARDS'             // 카드 그리드
    | 'SIMPLE'            // 단순 리스트
    | 'GRID_2COL'         // 2열 그리드(컴팩트)
    | 'NUMBERED_LIST'     // 번호 강조 리스트
    | 'STACKED_HERO';     // 포인트마다 풀폭 이미지

export type DetailVariant =
    | 'IMAGE_BANNER_ALT'  // 현재 기본
    | 'IMAGE_ONLY'        // 텍스트 없이 이미지만
    | 'GRID_2COL'         // 2열 이미지 그리드
    | 'STORYBOARD'        // 시퀀스 + 캡션
    | 'MAGAZINE'          // 잡지형 혼합 블록
    | 'BEFORE_AFTER';     // 비교(전/후)

export type StoryVariant =
    | 'QUOTE_LARGE'       // 큰 인용문 강조
    | 'MAGAZINE_SPLIT'    // 이미지+텍스트 분할
    | 'FULL_TEXT'         // 텍스트 중심
    | 'TIMELINE';         // 시간순/단계 진행

export type OptionsVariant =
    | 'GRID'              // 격자(현재 기본)
    | 'LIST'              // 세로 리스트 + 설명
    | 'SWATCH'            // 색상/패턴 스와치
    | 'COMPARISON';       // 비교 테이블

export type InfoVariant =
    | 'TABLE'             // 표 형식(현재 기본)
    | 'CARD_LIST'         // 카드 목록
    | 'INLINE';           // 인라인 텍스트

// ── 섹션 variant 묶음 ──
export interface SectionVariantSet {
    hero: HeroVariant;
    points: PointsVariant;
    details: DetailVariant;
    story: StoryVariant;
    options: OptionsVariant;
    info: InfoVariant;
}

// ── 카테고리×디자인별 권장 variant 카탈로그 ──
// 키 형식: `${ProductCategory}_${PageDesignType}`
export const SECTION_VARIANT_CATALOG: Record<string, SectionVariantSet> = {
    FASHION_MODERN:    { hero: 'SPLIT_RIGHT',   points: 'ZIGZAG',         details: 'MAGAZINE',         story: 'MAGAZINE_SPLIT', options: 'SWATCH',     info: 'TABLE' },
    FASHION_EMOTIONAL: { hero: 'FULL_BLEED',    points: 'SIMPLE',         details: 'STORYBOARD',       story: 'QUOTE_LARGE',    options: 'GRID',       info: 'CARD_LIST' },
    FASHION_IMPACT:    { hero: 'IMAGE_BANNER',  points: 'NUMBERED_LIST',  details: 'GRID_2COL',        story: 'FULL_TEXT',      options: 'COMPARISON', info: 'TABLE' },

    LIVING_MODERN:     { hero: 'SPLIT_LEFT',    points: 'CARDS',          details: 'GRID_2COL',        story: 'MAGAZINE_SPLIT', options: 'GRID',       info: 'TABLE' },
    LIVING_EMOTIONAL:  { hero: 'FULL_BLEED',    points: 'STACKED_HERO',   details: 'STORYBOARD',       story: 'QUOTE_LARGE',    options: 'LIST',       info: 'CARD_LIST' },
    LIVING_IMPACT:     { hero: 'IMAGE_BANNER',  points: 'CARDS',          details: 'BEFORE_AFTER',     story: 'TIMELINE',       options: 'COMPARISON', info: 'TABLE' },

    KITCHEN_MODERN:    { hero: 'SPLIT_RIGHT',   points: 'NUMBERED_LIST',  details: 'STORYBOARD',       story: 'TIMELINE',       options: 'COMPARISON', info: 'TABLE' },
    KITCHEN_EMOTIONAL: { hero: 'CARD_STACK',    points: 'SIMPLE',         details: 'MAGAZINE',         story: 'MAGAZINE_SPLIT', options: 'GRID',       info: 'CARD_LIST' },
    KITCHEN_IMPACT:    { hero: 'IMAGE_BANNER',  points: 'NUMBERED_LIST',  details: 'BEFORE_AFTER',     story: 'FULL_TEXT',      options: 'COMPARISON', info: 'TABLE' },

    FOOD_MODERN:       { hero: 'FULL_BLEED',    points: 'CARDS',          details: 'STORYBOARD',       story: 'TIMELINE',       options: 'GRID',       info: 'TABLE' },
    FOOD_EMOTIONAL:    { hero: 'CARD_STACK',    points: 'SIMPLE',         details: 'MAGAZINE',         story: 'QUOTE_LARGE',    options: 'LIST',       info: 'CARD_LIST' },
    FOOD_IMPACT:       { hero: 'IMAGE_BANNER',  points: 'NUMBERED_LIST',  details: 'GRID_2COL',        story: 'FULL_TEXT',      options: 'COMPARISON', info: 'TABLE' },
};

// ── 카탈로그 조회(없으면 안전한 기본값) ──
export function getSectionVariants(category: ProductCategory, design: PageDesignType): SectionVariantSet {
    const key = `${category}_${design}`;
    return SECTION_VARIANT_CATALOG[key] ?? {
        hero: 'IMAGE_BANNER',
        points: 'ZIGZAG',
        details: 'IMAGE_BANNER_ALT',
        story: 'MAGAZINE_SPLIT',
        options: 'GRID',
        info: 'TABLE',
    };
}
