
import { GoogleGenAI, Part } from "@google/genai";
import { getApiKey } from "./geminiService";
import { AccessoryOptions, AccessoryOption, ModelStyle, Background, Pose, ClothingFocus, ShotFocus, FaceConsistency, AccessoryType } from "../../types/outfit";

const generateConsistentFaceDescriptionLocal = (modelStyle: ModelStyle): string => {
    const eyeShapes = ['크고 동그란 눈', '아몬드 모양의 눈', '가늘고 긴 눈'];
    const eyeFeatures = ['짙은 쌍꺼풀', '속쌍꺼풀', '무쌍꺼풀'];
    const noseShapes = ['오똑하고 날렵한 코', '둥글고 귀여운 코', '직선으로 뻗은 코'];
    const lipShapes = ['도톰한 입술', '얇고 선이 분명한 입술', '입꼬리가 올라간 입술'];
    const faceShapes = ['계란형 얼굴', '갸름한 V라인 얼굴', '동그란 동안 얼굴'];
    const hairStyles = ['긴 생머리', '굵은 웨이브가 있는 긴 머리', '어깨에 닿는 중단발', '깔끔한 단발머리'];
    const hairColors = ['칠흑 같은 검은색', '자연스러운 다크 브라운', '부드러운 밀크 브라운'];

    const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    const commonFeatures = [
        `피부는 결점 없이 매우 깨끗하고 관리가 잘 된 편입니다.`,
        `얼굴형은 ${getRandomItem(faceShapes)}이며,`,
        `눈은 ${getRandomItem(eyeFeatures)}이 있는 ${getRandomItem(eyeShapes)} 모양입니다.`,
        `코는 ${getRandomItem(noseShapes)}이고, 입술은 ${getRandomItem(lipShapes)}입니다.`,
        `헤어스타일은 ${getRandomItem(hairColors)} 색상의 ${getRandomItem(hairStyles)}입니다.`
    ].join(' ');
    
    let stylePrefix: string;
    let agePrefix: string = "20대 초반의";

    switch (modelStyle) {
        case ModelStyle.한국남성아이돌:
            stylePrefix = '전형적인 K-POP 남자 아이돌의 비주얼을 가진 인물입니다.';
            break;
        case ModelStyle.한국발레리나:
            stylePrefix = '우아하고 기품 있는 20대 한국 여성 발레리나의 비주얼을 가진 인물입니다.';
            break;
        case ModelStyle.한국요가강사:
            stylePrefix = '건강하고 유연한 20대 한국 여성 요가 강사의 비주얼을 가진 인물입니다.';
            break;
        case ModelStyle.미시스타일:
            stylePrefix = '품격 있고 세련된 40~50대 한국 여성(미시 스타일)의 비주얼을 가진 인물입니다.';
            agePrefix = "품격 있는 40대 중반의";
            break;
        case ModelStyle.서양패션모델:
            stylePrefix = '이목구비가 매우 뚜렷하고 카리스마 넘치는 서양 전문 패션 모델의 비주얼을 가진 인물입니다.';
            break;
        case ModelStyle.한국여성아이돌:
        default:
            stylePrefix = '전형적인 K-POP 여자 아이돌의 비주얼을 가진 인물입니다.';
            break;
    }

    return `${stylePrefix} ${agePrefix} 인물로, ${commonFeatures}`;
};

export { generateConsistentFaceDescriptionLocal as generateConsistentFaceDescription };

