# ╔══════════════════════════════════════════════════════╗
# ║      [쿠썸] 상세페이지 제작기 - Streamlit             ║
# ╚══════════════════════════════════════════════════════╝
import io, base64, json
import streamlit as st
import google.generativeai as genai
from PIL import Image

# ══════════════════════════════════════════════════════
# 페이지 설정
# ══════════════════════════════════════════════════════
st.set_page_config(
    page_title='상세페이지 제작기',
    page_icon='✨',
    layout='centered'
)

# ══════════════════════════════════════════════════════
# 사이드바 - API 키 (전 탭 공유)
# ══════════════════════════════════════════════════════
with st.sidebar:
    st.title('⚙️ 설정')
    st.divider()
    api_key = st.text_input(
        '🔑 Gemini API 키',
        type='password',
        placeholder='AIza...',
        help='Google AI Studio에서 발급받은 API 키를 입력하세요'
    )
    if api_key:
        genai.configure(api_key=api_key)
        st.success('✅ API 키 연결됨')
    else:
        st.warning('⚠️ API 키를 입력해주세요')

    st.divider()
    st.caption('📌 Google AI Studio\nhttps://aistudio.google.com')
    st.caption('무료 API 키 발급 가능')

# ══════════════════════════════════════════════════════
# 카테고리 설정
# ══════════════════════════════════════════════════════
CATEGORIES = {
    '👗 의류/패션': {
        'key': 'FASHION',
        'instruction': """
타겟: 트렌디한 패션 쇼핑객
톤: 감성적, 부드럽고 친근한
포커스: 핏, 원단 질감, 무드, 데일리 코디
키워드: 데일리룩, 소장가치, 핏보장, 감성무드, 세련된, 모던시크
금지: 촌스러운 표현, 과한 이모티콘
""",
        'icon': '👗'
    },
    '🏠 리빙/인테리어': {
        'key': 'LIVING',
        'instruction': """
타겟: 주부, 1인 가구
톤: 신뢰감, 실용적, 따뜻한
포커스: 인테리어 조화, 내구성, 수납, 편리함
키워드: 감성인테리어, 공간활용, 튼튼한, 삶의질상승
""",
        'icon': '🏠'
    },
    '🍳 주방/식기': {
        'key': 'KITCHEN',
        'instruction': """
타겟: 요리하는 주부, 부모님
톤: 전문적, 안전한, 깔끔한
포커스: 위생(소재), 안전성, 요리결과, 간편세척
키워드: 안심소재, 간편세척, 요리똥손탈출, 위생적인
""",
        'icon': '🍳'
    },
    '🍱 식품/건강': {
        'key': 'FOOD',
        'instruction': """
타겟: 식욕자극, 푸디
톤: 식욕자극, 활기찬, 신선한
포커스: 맛 묘사, 신선도, 식감, 재료, HACCP
키워드: 겉바속촉, 단짠단짠, 신선함, 입맛돋는, 중독성
""",
        'icon': '🍱'
    },
}

# ══════════════════════════════════════════════════════
# 유틸 함수
# ══════════════════════════════════════════════════════
def img_to_base64(img: Image.Image, fmt='JPEG') -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode()

def file_to_part(uploaded_file):
    """업로드 파일 → Gemini inline_data part"""
    img = Image.open(uploaded_file)
    if img.mode == 'RGBA':
        img = img.convert('RGB')
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    data = base64.b64encode(buf.getvalue()).decode()
    return {'inline_data': {'mime_type': 'image/jpeg', 'data': data}}, img

def call_gemini_text(prompt, system=None, temperature=0.95):
    model = genai.GenerativeModel(
        'gemini-2.0-flash',
        system_instruction=system
    )
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(temperature=temperature)
    )
    return response.text

def call_gemini_image(parts, prompt_text):
    """이미지 생성/편집 - gemini imagen"""
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    contents = parts + [{'text': prompt_text}]
    response = model.generate_content(
        contents,
        generation_config=genai.types.GenerationConfig(
            response_modalities=['TEXT', 'IMAGE']
        )
    )
    # 이미지 파트 추출
    for part in response.candidates[0].content.parts:
        if hasattr(part, 'inline_data') and part.inline_data:
            img_data = base64.b64decode(part.inline_data.data)
            return Image.open(io.BytesIO(img_data))
    return None

