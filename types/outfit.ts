export enum AccessoryType {
  모자 = '모자',
  반지 = '반지',
  목걸이 = '목걸이',
  가방 = '가방',
}

export enum AccessoryOption {
  유지 = '유지',
  제거 = '제거',
  생성 = '생성',
}

export type AccessoryOptions = Record<AccessoryType, AccessoryOption>;

export enum ModelStyle {
  원본유지 = '원본유지',
  한국여성아이돌 = '한국 여성 아이돌',
  한국남성아이돌 = '한국 남성 아이돌',
  한국발레리나 = '한국 발레리나',
  한국요가강사 = '한국 요가 강사',
  미시스타일 = '40~50대 미시(품격있는 어머니)',
  서양패션모델 = '서양 전문 패션 모델',
}

export const MODEL_STYLE_OPTIONS: Record<string, ModelStyle> = {
  '한국 여성 아이돌': ModelStyle.한국여성아이돌,
  '한국 남성 아이돌': ModelStyle.한국남성아이돌,
  '한국 발레리나': ModelStyle.한국발레리나,
  '한국 요가 강사': ModelStyle.한국요가강사,
  '40~50대 미시 스타일': ModelStyle.미시스타일,
  '서양 패션 모델': ModelStyle.서양패션모델,
  '변경 없음': ModelStyle.원본유지,
};

export enum Background {
  원본유지 = '원본유지',
  흰색스튜디오 = '흰색 스튜디오',
  회색스튜디오 = '회색 스튜디오',
  도시배경 = '도시 배경',
  자연풍경 = '자연 풍경',
  카페실내 = '카페 실내',
}

export const BACKGROUND_OPTIONS: Record<string, Background> = {
    '흰색 스튜디오': Background.흰색스튜디오,
    '회색 스튜디오': Background.회색스튜디오,
    '도시 배경': Background.도시배경,
    '자연 풍경': Background.자연풍경,
    '카페 실내': Background.카페실내,
    '변경 없음': Background.원본유지,
};

export enum Pose {
  원본유지 = '원본유지',
  서있기 = '서 있기',
  앉아있기 = '앉아 있기',
  걷기 = '걷기',
  다른자세 = '다른 자세',
  랜덤 = '랜덤',
}

export const POSE_OPTIONS: Record<string, Pose> = {
    '서 있기': Pose.서있기,
    '앉아 있기': Pose.앉아있기,
    '걷기': Pose.걷기,
    '다른 자세': Pose.다른자세,
    '랜덤': Pose.랜덤,
    '변경 없음': Pose.원본유지,
};

export enum ClothingFocus {
  원본유지 = '원본유지',
  전체 = '전체',
  티셔츠 = '티셔츠',
  아우터 = '아우터',
  하의 = '하의',
  원피스 = '원피스',
  아우터하의 = '아우터와 하의 유지',
  티셔츠하의 = '티셔츠와 하의 유지',
}

export const CLOTHING_FOCUS_OPTIONS: Record<string, ClothingFocus> = {
    '원본 의상 전체 유지 (가상 피팅)': ClothingFocus.원본유지,
    '상의(티셔츠)만 유지': ClothingFocus.티셔츠,
    '아우터만 유지': ClothingFocus.아우터,
    '하의만 유지': ClothingFocus.하의,
    '원피스만 유지': ClothingFocus.원피스,
    '아우터+하의 세트 유지': ClothingFocus.아우터하의,
    '상의+하의 세트 유지': ClothingFocus.티셔츠하의,
    '전체 의상 새로 생성': ClothingFocus.전체,
};

export enum ShotFocus {
  원본유지 = '원본유지',
  전신 = '전신',
  상반신 = '상반신',
  하반신 = '하반신',
  신발 = '신발',
  뒷모습 = '뒷모습',
}

export const SHOT_FOCUS_OPTIONS: Record<string, ShotFocus> = {
    '전신': ShotFocus.전신,
    '상반신': ShotFocus.상반신,
    '하반신': ShotFocus.하반신,
    '신발': ShotFocus.신발,
    '뒷모습': ShotFocus.뒷모습,
    '변경 없음': ShotFocus.원본유지,
};


export enum FaceConsistency {
  원본유지 = '원본유지',
  동일인물 = '동일 인물',
  다른인물 = '다른 인물',
}

export const FACE_CONSISTENCY_OPTIONS: Record<string, FaceConsistency> = {
    '동일 인물': FaceConsistency.동일인물,
    '다른 인물': FaceConsistency.다른인물,
    '원본 인물': FaceConsistency.원본유지,
};