function fileToGenerativePart(file: File): Promise<Part> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject('File could not be read as a data URL');
      }
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function dataUrlToGenerativePart(dataUrl: string): Part {
    const [header, base64Data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
}

const getAccessoryPrompt = (options: AccessoryOptions): string => {
  let prompt = '';
  for (const [key, value] of Object.entries(options)) {
    const accessory = key as AccessoryType;
    if (value === AccessoryOption.제거) {
      prompt += `- ${accessory}: 착용하고 있다면 반드시 제거해주세요.\n`;
    } else if (value === AccessoryOption.생성) {
      prompt += `- ${accessory}: 착용하고 있다면 새로운 스타일의 ${accessory}으로 변경해주세요. 없다면 새로운 ${accessory}을 추가해주세요.\n`;
    } else if (value === AccessoryOption.유지) {
      prompt += `- ${accessory}: 착용하고 있다면 그대로 유지해주세요.\n`;
    }
  }
  return prompt;
};

const getClothingFocusPrompt = (focus: ClothingFocus, shotFocus: ShotFocus): string => {
    const detailInstruction = `**[디테일 유지 필수 - 가상 피팅(Virtual Try-on)]**
    유지해야 할 의상은 AI가 새로 상상해서 그리는 것이 아니라, 원본 이미지의 해당 영역을 **새로운 모델의 몸 위에 그대로 오려 붙인 것처럼** 완벽하게 동일해야 합니다.
    - **절대 변경 금지:** 재질(Texture), 색상(Color), 주름(Wrinkles), 로고(Logo), 패턴(Pattern), 핏(Fit).
    - **마감 처리:** 넥라인, 밑단, 소매 끝(Cuff)의 봉제 형태를 원본과 100% 똑같이 유지하세요.
    - **착용 방식 고정:** 상의를 바지 안에 넣었는지(Tucked) 밖으로 뺐는지(Untucked) 등 원본의 스타일링을 100% 따르세요.`;
    
    const handInstruction = `
    **[CRITICAL: 손과 소매의 물리적 무결성]**
    - 손가락이 옷감을 뚫고 나오는 오류를 절대 범하지 마세요. 모든 손가락은 소매 끝 개구부를 통해서만 노출되어야 합니다.`;

    switch (focus) {
        case ClothingFocus.원본유지:
            return `
            **[작업 목표: 가상 피팅 - 모든 의상을 새로운 모델에 입히기]**
            1. **유지:** 원본 이미지의 모든 의상(상의, 하의, 아우터 등)을 ${detailInstruction}
            2. **모델 적용:** 새로운 모델의 체형에 맞춰 의상이 자연스럽게 늘어나거나 접히도록 하되, 의상 자체의 디자인은 100% 보존하세요.
            ${handInstruction}`;

        case ClothingFocus.티셔츠: 
            return `
            **[작업 목표: 상의만 유지, 나머지는 어울리게 교체]**
            1. **유지:** 상의는 ${detailInstruction}
            2. **변경:** 하의와 신발은 상의와 어울리는 세련된 디자인으로 새로 생성하세요.
            ${handInstruction}`;

        case ClothingFocus.아우터: 
            return `
            **[작업 목표: 아우터만 유지, 이너와 하의 교체]**
            1. **유지:** 아우터는 ${detailInstruction}
            2. **변경:** 아우터 안의 옷과 하의는 새로 생성하세요.`;

        case ClothingFocus.하의: 
            return `
            **[작업 목표: 하의만 유지, 상의 교체]**
            1. **유지:** 하의는 ${detailInstruction}
            2. **변경:** 상의와 아우터는 새로 생성하세요.`;

        case ClothingFocus.원피스:
            return `**[작업 목표: 원피스 전체 유지]** 원피스를 ${detailInstruction} 하여 새로운 모델에게 입히세요.`;

        case ClothingFocus.아우터하의: 
            return `**[작업 목표: 아우터와 하의 세트 유지]** 아우터와 하의를 ${detailInstruction} 하여 새로운 모델에게 입히세요.`;

        case ClothingFocus.티셔츠하의: 
            return `**[작업 목표: 상의와 하의 세트 유지]** 상의와 하의를 ${detailInstruction} 하여 새로운 모델에게 입히세요.`;

        case ClothingFocus.전체:
        default:
            return `**[작업 목표: 전체 의상 새로 생성]** 원본 의상을 무시하고 새로운 모델과 배경에 어울리는 최신 트렌드 의상을 입히세요.`;
    }
};


const getShotFocusPrompt = (focus: ShotFocus): string => {
    switch(focus) {
        case ShotFocus.원본유지:
            return '원본 이미지의 촬영 구도와 카메라 앵글을 동일하게 유지하세요.';
        case ShotFocus.상반신:
            return `**[상반신 촬영]** 모델의 허벅지 중간에서 프레임을 잘라 신발이 보이지 않게 하세요.`;
        case ShotFocus.전신:
        default:
            return `**[전신 촬영]** 머리 끝부터 발 끝까지 모델 전체가 다 보이도록 카메라 거리를 조절하세요.`;
    }
};

const getModelStylePrompt = (
    modelStyle: ModelStyle,
    faceConsistency: FaceConsistency,
    faceDescription: string | null,
    shotFocus: ShotFocus
): string => {
    const isFaceVisible = shotFocus !== ShotFocus.하반신 && shotFocus !== ShotFocus.신발 && shotFocus !== ShotFocus.뒷모습;

    if (!isFaceVisible) {
        let bodyPrompt = '모델의 체형을 새로운 스타일에 맞춰 생성하세요.';
        if (modelStyle === ModelStyle.서양패션모델) bodyPrompt = '키가 크고 비율이 압도적인 서양 전문 패션 모델의 체형입니다.';
        return `${bodyPrompt} 얼굴은 보이지 않으므로 고려하지 마세요.`;
    }

    if (modelStyle === ModelStyle.원본유지) {
        return '모델은 원본 이미지의 인물과 100% 동일하게 유지하세요.';
    }
    
    let newModelBasePrompt: string;
    switch (modelStyle) {
        case ModelStyle.한국남성아이돌: newModelBasePrompt = 'K-POP 남자 아이돌 비주얼의 새로운 모델을 생성하세요.'; break;
        case ModelStyle.미시스타일: newModelBasePrompt = '우아하고 세련된 40~50대 한국 여성 비주얼의 새로운 모델을 생성하세요.'; break;
        case ModelStyle.서양패션모델: newModelBasePrompt = '카리스마 넘치는 서양 전문 패션 모델 비주얼의 새로운 모델을 생성하세요.'; break;
        default: newModelBasePrompt = 'K-POP 여자 아이돌 비주얼의 새로운 모델을 생성하세요.'; break;
    }

    let facePrompt: string;
    if (faceConsistency === FaceConsistency.원본유지) {
        facePrompt = '모델의 얼굴은 원본 이미지와 100% 동일해야 합니다.';
    } else if (faceConsistency === FaceConsistency.동일인물 && faceDescription) {
        facePrompt = `**[중요] 원본 얼굴을 무시하고 다음 특징을 가진 일관된 얼굴로 생성하세요:** ${faceDescription}`;
    } else { 
        facePrompt = '모델의 얼굴은 스타일과 어울리게 매력적으로 새로 생성하세요.';
    }

    return `${newModelBasePrompt} ${facePrompt}`;
};

const getBackgroundPrompt = (background: Background): string => {
    if (background === Background.원본유지) return '배경은 원본과 동일하게 유지하세요.';
    return `배경은 '${background}' 스타일로 새로 생성하세요.`;
};

const getPosePrompt = (pose: Pose): string => {
    if (pose === Pose.원본유지) return '포즈는 원본과 동일하게 유지하세요.';
    return `포즈는 '${pose}'로 자연스럽게 생성하세요.`;
};

async function callGeminiApi(prompt: string, imagePart: Part, referenceImagePart?: Part): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const parts: Part[] = [imagePart];
  if (referenceImagePart) parts.push(referenceImagePart);
  parts.push({ text: prompt });

  /* Generate image content using gemini-2.5-flash-image with imageConfig */
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: { parts: parts },
    config: { imageConfig: { aspectRatio: '1:1' } },
  });

  /* Extract base64 image data from the response parts */
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return part.inlineData.data;
  }
  throw new Error("이미지 생성 실패");
}


