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
export type SectionType = 'HERO' | 'POINTS' | 'OPTIONS' | 'DETAILS' | 'INFO';

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
            detailView: 'Detail & Story',
            productInfo: 'Product Info',
            moodStory: 'Mood & Story',
        },
    };
    switch (design) {
        case 'MODERN': return {
            ...base, pageDesign: 'MODERN', pointLayout: 'ZIGZAG', heroBadge: 'NEW ARRIVAL COLLECTION',
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-black/50', fontSize: 'text-xl', fontWeight: 'font-bold', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'EMOTIONAL': return {
            ...base, pageDesign: 'EMOTIONAL', pointLayout: 'SIMPLE', heroBadge: 'Curated Collection',
            headers: { ...base.headers, newArrival: '감성 컬렉션', moodStory: 'Mood & Feeling', whyThisItem: 'Special Point', whySub: '이 옷이 특별한 이유' },
            themeColor: 'PINK' as PointThemeColor,
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'center', textColor: 'text-white', bgColor: 'bg-black/30', fontSize: 'text-2xl', fontWeight: 'font-medium', fontFamily: 'font-serif-kr' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'IMPACT': return {
            ...base, pageDesign: 'IMPACT', pointLayout: 'CARDS', heroBadge: 'BEST SELLER',
            headers: { ...base.headers, newArrival: 'MUST HAVE', whyThisItem: 'CHECK POINT', whySub: '꼭 확인하세요', moodStory: 'REVIEW' },
            themeColor: 'BLACK' as PointThemeColor,
            pointIconStyle: 'NUMBER' as PointIconStyle,
            sectionOrder: ['HERO', 'POINTS', 'DETAILS', 'OPTIONS', 'INFO'],
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
            detailView: 'Detail & Story',
            productInfo: 'Product Info',
            moodStory: 'Space & Mood',
        },
    };
    switch (design) {
        case 'MODERN': return {
            ...base, pageDesign: 'MODERN', pointLayout: 'ZIGZAG', heroBadge: 'HOME & LIVING BEST',
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-emerald-900/50', fontSize: 'text-xl', fontWeight: 'font-bold', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'EMOTIONAL': return {
            ...base, pageDesign: 'EMOTIONAL', pointLayout: 'SIMPLE', heroBadge: '공간을 바꾸는 작은 변화',
            headers: { ...base.headers, newArrival: '감성 인테리어', moodStory: '나만의 공간', whyThisItem: 'Why This?', whySub: '공간이 달라지는 이유' },
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'center', textColor: 'text-white', bgColor: 'bg-black/30', fontSize: 'text-2xl', fontWeight: 'font-medium', fontFamily: 'font-serif-kr' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'IMPACT': return {
            ...base, pageDesign: 'IMPACT', pointLayout: 'CARDS', heroBadge: 'PREMIUM PICK',
            themeColor: 'BLACK' as PointThemeColor,
            pointIconStyle: 'NUMBER' as PointIconStyle,
            headers: { ...base.headers, whyThisItem: 'SPEC CHECK', whySub: '핵심 스펙을 확인하세요' },
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
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
            detailView: 'Detail & Story',
            productInfo: 'Product Info',
            moodStory: 'Kitchen Guide',
        },
    };
    switch (design) {
        case 'MODERN': return {
            ...base, pageDesign: 'MODERN', pointLayout: 'ZIGZAG', heroBadge: 'PREMIUM KITCHENWARE',
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-gray-900/60', fontSize: 'text-xl', fontWeight: 'font-bold', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'EMOTIONAL': return {
            ...base, pageDesign: 'EMOTIONAL', pointLayout: 'SIMPLE', heroBadge: '요리가 즐거워지는 순간',
            themeColor: 'ORANGE' as PointThemeColor,
            pointIconStyle: 'EMOJI' as PointIconStyle,
            headers: { ...base.headers, newArrival: '주방의 감성', moodStory: 'Cooking Mood', whyThisItem: 'Why This?', whySub: '요리가 달라지는 이유' },
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'center', textColor: 'text-white', bgColor: 'bg-black/30', fontSize: 'text-2xl', fontWeight: 'font-medium', fontFamily: 'font-serif-kr' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'IMPACT': return {
            ...base, pageDesign: 'IMPACT', pointLayout: 'CARDS', heroBadge: 'BEST OF BEST',
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
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
            detailView: 'Detail & Story',
            productInfo: 'Product Info',
            moodStory: 'Delicious Recipe',
        },
    };
    switch (design) {
        case 'MODERN': return {
            ...base, pageDesign: 'MODERN', pointLayout: 'ZIGZAG', heroBadge: 'FRESH FOOD MARKET',
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'bottom', textColor: 'text-white', bgColor: 'bg-orange-900/50', fontSize: 'text-xl', fontWeight: 'font-bold', fontFamily: 'font-sans' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'EMOTIONAL': return {
            ...base, pageDesign: 'EMOTIONAL', pointLayout: 'SIMPLE', heroBadge: '맛있는 한 끼의 시작',
            headers: { ...base.headers, newArrival: '오늘의 맛', moodStory: 'Taste Note', whyThisItem: '맛의 비밀', whySub: '이 맛이 특별한 이유' },
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
            bannerStyle: { position: 'center', textColor: 'text-white', bgColor: 'bg-black/30', fontSize: 'text-2xl', fontWeight: 'font-medium', fontFamily: 'font-serif-kr' },
            detailPattern: 'IMAGE_BANNER_ALT',
        };
        case 'IMPACT': return {
            ...base, pageDesign: 'IMPACT', pointLayout: 'CARDS', heroBadge: '입소문 맛집의 선택',
            themeColor: 'BLACK' as PointThemeColor,
            pointIconStyle: 'NUMBER' as PointIconStyle,
            headers: { ...base.headers, whyThisItem: 'TASTE CHECK', whySub: '맛의 핵심을 확인하세요' },
            sectionOrder: ['HERO', 'DETAILS', 'POINTS', 'OPTIONS', 'INFO'],
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