# ══════════════════════════════════════════════════════
# 탭 구성
# ══════════════════════════════════════════════════════
st.title('✨ 상세페이지 제작기')
st.caption('Gemini AI로 쿠팡 상세페이지 카피 & 이미지를 자동 제작합니다')

tab1, tab2, tab3, tab4 = st.tabs([
    '✍️ 카피라이팅',
    '🪄 이미지 보정',
    '👗 모델 교체',
    '🖼️ 배경 교체',
])

# ══════════════════════════════════════════════════════
# 탭1: 카피라이팅
# ══════════════════════════════════════════════════════
with tab1:
    st.subheader('✍️ 상세페이지 카피 자동 생성')
    st.caption('상품 정보를 입력하면 카테고리에 맞는 카피를 자동으로 생성합니다')

    # 카테고리 선택
    st.subheader('📦 카테고리 선택')
    cat_cols = st.columns(4)
    cat_labels = list(CATEGORIES.keys())
    selected_cat = st.session_state.get('selected_cat', cat_labels[0])

    for i, (label, _) in enumerate(CATEGORIES.items()):
        with cat_cols[i]:
            if st.button(label, key=f'cat_{i}',
                        type='primary' if selected_cat == label else 'secondary',
                        use_container_width=True):
                st.session_state['selected_cat'] = label
                st.rerun()

    selected_cat = st.session_state.get('selected_cat', cat_labels[0])
    cat_info = CATEGORIES[selected_cat]

    st.divider()

    # 상품 정보 입력
    c1, c2 = st.columns([1, 1])
    with c1:
        product_name = st.text_input(
            '🏷️ 상품명 *',
            placeholder='예: 여름 린넨 오버핏 셔츠',
            key='t1_name'
        )
    with c2:
        benchmark_url = st.text_input(
            '🔗 벤치마킹 URL (선택)',
            placeholder='경쟁사 상품 URL 입력 시 참고합니다',
            key='t1_url'
        )

    features = st.text_area(
        '📝 상품 특징/셀링포인트',
        placeholder='예: 100% 린넨 소재, 루즈핏, 남녀공용, 4컬러, 여름용',
        height=100,
        key='t1_features'
    )

    main_img = st.file_uploader(
        '📸 대표 이미지 (선택 - 이미지 분석 포함)',
        type=['jpg', 'jpeg', 'png', 'webp'],
        key='t1_img'
    )
    if main_img:
        st.image(main_img, width=200, caption='업로드된 대표 이미지')

    st.divider()

    if st.button('🚀 카피 생성 시작', type='primary', key='t1_btn', use_container_width=True):
        if not api_key:
            st.error('⚠️ 사이드바에서 Gemini API 키를 먼저 입력해주세요!')
        elif not product_name:
            st.warning('⚠️ 상품명을 입력해주세요!')
        else:
            with st.spinner('🤖 AI가 카피를 작성 중입니다...'):
                try:
                    system_prompt = f"""
당신은 한국 1위 이커머스 카피라이터입니다. {selected_cat} 카테고리 전문가입니다.

{cat_info['instruction']}

규칙:
1. 반드시 제공된 상품명을 메인 훅에 포함하세요
2. 자연스럽고 감성적인 2-3줄 문장으로 작성하세요
3. 줄바꿈은 \\n으로 표현하세요
4. 쉼표나 마침표 남발 금지

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{{
  "mainHook": "메인 훅 카피 (상품명 포함, \\n 사용)",
  "sellingPoints": [
    {{"icon": "이모지", "title": "특징 제목", "description": "설명 2-3줄 \\n 사용"}},
    {{"icon": "이모지", "title": "특징 제목", "description": "설명 2-3줄 \\n 사용"}},
    {{"icon": "이모지", "title": "특징 제목", "description": "설명 2-3줄 \\n 사용"}}
  ],
  "story": "감성 스토리 2-3줄 \\n 사용",
  "sizeTip": "사이즈/사용 팁",
  "mdComment": "MD 추천 코멘트 \\n 사용",
  "productInfo": {{
    "material": "소재/원재료",
    "origin": "제조국",
    "wash": "세탁/보관 방법"
  }}
}}
"""
                    user_prompt = f"""
상품명: {product_name}
카테고리: {cat_info['key']}
특징: {features or '이미지를 분석하여 특징을 파악해주세요'}
{f'벤치마킹 URL: {benchmark_url}' if benchmark_url else ''}

{"이미지가 제공되었습니다. 이미지를 분석하여 색상, 소재, 디자인 특징을 카피에 반영해주세요." if main_img else ""}
구체적인 사용 시나리오를 상상해서 작성하세요.
진부한 표현(후회없는, 강력추천 등)은 사용하지 마세요.
"""
                    contents = []
                    if main_img:
                        part, _ = file_to_part(main_img)
                        contents.append(part)
                    contents.append({'text': user_prompt})

                    model = genai.GenerativeModel(
                        'gemini-2.0-flash',
                        system_instruction=system_prompt
                    )
                    response = model.generate_content(contents)
                    raw = response.text.strip()

                    # JSON 파싱
                    if raw.startswith('```'):
                        raw = raw.split('```')[1]
                        if raw.startswith('json'):
                            raw = raw[4:]
                    raw = raw.strip()
                    result = json.loads(raw)
                    st.session_state['copy_result'] = result
                    st.session_state['copy_product'] = product_name

                except json.JSONDecodeError as e:
                    st.error(f'JSON 파싱 오류: {e}\n\n원본 응답:\n{raw}')
                except Exception as e:
                    st.error(f'오류 발생: {e}')

    # 결과 출력
    if 'copy_result' in st.session_state:
        r = st.session_state['copy_result']
        pname = st.session_state.get('copy_product', '')

        st.divider()
        st.success(f'✅ **{pname}** 카피 생성 완료!')

        # 메인 훅
        st.markdown('### 🎯 메인 훅')
        hook_text = r.get('mainHook', '').replace('\\n', '\n')
        st.info(hook_text)
        if st.button('🔄 메인 훅 재생성', key='regen_hook'):
            with st.spinner('재생성 중...'):
                try:
                    new_text = call_gemini_text(
                        f"다음 이커머스 카피를 더 매력적으로 다시 작성해주세요. \\n으로 줄바꿈하고 감성적으로:\n\n{hook_text}",
                        temperature=0.9
                    )
                    st.session_state['copy_result']['mainHook'] = new_text
                    st.rerun()
                except Exception as e:
                    st.error(str(e))

        # 셀링포인트
        st.markdown('### ✨ 셀링포인트')
        sp_cols = st.columns(3)
        for i, sp in enumerate(r.get('sellingPoints', [])):
            with sp_cols[i % 3]:
                st.markdown(f"**{sp.get('icon','')} {sp.get('title','')}**")
                st.caption(sp.get('description','').replace('\\n', '\n'))

        # 스토리
        st.markdown('### 💬 감성 스토리')
        st.write(r.get('story','').replace('\\n', '\n'))

        # 사이즈 팁 + MD 코멘트
        c1, c2 = st.columns(2)
        with c1:
            st.markdown('### 📏 사이즈/사용 팁')
            st.write(r.get('sizeTip',''))
        with c2:
            st.markdown('### 💝 MD 코멘트')
            st.write(r.get('mdComment','').replace('\\n', '\n'))

        # 상품 정보
        st.markdown('### 📋 상품 정보')
        info = r.get('productInfo', {})
        i1, i2, i3 = st.columns(3)
        with i1:
            st.metric('소재/원재료', info.get('material','-'))
        with i2:
            st.metric('제조국', info.get('origin','-'))
        with i3:
            st.metric('세탁/보관', info.get('wash','-'))

        # 전체 복사용 텍스트
        st.divider()
        st.markdown('### 📋 전체 카피 텍스트 (복사용)')
        full_copy = f"""[메인 훅]
{r.get('mainHook','').replace(chr(92)+'n', chr(10))}

[셀링포인트]
"""
        for sp in r.get('sellingPoints', []):
            full_copy += f"{sp.get('icon','')} {sp.get('title','')}\n{sp.get('description','').replace(chr(92)+'n', chr(10))}\n\n"
        full_copy += f"""[감성 스토리]
{r.get('story','').replace(chr(92)+'n', chr(10))}

[사이즈/사용 팁]
{r.get('sizeTip','')}

[MD 코멘트]
{r.get('mdComment','').replace(chr(92)+'n', chr(10))}

[상품 정보]
소재: {info.get('material','')}
제조국: {info.get('origin','')}
세탁/보관: {info.get('wash','')}
"""
        st.text_area('', value=full_copy, height=300, key='full_copy_area')
        st.download_button(
            '⬇️ 카피 텍스트 다운로드',
            data=full_copy.encode('utf-8'),
            file_name=f'{pname}_카피.txt',
            mime='text/plain'
        )