export const generateStyledImage = async (
  file: File,
  modelStyle: ModelStyle,
  background: Background,
  pose: Pose,
  accessoryOptions: AccessoryOptions,
  clothingFocus: ClothingFocus,
  shotFocus: ShotFocus,
  faceConsistency: FaceConsistency,
  faceDescription: string | null,
  customPrompt: string | null,
  referenceImageBase64: string | null
): Promise<string> => {
    const imagePart = await fileToGenerativePart(file);
    let referenceImagePart: Part | undefined;
    if (referenceImageBase64) referenceImagePart = dataUrlToGenerativePart(referenceImageBase64);

    const mainPrompt = `
# AI 패션 스타일리스트 설계도

**[목표]**
사용자가 업로드한 원본 이미지 속 **의상**을 추출하여, 아래의 **새로운 인물(모델)**과 **배경**, **포즈**가 조합된 고해상도 패션 화보 이미지를 창조합니다. 
원본 이미지의 인물을 지우고 그 옷을 AI 모델에게 완벽하게 입히는 '가상 피팅' 작업입니다.

**# 생성 규칙**
1. 촬영 구도: ${getShotFocusPrompt(shotFocus)}
2. 의상 적용: ${getClothingFocusPrompt(clothingFocus, shotFocus)}
3. 모델 스타일: ${getModelStylePrompt(modelStyle, faceConsistency, faceDescription, shotFocus)}
4. 배경: ${getBackgroundPrompt(background)}
5. 포즈: ${getPosePrompt(pose)}
6. 액세서리: ${getAccessoryPrompt(accessoryOptions)}

${customPrompt ? `\n[추가 요청]: ${customPrompt}` : ''}

**[품질 지침]**
- 의상의 재질, 주름, 로고를 극도로 사실적으로 보존하세요.
- 최종 결과물은 잡지 화보 수준의 전문적인 퀄리티여야 합니다.
`;

    return await callGeminiApi(mainPrompt, imagePart, referenceImagePart);
};


export const regeneratePose = async (
    sourceImageUrl: string,
    modelStyle: ModelStyle,
    background: Background,
    shotFocus: ShotFocus,
    faceDescription: string | null,
    customPrompt: string | null,
    newPose: Pose = Pose.다른자세
): Promise<string> => {
    const imagePart = dataUrlToGenerativePart(sourceImageUrl);
    const prompt = `현재 이미지의 인물과 의상, 배경을 100% 유지하며 포즈만 '${getPosePrompt(newPose)}'로 변경하세요. ${customPrompt ? `\n[요청]: ${customPrompt}` : ''}`;
    return await callGeminiApi(prompt, imagePart);
};

export const changePoseFromSourceImage = async (
    sourceFile: File,
    shotFocus: ShotFocus,
    targetBackground: Background = Background.원본유지
): Promise<string> => {
    const imagePart = await fileToGenerativePart(sourceFile);
    const prompt = `원본 이미지의 인물과 의상을 100% 유지하며 포즈와 배경(${targetBackground})을 변경하세요.`;
    return await callGeminiApi(prompt, imagePart);
};

export const generateSimilarStyle = async (
    sourceImageUrl: string,
): Promise<string> => {
    const imagePart = dataUrlToGenerativePart(sourceImageUrl);
    const prompt = `이 이미지와 유사한 컨셉과 분위기를 가진 새로운 패션 컷을 생성하세요.`;
    return await callGeminiApi(prompt, imagePart);
};