# ══════════════════════════════════════════════════════
# 탭2: 이미지 자동 보정 (Magic Fix)
# ══════════════════════════════════════════════════════
with tab2:
    st.subheader('🪄 이미지 자동 보정')
    st.caption('워터마크 제거 · 배경 보정 · 이미지 품질 향상')

    st.info('📌 1688이나 타오바오 이미지의 중국어 워터마크를 제거하고 배경을 깔끔하게 보정합니다')

    t2_imgs = st.file_uploader(
        '📸 이미지 업로드 (여러 장 가능)',
        type=['jpg', 'jpeg', 'png', 'webp'],
        accept_multiple_files=True,
        key='t2_imgs'
    )

    if t2_imgs:
        st.write(f'**{len(t2_imgs)}개** 이미지 업로드됨')
        preview_cols = st.columns(min(len(t2_imgs), 4))
        for i, f in enumerate(t2_imgs[:4]):
            with preview_cols[i]:
                st.image(f, caption=f.name[:15], use_container_width=True)

    t2_extra = st.text_input(
        '추가 지시사항 (선택)',
        placeholder='예: 배경을 흰색으로 변경해주세요',
        key='t2_extra'
    )

    if st.button('🪄 자동 보정 시작', type='primary', key='t2_btn', use_container_width=True):
        if not api_key:
            st.error('⚠️ API 키를 입력해주세요!')
        elif not t2_imgs:
            st.warning('⚠️ 이미지를 업로드해주세요!')
        else:
            results = []
            progress = st.progress(0)
            for i, f in enumerate(t2_imgs):
                with st.spinner(f'🔄 {f.name} 보정 중... ({i+1}/{len(t2_imgs)})'):
                    try:
                        part, orig_img = file_to_part(f)
                        prompt = f"""이 이커머스 상품 이미지를 한국 마켓 판매용으로 변환해주세요:
1. 모든 중국어 텍스트/워터마크 완전 제거
2. 제거된 영역을 자연스럽게 복원
3. 이미지 전체 품질 향상
4. 배경 깔끔하게 정리
{f'5. {t2_extra}' if t2_extra else ''}
상품 자체는 절대 변경하지 마세요."""
                        result_img = call_gemini_image([part], prompt)
                        results.append({'name': f.name, 'orig': orig_img, 'result': result_img})
                    except Exception as e:
                        st.error(f'{f.name} 실패: {e}')
                        results.append({'name': f.name, 'orig': orig_img if 'orig_img' in locals() else None, 'result': None})
                progress.progress((i+1) / len(t2_imgs))

            st.session_state['t2_results'] = results
            st.success(f'✅ {len([r for r in results if r["result"]])}개 보정 완료!')

    if 't2_results' in st.session_state:
        st.divider()
        st.subheader('📊 보정 결과')
        for r in st.session_state['t2_results']:
            st.markdown(f'**{r["name"]}**')
            c1, c2 = st.columns(2)
            with c1:
                st.caption('원본')
                if r['orig']:
                    st.image(r['orig'], use_container_width=True)
            with c2:
                st.caption('보정 후')
                if r['result']:
                    st.image(r['result'], use_container_width=True)
                    buf = io.BytesIO()
                    r['result'].save(buf, format='PNG')
                    st.download_button(
                        '⬇️ 다운로드',
                        data=buf.getvalue(),
                        file_name=f"보정_{r['name'].split('.')[0]}.png",
                        mime='image/png',
                        key=f"dl_t2_{r['name']}"
                    )
                else:
                    st.error('보정 실패')
            st.divider()

# ══════════════════════════════════════════════════════
# 탭3: 모델 교체
# ══════════════════════════════════════════════════════
with tab3:
    st.subheader('👗 모델 교체')
    st.caption('중국 모델 → 한국 모델로 자동 교체 (의류 그대로 유지)')

    st.warning('⚠️ 의류/패션 상품 전용 기능입니다. 상품(옷)은 그대로 유지되고 모델만 교체됩니다.')

    t3_img = st.file_uploader(
        '👗 의류 착용 이미지 업로드',
        type=['jpg', 'jpeg', 'png', 'webp'],
        key='t3_img'
    )

    if t3_img:
        st.image(t3_img, width=300, caption='원본 이미지')

    t3_style = st.selectbox(
        '모델 스타일',
        ['트렌디한 한국 20대 여성 모델', '세련된 한국 30대 여성 모델',
         '캐주얼한 한국 20대 남성 모델', '깔끔한 한국 30대 남성 모델'],
        key='t3_style'
    )

    if st.button('👗 모델 교체 시작', type='primary', key='t3_btn', use_container_width=True):
        if not api_key:
            st.error('⚠️ API 키를 입력해주세요!')
        elif not t3_img:
            st.warning('⚠️ 이미지를 업로드해주세요!')
        else:
            with st.spinner('🤖 AI가 모델을 교체하고 있습니다...'):
                try:
                    part, orig_img = file_to_part(t3_img)
                    prompt = f"""이 의류 이미지의 모델을 교체해주세요:
- 교체할 모델: {t3_style}
- 의류(옷)는 동일하게 유지 (색상, 디자인, 스타일 그대로)
- 자연스러운 착용 포즈
- 배경은 깔끔하게 유지
- 쿠팡 상세페이지용 고품질 이미지"""
                    result_img = call_gemini_image([part], prompt)
                    st.session_state['t3_result'] = (orig_img, result_img)
                    st.success('✅ 모델 교체 완료!')
                except Exception as e:
                    st.error(f'오류 발생: {e}')

    if 't3_result' in st.session_state:
        orig, result = st.session_state['t3_result']
        st.divider()
        c1, c2 = st.columns(2)
        with c1:
            st.caption('원본')
            st.image(orig, use_container_width=True)
        with c2:
            st.caption('모델 교체 후')
            if result:
                st.image(result, use_container_width=True)
                buf = io.BytesIO()
                result.save(buf, format='PNG')
                st.download_button('⬇️ 다운로드', buf.getvalue(),
                                   '모델교체_결과.png', 'image/png')
            else:
                st.error('이미지 생성 실패')

# ══════════════════════════════════════════════════════
# 탭4: 배경 교체
# ══════════════════════════════════════════════════════
with tab4:
    st.subheader('🖼️ 배경 교체')
    st.caption('지저분한 배경 → 깔끔한 스튜디오 배경으로 자동 교체')

    t4_img = st.file_uploader(
        '📸 상품/착용 이미지 업로드',
        type=['jpg', 'jpeg', 'png', 'webp'],
        key='t4_img'
    )

    if t4_img:
        st.image(t4_img, width=300, caption='원본 이미지')

    t4_bg = st.selectbox(
        '배경 스타일 선택',
        [
            '깨끗한 흰색 스튜디오 배경',
            '밝은 그레이 미니멀 스튜디오',
            '감성적인 베이지/크림 톤 배경',
            '모던한 다크 그레이 배경',
            '자연스러운 아웃도어/카페 배경',
        ],
        key='t4_bg'
    )

    t4_extra = st.text_input(
        '추가 요청사항 (선택)',
        placeholder='예: 소프트 조명 효과 추가',
        key='t4_extra'
    )

    if st.button('🖼️ 배경 교체 시작', type='primary', key='t4_btn', use_container_width=True):
        if not api_key:
            st.error('⚠️ API 키를 입력해주세요!')
        elif not t4_img:
            st.warning('⚠️ 이미지를 업로드해주세요!')
        else:
            with st.spinner('🤖 AI가 배경을 교체하고 있습니다...'):
                try:
                    part, orig_img = file_to_part(t4_img)
                    prompt = f"""이 이미지의 배경을 교체해주세요:
- 새 배경: {t4_bg}
- 상품/피사체는 완전히 동일하게 유지
- 자연스러운 그림자/반사 효과
- 쿠팡 상세페이지용 고품질
{f'- {t4_extra}' if t4_extra else ''}"""
                    result_img = call_gemini_image([part], prompt)
                    st.session_state['t4_result'] = (orig_img, result_img)
                    st.success('✅ 배경 교체 완료!')
                except Exception as e:
                    st.error(f'오류 발생: {e}')

    if 't4_result' in st.session_state:
        orig, result = st.session_state['t4_result']
        st.divider()
        c1, c2 = st.columns(2)
        with c1:
            st.caption('원본')
            st.image(orig, use_container_width=True)
        with c2:
            st.caption('배경 교체 후')
            if result:
                st.image(result, use_container_width=True)
                buf = io.BytesIO()
                result.save(buf, format='PNG')
                st.download_button('⬇️ 다운로드', buf.getvalue(),
                                   '배경교체_결과.png', 'image/png')
            else:
                st.error('이미지 생성 실패')
