# Film Camela — Localization Style Guide & Glossary

> Version 1.0 · 2026-11-02 · Covers 10 locales: **ko** (source) · **en-US** · **ja** · **zh-CN** · **es** (neutral / LatAm-friendly) · **fr** · **pt-BR** · **ru** · **hi** · **ar** (MSA)
> Based on: `src/i18n.ts` (all ko/en keys, film and camera descriptions, era words), `src/cameras/models.ts`, `src/film/stocks.ts`, `src/components/arrival.ts`, `docs/03b_STORE_LISTING_FILM_CAMELA.md`.
> This guide does not change app code. The engineering needs it describes (plural syntax, number/date formatting, RTL) are listed in sections 4, 5 and 9 for the engineer to implement.

**사장님용 요약 (한국어)**
- 말투 기준: Apple 제품 페이지·iOS 문구처럼 짧고 따뜻하고 확신 있게. 느낌표·과장 금지. 버튼·라벨은 기능 그대로, 온보딩·빈 화면·필름 설명만 감성적으로.
- 언어별 존댓말: ja です・ます / zh 你 / es tú / fr vous / pt você / ru вы(소문자) / hi आप / ar 남녀 구분 없는 표현 우선.
- 용어집 약 80개, 카메라 종류 단어 22개 표, 언어별 예문 8줄씩 들어 있어요. "Film Camela"와 카메라·필름 이름은 어떤 언어에서도 번역하지 않아요.
- 결정이 갈릴 수 있는 용어(스페인어 rollo, 힌디어 डेवलप, 아랍어 숫자 표기 등)는 11장에 이유와 함께 모아 두었어요.

---

## Contents

1. Voice & tone (general)
2. Voice & tone per language (register, punctuation, numbers, dates, capitalization)
3. Camera, film and other names that are never translated (plus era words table)
4. Placeholders
5. Plurals: what each language needs
6. Glossary (about 80 terms × 10 languages)
7. Arabic / RTL notes
8. Length guidance and the tightest strings
9. Locale-specific content (things that must change, not only translate)
10. Example lines per language (Apple-like tone)
11. Debatable term decisions (with reasons)
12. Translator checklist

---

## 1. Voice & tone (general)

**The feeling we want:** like Apple's own product pages and iOS copy in each language. Short, warm, confident, sensory, human. The app is about slowing down: one frame at a time, waiting for the lab, rediscovering a roll. The copy should feel like that too.

### 1.1 Three registers in one app

| Register | Where (key prefixes) | How it sounds |
|---|---|---|
| **Functional** | `tab.*`, `common.*`, camera toolbar chips (`cam.flash`, `cam.timer` …), `dr.*` control labels, `set.*` labels, `view.*` buttons | Crisp. 1–3 words. Nouns or verbs, no adjectives, no emotion. The same word every time for the same thing. |
| **Guiding** | hints, confirms, toasts, a11y (`cam.rewindConfirm`, `set.backup.hint`, `lab.intro`, `a11y.*`, `cam.*Say`) | Plain, kind, specific. Say what happens and what to do. One idea per sentence. |
| **Expressive** | `onb.*`, `speed.why`, `speed.*.d`, `lab.empty*`, `gal.empty*`, `an.log.firstHint`, film descriptions (`stockKo/stockEn`), camera descriptions (`cameraKo/cameraEn`), store listing, `share.title` | May be poetic: sensory nouns (light, grain, warmth, waiting, morning), short fragments, gentle rhythm. Still short. Still true. |

Errors (`err.*`, `cam.err.*`, `set.backup.failed` …) are **guiding**, never expressive: say what happened, then what to do. No "Oops", no jokes, no blame ("You did X wrong").

### 1.2 Rules for every language

1. **Short.** UI label ≤ 3 words. Hint ≤ 1 line on a 360 px phone (≈ 40 Latin chars / 20 CJK chars). Onboarding body ≤ 2 sentences.
2. **Confident, not hypey.** No "amazing", "incredible", "the best", "No.1", "revolutionary". No ranking or performance claims (also a store rule, see `03b` §5).
3. **No exclamation marks** in UI, hints or onboarding. The Korean/English source has a few (`cam.rollFull`, `lab.ready`, `cam.packDone`); translate them **without** "!" unless the target language would sound cold, and never with Spanish "¡…!". (Suggestion for the source: drop them too.)
4. **Human and specific over generic.** "A coffee break" beats "Short wait". Use the real words film photographers use in that language (section 6).
5. **Second person, warm register** (section 2 lists the pronoun per language). Never talk about "the user".
6. **Sensory words in expressive copy only:** light, glow, warmth, morning, grain, waiting, rediscovering. Avoid them in buttons.
7. **Write natively, not literally.** Translate the intent of the ko line (tone source) and check meaning against the en line (meaning source). If ko and en disagree, ko wins on tone, en wins on facts, and flag it.
8. **No other brands.** Never write Kodak, Fujifilm, Polaroid, Instax, Lomo, Huji, Gudak, and avoid brand-derived generic words: ja チェキ, zh 拍立得, ko 폴라로이드, ru Полароид, en "Polaroid". Use "instant camera" equivalents (section 6).
9. **No push-notification promises.** The app has no push notifications (only in-app toasts). Never write "we'll notify you".
10. **Facts are fixed:** 10–99 frames per camera, push/pull ±2 stops, lab speeds Instant / 1 hour / 9 AM / 3 days, photos stay on the device, no account. Do not add features.

---

## 2. Voice & tone per language

The table first, then details. "Apple practice" means what Apple uses in that locale's iOS and product pages.

| Locale | Register / pronoun | Buttons | Instructions | Case | Quotes for UI names |
|---|---|---|---|---|---|
| ko | 해요체 (source). No 합니다체, no 반말 | Noun / 명사형: 필름 넣기, 저장 | ~하세요, ~해 보세요 | n/a | ‘ ’ (as in source: ‘지금 바로 현상’) |
| en-US | you | Sentence case verbs: Send to lab | Imperative: Tap, Choose | Sentence case (see 2.2) | “ ” |
| ja | です・ます. Never だ・である in sentences | 体言止め / noun: 保存, 現像に出す | 〜してください sparingly; 〜しましょう for gentle invitations | n/a | 「 」 (nested 『 』) |
| zh-CN | 你 (Apple CN uses 你). 您 only in legal text | Short verb: 保存, 分享, 送去冲洗 | 请… sparingly, mostly direct | n/a | “ ” (full-width) |
| es | **tú** (Apple uses tú in Spain and Latin America). No vosotros, no usted | Infinitive: Guardar, Compartir | tú imperative: Toca, Elige | Sentence case | “ ” |
| fr | **vous** (Apple FR) | Infinitive: Enregistrer, Partager | vous imperative: Touchez, Choisissez | Sentence case | « » with no-break spaces |
| pt-BR | **você** (Apple BR) | Infinitive: Salvar, Compartilhar | Imperative (você form): Toque, Escolha | Sentence case | “ ” |
| ru | **вы, lowercase** (Apple RU) | Infinitive: Сохранить, Удалить | Imperative: Выберите, Нажмите | Sentence case | « » (nested „ “) |
| hi | **आप**, conversational standard Hindi, Devanagari | -ें form: सेव करें, शेयर करें | -इए / -ें: चुनिए, चुनें | n/a | “ ” |
| ar | MSA, warm. Gender-neutral where possible | Verbal noun (masdar): حفظ، مشاركة، حذف | Masculine singular generic imperative (Apple practice) or neutral "يمكنك…" | n/a | « » |

### 2.1 Korean (ko) — source language

- 해요체 everywhere: "현상이 끝났어요", "보낼까요?". Never 합니다/습니다, never 반말.
- Labels are 명사형: "필름 넣기", "롤 전체에 적용", "다시 현상".
- Particles after placeholders must fit the formatted value: `{left}은` works because the value always ends in 장/컷 (final consonant). If a unit changes, re-check 은/는, 이/가, 을/를, (으)로.
- Numbers attach to units without a space: 36장, 1시간, 3일, 9시. Ellipsis is one character "…". Separator in toasts: " · " (space, middle dot, space).
- Korean is the tone source for every translation. Keep it that way: when the ko line is improved, other languages follow.

### 2.2 English (en-US)

- **Sentence case** for everything (buttons, titles, tabs, chips): "Send to lab", "Choose your film", "Delete all data". Apple's HIG suggests title case for some buttons, but this app already uses sentence case everywhere and Apple's own product pages do too; consistency wins.
- Curly punctuation: ’ “ ” (the source mixes ' and ’; normalize to ’). Ellipsis "…". Em dash without spaces "—" (sparingly).
- Serial (Oxford) comma: Apple uses it ("Instant, 1 hour, 9 AM, or 3 days"). The current source omits it. Recommendation: adopt it going forward; do not mix.
- Time: "9 AM" in prose, "9:00 AM" from `Intl` (`{time}`). Dates: "Nov 4" (short month) from `Intl`.
- Contractions are welcome ("You’ve", "Can’t", "won’t"): they are warm and Apple-like.

### 2.3 Japanese (ja)

- です・ます in all sentences. Titles and labels use 体言止め (noun ending): 「フィルムのように、撮る。」「現像完了」.
- Full-width punctuation: 、。「」『』（）？ ・. Apple JP headlines often end with 「。」; onboarding titles may too.
- **No space** between Japanese and Latin letters/digits ("Pro 35で撮る", "36枚撮り"). Keep the internal space of model names ("Pro 35", never "Pro35").
- Digits are half-width: 1時間, 3日, 朝9時. Counters: 枚 (exposures, photos), 本 (rolls), コマ (frame numbers), 段 (stops).
- Avoid 「！」. Avoid katakana where a natural Japanese photography word exists (現像, 暗室, ネガ, 絞り, 露出); use katakana where photographers do (フィルム, シャッター, フラッシュ, ファインダー).
- Separator " · " from the source: use 「・」 or split into two sentences with 「。」. Do not use a spaced Latin middle dot.
- Time: 24-hour from `Intl` ("9:00") in `{time}`; prose "朝9時".

### 2.4 Simplified Chinese (zh-CN)

- 你, not 您 (Apple CN). 您 only in legal pages. 请 sparingly: "请允许访问相机" is fine in an error; onboarding should not be full of 请.
- Full-width punctuation: ，。：；？！“”（）《》. Ellipsis in prose "……", in loading labels "…" (e.g. 正在载入…).
- **Insert a half-width space between Han characters and Latin letters or digits** (Apple CN style): "用 Film Camela 拍摄", "36 张", "1 小时". No space next to full-width punctuation.
- Short, rhythmic phrases; four-character set phrases are fine in expressive copy but don't stack them (no 成语 chains).
- Counters: 张 (exposures, photos), 卷 (rolls), 档 (stops).
- Time: "上午 9:00" from `Intl`; prose "早上 9 点".

### 2.5 Spanish (es, neutral / LatAm-friendly)

- **tú** everywhere (Apple's choice in both Spain and Latin America). Never vosotros/os. Never usted.
- Buttons in infinitive (Guardar, Compartir, Eliminar, Cancelar); instructions in tú imperative (Toca, Elige, Guarda).
- Neutral vocabulary: avoid Spain-only words (móvil → teléfono, ordenador → dispositivo, carrete → rollo, vale) and LatAm-only slang; never "coger". "Tomar fotos" is understood everywhere.
- Inverted marks always paired: ¿…? ¡…! — but avoid ¡…! in UI.
- Sentence case; months and weekdays lowercase (4 de noviembre).
- Numbers and decimal separators: let `Intl` decide (es-MX uses "1,000.5", es-ES/AR "1.000,5"). Never hard-code separators in strings.
- Time: "9 a. m." in prose (RAE spacing); `{time}` comes from `Intl`. Ordinals "n.º".
- Watch gender agreement around counts ("las 24 fotos restantes") — use plural forms (section 5).

### 2.6 French (fr)

- **vous** (Apple FR). Buttons in infinitive (Enregistrer, Partager, Supprimer, Annuler); instructions imperative (Choisissez, Touchez).
- **Spacing:** narrow no-break space U+202F before `; ! ?` and inside « » ; no-break space U+00A0 before `:`. (Apple uses U+00A0 in many places; either is fine, but it must be non-breaking so the mark never wraps alone onto the next line.) The French examples in section 10 show these as normal spaces for readability; shipped strings must use the non-breaking characters.
- Guillemets « » for UI names: Touchez « Développer maintenant ».
- Apostrophe ’. Ellipsis "…". Numbers "1 000" (U+202F thousands), decimal comma "0,3 Mpx". Units with no-break space: "4 Go", "35 mm" in prose (the border chip `35mm` stays as written, it is a format name).
- Time: "9 h" / "9 h 30" (24-hour).
- Sentence case; no capital after a colon; months lowercase.
- Prefer French photography words: argentique, pellicule, vue, labo, tirage, planche contact, chambre noire. Keep established loans: flash, zoom.
- Avoid adjectives that agree with the reader's gender ("Prêt ?", "Pressé ?"). Rephrase: "Envie de voir tout de suite ?".
- "Appareil" means both camera and device. Use "appareil photo"/"appareil" for the camera; for the device, prefer "téléphone" in friendly copy and "cet appareil" only where the context is clearly the phone (storage, backup).

### 2.7 Brazilian Portuguese (pt-BR)

- **você** (Apple BR). Buttons infinitive (Salvar, Compartilhar, Apagar, Cancelar); instructions imperative in the você form (Toque, Escolha, Salve).
- Brazilian vocabulary only: celular (not telemóvel), tela (not ecrã), arquivo (not ficheiro), salvar (not guardar), usuário. Avoid European Portuguese constructions ("estás a fazer").
- Quotes “ ”. Decimal comma, thousands dot (via `Intl`). Time "9h" / "9h30".
- Sentence case; months lowercase.
- Use the warm Brazilian film vocabulary: filme, revelar / mandar revelar, poses (exposure count), clique (a shot, in expressive copy), cópia, folha de contato.

### 2.8 Russian (ru)

- **вы, always lowercase** (Apple RU). Buttons infinitive (Сохранить, Удалить, Поделиться); instructions imperative (Выберите, Нажмите).
- Use **ё** (плёнка, проявлённые, ещё) — Apple RU writes "Ещё"; plёнка without ё looks careless to film shooters.
- Quotes « » (nested „ “). Dash "—" with spaces. Decimal comma "0,3 Мп". Thousands with no-break space. Time 24-hour "9:00". Units: "3 с", "1 ч", "4 ГБ".
- Sentence case; months lowercase.
- Russian nouns change form after numbers (кадр / кадра / кадров). Use plural forms (section 5) or a colon construction ("Отснято: 12 кадров").
- Handy: "фото" is indeclinable, so "{n} фото" is correct for every count. Use it where it reads naturally.
- Latin names (Film Camela, model names) are indeclinable; put them in apposition: "плёнка Sunny 200", "в приложении Film Camela".

### 2.9 Hindi (hi)

- **आप**, conversational standard Hindi in Devanagari. Write what people say, not textbook Hindi.
- Prefer everyday English loans that Hindi speakers actually use (कैमरा, फ़िल्म, रोल, लैब, सेटिंग्ज़, सेव, शेयर, डिलीट, बैकअप, डिवाइस) over heavy Sanskritized words (छायाचित्र, उपकरण, संग्रहण, विलोपित करें, पूर्ववत करें). Apple's Hindi UI sometimes uses formal verbs; for this app we choose the everyday form.
- Buttons in the -ें form (सेव करें, शेयर करें, रद्द करें); prose may use -इए (चुनिए, खींचिए) for warmth.
- **Nukta** consistently: फ़ (फ़िल्म, फ़्लैश, फ़ोटो, फ़ाइल), ज़ (ज़ूम, इंतज़ार). Use ख़/ग़ only where standard.
- **Purna viram "।" only at the end of full sentences**, never on labels, buttons or chips. "?" and "!" are the Latin glyphs.
- Digits: Western 0–9 (Apple Hindi default). Number grouping (1,00,000) via `Intl`. Time "सुबह 9 बजे" in prose.
- Gender: तस्वीर is feminine; फ़ोटो is commonly feminine too. Keep verbs consistent within a string. Use तस्वीर in prose, फ़ोटो in labels.
- Taking a photo is "फ़ोटो खींचना/लेना" — warm and natural.

### 2.10 Arabic (ar, Modern Standard)

- MSA with a friendly, simple tone. No dialect words, no stiff legal phrasing.
- **Gender:** buttons and labels as verbal nouns (حفظ، مشاركة، حذف، إلغاء، إدخال فيلم). In sentences, prefer neutral constructions ("يمكنك…", passive "تُحفظ صورك…"), and leave verbs unvocalized so they read for both genders ("التقطت", not "التقطتَ"). Where an imperative is unavoidable, the masculine singular generic is accepted (Apple practice).
- Punctuation: Arabic comma "،", semicolon "؛", question mark "؟". Exclamation "!" (rare). Quotes « ». No tatweel (ـ) for stretching.
- Diacritics: none, except where they prevent misreading (فورًا with tanween, shadda in ambiguous words).
- Digits: see 7.2 (decision: Western digits 0–9 throughout).
- "1" and "2" are usually expressed without a numeral: ساعة (1 hour), ساعتان (2 hours), صورة واحدة (one photo). Plural forms in section 5.
- Full RTL notes in section 7.

### 2.11 Language names in the language picker (endonyms)

한국어 · English · 日本語 · 简体中文 · Español · Français · Português (Brasil) · Русский · हिन्दी · العربية. "System" option (`set.lang.auto`) is translated; the language names are not.

### 2.12 Numbers, dates, times, sizes (all locales)

- Never type a formatted date, time, file size or long number into a translation. Those arrive via `{time}`, `{date}`, `{t}`, `{wait}`, `{used}`, `{n}` from `Intl.DateTimeFormat` / `Intl.NumberFormat` (engineering: `arrival.ts` currently maps only ko-KR / en-US; it needs the full locale).
- 12/24-hour follows the locale (en, hi, ar, es-MX: 12h; ja, fr, pt, ru: 24h; zh/ko: 上午/오전 + 12h).
- Fixed technical notations stay as is in every language: aspect ratios **2.39:1, 65:24, 6×6**, "35mm" (format name), "ISO 400", "f/8", "1/125", ".zip", "CSV", "HTTPS". Ordinary decimals follow the locale: 0.3 MP → fr "0,3 Mpx", ru "0,3 Мп", es/pt "0,3 MP" (es-MX may keep "0.3").
- The date stamp burned into photos (camera-style imprint) is not a translation; leave it alone.

---

## 3. Names that are never translated

### 3.1 Never translate, transliterate or inflect

- **Film Camela** — always in Latin letters, both words capitalized, one space, in every language including ja, zh, ru, hi, ar. Never "フィルムカメラ", "胶片相机", "Фильм Камела", "फ़िल्म कमेला", "فيلم كاميلا". It is not a typo for "Camera"; never "correct" it.
- **Camera bodies:** Pro 35 · Snap 27 · Pop SQ · Half 72 · Zone LC · Toy 120 · Quad Action · Double X · Pano X · Fish 180 · Cine Scope · CCD 2003 · Bit Pocket · Range M · Aqua 27 · Pop W · Twin 66 · Reel 8 · Slide 35 · Party Flash · KidCam 0.3 · Sprocket 35
- **Film stocks / sensors:** Sunny 200 · Muse 400 · Mint 400 · Snap 800 · Mono 400 · Pop 600 · Neon 800T · Velvet 50 · Chrome 100 · Silver 100 · Dream 160 · Expired '98 · Cross 200 · Pop Mini · CCD Sensor · Pixel Sensor · Aqua 400 · Pop Wide · Reel 40 · Toy CMOS (yes, "Sensor" and "CMOS" are part of the name; keep them)
- **Other fixed names:** Sunny 16 (exposure rule), PRO badge, ISO, EV, CCD, CMOS, MP (units may localize: fr Mpx, ru Мп), Safari, Chrome, KakaoTalk, Drive, ATIUM GROUP Co., Ltd. (legal name; ko `set.credit` keeps 아티움그룹 주식회사).
- Keep digits, spaces, apostrophes and capitalization exactly ("Expired '98" with straight apostrophe, "Neon 800T", "KidCam 0.3" — the decimal point stays a point even in fr/ru).
- In Russian and Arabic do not decline or attach articles: "плёнка Sunny 200" (not "Sunny 200-ой"), "كاميرا Pro 35" (not "الـPro 35").
- In zh put spaces around the Latin name: "用 Pro 35 拍摄". In ja attach particles directly: "Pro 35で撮る".

### 3.2 What may be translated next to a name

- The **type word** in era lines ("1979 · SLR" → "1979 · 一眼レフ"). The year and the "·" stay. Table below. (Engineering: `cameraEra()` currently translates only for ko; it needs a table per locale.)
- Descriptions (`cameraKo/En`, `stockKo/En`) are translated freely in the expressive register.
- Generic chips: palette names (Moss, Mono, Sepia, Ice, Berry), border chips (None, Instant, Print, Slide, Cine, Sprocket; "35mm" stays), digital-look chips (Cool, Warm, Washed, Night).

### 3.3 Era type words (`ERA_KO` keys)

| EN (key) | KO | JA | ZH | ES | FR | PT | RU | HI | AR |
|---|---|---|---|---|---|---|---|---|---|
| SLR | SLR | 一眼レフ | 单反 | Réflex | Reflex | Reflex | Зеркальная | SLR | SLR |
| Disposable | 일회용 | 使い捨て | 一次性 | Desechable | Jetable | Descartável | Одноразовая | डिस्पोज़ेबल | أحادية الاستخدام |
| Instant | 인스턴트 | インスタント | 即时成像 | Instantánea | Instantané | Instantânea | Моментальная | इंस्टेंट | فورية |
| Half-frame | 하프프레임 | ハーフサイズ | 半格 | Medio cuadro | Demi-format | Meio quadro | Полукадровая | हाफ़-फ़्रेम | نصف إطار |
| Compact | 컴팩트 | コンパクト | 便携机 | Compacta | Compact | Compacta | Компакт | कॉम्पैक्ट | مدمجة |
| 120 toy | 120 토이 | 120トイカメラ | 120 玩具相机 | Juguete 120 | Jouet 120 | Brinquedo 120 | Игрушечная 120 | 120 टॉय | لعبة 120 |
| 4-lens | 4렌즈 | 4レンズ | 四镜头 | 4 lentes | 4 objectifs | 4 lentes | 4 объектива | 4-लेंस | 4 عدسات |
| Multi-ex | 다중노출 | 多重露光 | 多重曝光 | Multiexposición | Multi-expo | Múltipla exposição | Мультиэкспозиция | मल्टी-एक्सपोज़र | تعريض متعدد |
| Panoramic | 파노라마 | パノラマ | 全景 | Panorámica | Panoramique | Panorâmica | Панорамная | पैनोरमिक | بانورامية |
| Fisheye | 어안 | 魚眼 | 鱼眼 | Ojo de pez | Fisheye | Olho de peixe | Фишай | फ़िशआई | عين السمكة |
| Anamorphic | 아나모픽 | アナモルフィック | 变形宽银幕 | Anamórfica | Anamorphique | Anamórfica | Анаморфот | एनामॉर्फ़िक | أنامورفية |
| Digicam | 디카 | デジカメ | 数码卡片机 | Digital | Numérique | Digital | Цифровая | डिजिकैम | رقمية |
| 2-bit | 2비트 | 2ビット | 2-bit | 2 bits | 2 bits | 2 bits | 2 бита | 2-बिट | 2 بت |
| Rangefinder | 레인지파인더 | レンジファインダー | 旁轴 | Telemétrica | Télémétrique | Telemétrica | Дальномерная | रेंजफ़ाइंडर | بمقياس مسافة |
| Waterproof | 방수 | 防水 | 防水 | Acuática | Étanche | À prova d’água | Водонепроницаемая | वॉटरप्रूफ़ | مقاومة للماء |
| Wide | 와이드 | ワイド | 宽幅 | Formato ancho | Format large | Formato largo | Широкий формат | वाइड | عريضة |
| TLR | 이안 리플렉스 | 二眼レフ | 双反 | Réflex de doble lente | Bi-objectif | Reflex de duas lentes | Двухобъективная | TLR | TLR |
| Home movie | 홈무비 | ホームムービー | 家庭电影 | Cine casero | Cinéma amateur | Filme caseiro | Домашнее кино | होम मूवी | أفلام منزلية |
| Slide | 슬라이드 | リバーサル | 反转片 | Diapositiva | Diapo | Slide | Слайд | स्लाइड | شرائح |
| Big flash | 빅 플래시 | ビッグフラッシュ | 大闪光 | Flash potente | Flash puissant | Flash potente | Мощная вспышка | बिग फ़्लैश | فلاش قوي |
| Kids digicam | 어린이 디카 | キッズデジカメ | 儿童数码相机 | Digital infantil | Numérique enfant | Digital infantil | Детская цифровая | बच्चों का डिजिकैम | رقمية للأطفال |
| Sprocket | 스프로킷 | スプロケット | 齿孔 | Perforaciones | Perforations | Perfurações | Перфорация | स्प्रॉकेट | ثقوب الفيلم |

---

## 4. Placeholders

### 4.1 Rules for translators

- Copy every `{placeholder}` **exactly**: same name, same braces, same case. Never translate the name (`{stock}` is never `{película}`), never add spaces inside braces, never drop one.
- You may **move** a placeholder anywhere the grammar needs. You may not duplicate it.
- Do not add quotes around placeholders unless the source has them.
- In zh, add a half-width space between Han text and a placeholder that renders Latin text or digits ("已拍 {shots}"), but not before full-width punctuation.
- In ja, no space ("{shots}撮りました").
- Bidi control characters for Arabic are inserted by code, not by translators (section 7).

### 4.2 What each placeholder contains

| Placeholder | Contains | Example value (en) | Translator note |
|---|---|---|---|
| `{n}`, `{m}`, `{f}`, `{total}`, `{done}`, `{rolls}`, `{photos}` | A bare integer | 12 | Drives plural choice (section 5). |
| `{v}` | A signed number of stops | +1, −0.5 | Can be a fraction: ru/ar need the fractional form. |
| `{shots}`, `{left}` | **A ready-made count phrase** (from `cam.nShots` / `cam.nHalfShots`) | "12 shots", "6 halves" | Already includes the noun. Do not add "photos" after it. Grammar around it (verb/adjective agreement) still depends on the count; see 5.3. |
| `{stock}` | Film name (Latin) | Sunny 200 | Never translated or declined. |
| `{name}` | Camera name (Latin) | Pro 35 | Never translated or declined. |
| `{time}` | Clock time from `Intl` | 9:00 AM | Do not add "AM/PM" or "時" yourself. |
| `{date}` | Short date from `Intl` | Nov 4 | Do not add month words. |
| `{t}`, `{wait}` | A duration phrase | 2 hr 15 min | Already localized. |
| `{used}` | A file size | 1.2 GB | Already localized. |

---

## 5. Plurals: what each language needs

The current inline syntax (`{n:photo|photos}`) only handles English one/other. The engineer is replacing it with an `Intl.PluralRules`-based syntax. This section describes **needs**, not syntax.

### 5.1 Categories per language (CLDR, as returned by `Intl.PluralRules`)

| Locale | Categories | Notes |
|---|---|---|
| ko, ja, zh | other | No plural nouns, but the **counter word** must be right (장/枚/张, 롤/本/卷). |
| en | one, other | |
| es | one, many, other | `many` is for exact millions ("1 000 000 de fotos"); in practice one/other. |
| fr | one, many, other | **one = 0 and 1** ("0 photo", "1 photo"). `many` for millions. |
| pt-BR | one, many, other | **one = 0 and 1** in CLDR. `many` for millions. |
| ru | one, few, many, other | one: 1, 21, 31… (not 11) кадр; few: 2–4, 22–24… кадра; many: 0, 5–20, 25–30… кадров; other: fractions (1,5 кадра). |
| hi | one, other | **one = 0 and 1.** |
| ar | zero, one, two, few, many, other | zero: 0 · one: 1 (noun without numeral: صورة واحدة) · two: 2 (dual without numeral: صورتان) · few: 3–10 (plural noun: 3 صور) · many: 11–99 (singular, accusative: 11 صورة) · other: 100, 101, 102… (singular: 100 صورة). |

### 5.2 Engineering needs (for the new syntax)

1. All six CLDR categories must be expressible per string; a missing category falls back to `other`.
2. **Exact-value overrides** (at least `=0`, ideally `=1`, `=2`) so any language can write a natural zero ("No photos yet") instead of "0 photos". Arabic `one`/`two` forms often omit the number entirely, so a form **must be allowed to contain no `{n}`**.
3. Plural selection must work on **fractions** (for `{v}` stops: ru/ar/pt/fr choose differently for 1.5); pass the same fraction digits to `PluralRules` that the number formatter shows.
4. A string may contain **two independent counts** (`set.backup.done`: rolls and photos). Each needs its own selector.
5. `{shots}` / `{left}` are pre-built phrases, but the surrounding sentence agrees with the count in es/fr/pt/ru/hi/ar ("Las 24 fotos restantes quedarán…" vs "La foto restante quedará…"). The engineer should pass the **raw counts too** (e.g. `shotsCount`, `leftCount`) so the outer sentence can select a form.
6. Ordinals ("Frame {n}", "{n}번째 컷") stay as cardinals in all languages (Frame 12 / 12コマ目 / 第 12 张 / foto 12 / vue 12 / pose 12 / кадр 12 / फ़्रेम 12 / اللقطة 12). No ordinal rules needed.

### 5.3 Keys that need plural forms

- **Already marked in en:** `dr.years`, `cam.nShots`, `cam.nHalves` (two counts), `cam.nHalfShots`, `gal.emptyHintLab`, `gal.frames`, `gal.deleteRollConfirm`, `dr.stops`, `roll.ready`, `set.backup.done` (two counts), `set.backup.partial`, `set.backup.restored` (two counts), `set.backup.skipped`, `set.backup.damaged`, `a11y.rollLoaded`, `view.expiredYears`.
- **Not marked in en but need forms in ru/ar (and often es/fr/pt/hi):** `lab.developedMany`, `cam.exposures`, `cam.left`, `cam.pack`, `cam.card`, `cam.halves`, `cam.sec`, `cam.timerSay`, `roll.selectedN`, `roll.shareN`, `roll.saveN`, `an.log.frames`, `gal.emptyHintCamera`, `lab.emptyCamera`, `gal.inCameraBanner`.
- **Outer-sentence agreement with `{shots}`/`{left}`:** `cam.rewindConfirm`, `cam.finishPackConfirm`, `cam.finishCardConfirm`, `cam.switchConfirm*`, `cam.switchConfirm*2`.
- Workaround allowed until the syntax lands: colon or parenthesis constructions that avoid agreement (ru "Отснято: {shots}", fr "Les vues restantes ({left})").

---

## 6. Glossary

Columns: EN · KO (source) · JA · ZH · ES · FR · PT · RU · HI · AR · Notes. Where two forms are given, the first is the default, the second is for the noted context (tab label, chip, prose). Reasons for debatable picks are in section 11.

### 6.1 Brand & core

| # | EN | KO | JA | ZH | ES | FR | PT | RU | HI | AR | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Film Camela | Film Camela | Film Camela | Film Camela | Film Camela | Film Camela | Film Camela | Film Camela | Film Camela | Film Camela | Never translate. Latin script only. |
| 2 | camera | 카메라 | カメラ | 相机 | cámara | appareil photo (appareil) | câmera | камера | कैमरा | كاميرا | fr: front/back lens = "caméra avant/arrière" (Apple FR). |
| 3 | film (material) | 필름 | フィルム | 胶片 | película | pellicule | filme | плёнка | फ़िल्म | فيلم | |
| 4 | roll (of film) | 롤 | フィルム (count: 本) | 胶卷 (count: 卷) | rollo | pellicule | filme (rolo) | плёнка | रोल | فيلم (pl. أفلام) | Not "carrete" (Spain-only). See 11. |
| 5 | film stock | 필름 (종류) | フィルム (銘柄) | 胶卷型号 | tipo de película | pellicule | tipo de filme | плёнка | फ़िल्म | نوع الفيلم | In pickers just "Film". |
| 6 | exposures (count per roll) | 장 | 枚 (36枚撮り) | 张 | fotos (chip: exp.) | vues | poses | кадров | फ़ोटो | لقطات | `cam.exposures`: "{n}枚撮り", "{n} vues", "{n} poses". |
| 7 | frame (numbered position) | 컷 | コマ | 张 (第 n 张) | foto (log: fotograma) | vue | pose | кадр | फ़्रेम | لقطة | |
| 8 | photo / shot (the image) | 사진 | 写真 | 照片 | foto | photo | foto | фото / снимок | तस्वीर (label: फ़ोटो) | صورة | ru "фото" indeclinable. |
| 9 | Analog (tab) | 아날로그 | アナログ | 胶片机 | Analógico | Argentique | Analógico | Аналог | एनालॉग | تناظري | Tab = tools for a real film camera. |
| 10 | instant camera | 즉석 카메라 | インスタントカメラ | 即时成像相机 | cámara instantánea | appareil instantané | câmera instantânea | камера моментальной печати | इंस्टेंट कैमरा | كاميرا فورية | No チェキ / 拍立得 / Polaroid. |
| 11 | disposable camera | 일회용 카메라 | 使い捨てカメラ | 一次性相机 | cámara desechable | appareil jetable | câmera descartável | одноразовая камера | डिस्पोज़ेबल कैमरा | كاميرا أحادية الاستخدام | |
| 12 | digital (camera group) | 디지털 | デジタル | 数码 | Digital | Numérique | Digital | Цифровые | डिजिटल | رقمية | `cam.group.digital` |
| 13 | toy & special | 토이·특수 카메라 | トイ・特殊カメラ | 玩具与特殊相机 | De juguete y especiales | Jouets et spéciaux | Brinquedo e especiais | Игрушечные и особые | टॉय और ख़ास कैमरे | كاميرات لعبة وخاصة | `cam.group.toy` |

### 6.2 Shooting

| # | EN | KO | JA | ZH | ES | FR | PT | RU | HI | AR | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 14 | Load film | 필름 넣기 | フィルムを入れる | 装入胶卷 | Cargar rollo | Charger une pellicule | Colocar filme | Зарядить плёнку | रोल डालें | إدخال فيلم | ar: never تحميل (= download). |
| 15 | Unload film | 필름 빼기 | フィルムを取り出す | 取出胶卷 | Sacar el rollo | Retirer la pellicule | Tirar o filme | Извлечь плёнку | रोल निकालें | إخراج الفيلم | |
| 16 | rewind | 되감기 | 巻き戻し | 倒片 | rebobinar | rembobiner | rebobinar | перемотка | रिवाइंड | لفّ الفيلم | UI shows "Send to lab" for this action; "rewind" only in descriptions. |
| 17 | shutter (mechanism) | 셔터 | シャッター | 快门 | obturador | obturateur | obturador | затвор | शटर | الغالق | |
| 18 | Take photo (shutter button) | 촬영 | 撮影 | 拍照 | Tomar foto | Prendre une photo | Tirar foto | Снять | फ़ोटो लें | التقاط صورة | `cam.shutter` (a11y label). |
| 19 | flash | 플래시 | フラッシュ | 闪光灯 | flash | flash | flash | вспышка | फ़्लैश | فلاش | |
| 20 | charge the flash | 플래시 충전 | フラッシュを充電 | 闪光灯充电 | cargar el flash | charger le flash | carregar o flash | зарядить вспышку | फ़्लैश चार्ज करें | شحن الفلاش | |
| 21 | self-timer | 타이머 | セルフタイマー (chip: タイマー) | 自拍定时 (chip: 定时) | temporizador | retardateur | temporizador | автоспуск (chip: Таймер) | टाइमर | المؤقت | |
| 22 | viewfinder | 뷰파인더 | ファインダー | 取景器 | visor | viseur | visor | видоискатель | व्यूफ़ाइंडर | محدِّد المنظر | |
| 23 | lens | 렌즈 | レンズ | 镜头 | lente | objectif | lente | объектив | लेंस | عدسة | fr not "lentille". |
| 24 | format (aspect) | 비율 | 比率 | 画幅 | Formato | Format | Formato | Формат | फ़ॉर्मैट | النسبة | `cam.aspect` chip. |
| 25 | grid | 격자 | グリッド | 网格 | Cuadrícula | Grille | Grade | Сетка | ग्रिड | الشبكة | |
| 26 | zoom | 줌 | ズーム | 变焦 | Zoom | Zoom | Zoom | Зум | ज़ूम | التكبير | |
| 27 | date stamp | 날짜 각인 | 日付写し込み (chip: 日付) | 日期印记 (chip: 日期) | Fecha impresa (chip: Fecha) | Dateur (chip: Date) | Data impressa (chip: Data) | Дата на снимке (chip: Дата) | तारीख़ की छाप (chip: तारीख़) | ختم التاريخ (chip: التاريخ) | fr "dateur" is the real camera term. |
| 28 | switch camera (front/back) | 카메라 전환 | カメラを切り替え | 切换镜头 | Cambiar cámara | Changer de caméra | Alternar câmera | Сменить камеру | कैमरा बदलें | تبديل الكاميرا | Different from "switch camera body" (`cam.switchBody`). |
| 29 | pin (to the front) | 고정 | ピン留め | 置顶 | Fijar | Épingler | Fixar | Закрепить | पिन करें | تثبيت | `cam.pinHint`: "Pin to the front" → zh 置顶 already means it. |
| 30 | instant pack | 팩 | パック | 相纸 | cartucho | recharge | cartucho | кассета | पैक | عبوة | `cam.loadPack`, `cam.pack`. |
| 31 | memory card | 메모리 카드 | メモリーカード | 存储卡 | tarjeta de memoria | carte mémoire | cartão de memória | карта памяти | मेमोरी कार्ड | بطاقة ذاكرة | |
| 32 | half-frame | 하프프레임 | ハーフサイズ | 半格 | medio cuadro | demi-format | meio quadro | полукадр | हाफ़-फ़्रेम | نصف إطار | es: never "medio formato" (= medium format). |
| 33 | double exposure | 이중 노출 | 多重露光 | 双重曝光 | doble exposición | double exposition | dupla exposição | двойная экспозиция | डबल एक्सपोज़र | تعريض مزدوج | |
| 34 | exposure (EV dial / compensation) | 노출 / 노출 보정 | 露出 / 露出補正 | 曝光 / 曝光补偿 | Exposición / compensación de exposición | Expo / correction d’exposition | Exposição / compensação de exposição | Экспозиция / экспокоррекция | एक्सपोज़र | التعريض / تعويض التعريض | Chip `cam.ev`: short form. |
| 35 | stop (±1 stop) | 스톱 | 段 | 档 | paso | IL | ponto | ступень | स्टॉप | درجة | `dr.stops`. |

### 6.3 Lab & development

| # | EN | KO | JA | ZH | ES | FR | PT | RU | HI | AR | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 36 | lab (the place where rolls wait) | 현상소 | 現像所 | 冲洗店 | laboratorio (tab: Revelado) | labo | laboratório (tab: Revelação) | лаборатория (tab: Проявка) | लैब | معمل التحميض (tab: المعمل) | The "delay place". See 11. |
| 37 | Send to lab | 현상소로 보내기 | 現像に出す | 送去冲洗 | Enviar a revelar | Envoyer au labo | Mandar revelar | Отдать в проявку | लैब भेजें | إرسال للتحميض | The most frequent action: keep it identical everywhere. |
| 38 | develop / development | 현상(하다) | 現像(する) | 冲洗 | revelar / revelado | développer / développement | revelar / revelação | проявить / проявка | डेवलप करना / डेवलपिंग | تحميض / حمّض | zh: 显影 only for chemistry talk. |
| 39 | Developing… | 현상 중 | 現像中 | 冲洗中 | Revelando… | Développement… | Revelando… | Проявляется… | डेवलप हो रहा है… | جارٍ التحميض… | |
| 40 | Developed | 현상 완료 | 現像完了 | 冲洗完成 | Revelado | Développé | Revelado | Проявлено | डेवलप हो गया | تم التحميض | No "!". |
| 41 | Develop now (rush) | 지금 바로 현상 | 今すぐ現像 | 立即冲洗 | Revelar ya | Développer maintenant | Revelar agora | Проявить сейчас | अभी डेवलप करें | التحميض الآن | |
| 42 | print(s) | 인화 / 사진 | プリント | 照片 | copias | tirages | cópias | снимки (отпечатки) | प्रिंट | الصور المطبوعة | `speed.title` "When do you want your prints?" — translate naturally ("いつ受け取りますか？"). |
| 43 | Print (border chip) | 인화지 | プリント | 相纸 | Copia | Tirage | Cópia | Отпечаток | प्रिंट | مطبوعة | |
| 44 | negative | 네거티브 | ネガ | 底片 | negativo | négatif | negativo | негатив | नेगेटिव | النيغاتيف | |
| 45 | original | 원본 | オリジナル | 原图 | original | original | original | оригинал | ओरिजिनल | الأصل | |
| 46 | contact sheet | 밀착 인화 | ベタ焼き | 印样 | hoja de contactos | planche contact | folha de contato | контактный лист | कॉन्टैक्ट शीट | ورقة التلامس | ja fallback コンタクトシート. |
| 47 | sprocket holes | 필름 구멍 | パーフォレーション | 齿孔 | perforaciones | perforations | perfurações | перфорация | स्प्रॉकेट होल | ثقوب الفيلم | |
| 48 | Instant (speed) | 즉시 | 今すぐ | 立即 | Al instante | Immédiat | Na hora | Сразу | तुरंत | فورًا | |
| 49 | 1 hour | 1시간 | 1時間 | 1 小时 | 1 hora | 1 heure (chip: 1 h) | 1 hora | 1 час | 1 घंटा | ساعة | ar: no numeral for one. |
| 50 | 9 AM (next 9 AM) | 아침 9시 | 朝9時 | 早上 9 点 | 9 a. m. | 9 h | 9h | В 9 утра | सुबह 9 बजे | 9 صباحًا | Means the **next** 9 AM, which can be today. Never write "tomorrow". |
| 51 | 3 days | 3일 | 3日 | 3 天 | 3 días | 3 jours | 3 dias | 3 дня | 3 दिन | 3 أيام | |

### 6.4 Darkroom

| # | EN | KO | JA | ZH | ES | FR | PT | RU | HI | AR | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 52 | darkroom | 다크룸 | 暗室 | 暗房 | cuarto oscuro | chambre noire | quarto escuro | тёмная комната | डार्करूम | الغرفة المظلمة | pt not "câmara escura" (= camera obscura). |
| 53 | Re-develop | 다시 현상 | 再現像 | 重新冲洗 | Revelar de nuevo | Redévelopper | Revelar de novo | Проявить заново | फिर से डेवलप करें | إعادة التحميض | |
| 54 | brightness (push / pull) | 밝기 (증감현상) | 明るさ（増感／減感） | 亮度（迫冲／拉冲） | Brillo (forzado/subrevelado) | Luminosité (pousser/retenir) | Brilho (puxar/segurar) | Яркость (пуш/пулл) | ब्राइटनेस (पुश/पुल) | السطوع (دفع/سحب) | Brightness first, jargon in parentheses. |
| 55 | Normal | 노멀 | ノーマル | 正常 | Normal | Normal | Normal | Норма | नॉर्मल | عادي | `dr.normal`, `view.pushNormal`. |
| 56 | expired / aged film | 오래된 필름 (만료) | 期限切れフィルム | 过期胶卷 | película caducada | pellicule périmée | filme vencido | просроченная плёнка | एक्सपायर्ड फ़िल्म | فيلم منتهي الصلاحية | Label `dr.expired`: "Aged film look (expired)". |
| 57 | fresh film | 새 필름 | 新しいフィルム | 新胶卷 | película nueva | pellicule fraîche | filme novo | свежая плёнка | नई फ़िल्म | فيلم جديد | `view.expiredNone`. |
| 58 | grain | 입자 | 粒子 | 颗粒 | grano | grain | granulação | зерно | ग्रेन | الحُبيبات | |
| 59 | halation / glow | 빛 번짐 (할레이션) | にじみ（ハレーション） | 光晕 | halo | halo | halo | ореол | ग्लो | الوهج | Plain word first, technical term in parentheses only where the source has it. |
| 60 | light leak | 빛샘 | 光漏れ | 漏光 | filtración de luz | fuite de lumière | vazamento de luz | засветка | लाइट लीक | تسرّب الضوء | |
| 61 | border | 테두리 | フチ | 边框 | borde | bordure | borda | рамка | बॉर्डर | الحافة | ar: not إطار (we keep إطار for half-frame only). |
| 62 | digital look | 디지털 룩 | デジタル風 | 数码风格 | Look digital | Rendu numérique | Visual digital | Цифровой стиль | डिजिटल लुक | مظهر رقمي | |
| 63 | flash look | 플래시 룩 | フラッシュ風 | 闪光效果 | Efecto flash | Effet flash | Efeito flash | Эффект вспышки | फ़्लैश लुक | تأثير الفلاش | |
| 64 | Apply to roll | 롤 전체에 적용 | フィルム全体に適用 | 应用到整卷 | Aplicar a todo el rollo | Appliquer à la pellicule | Aplicar ao filme todo | Применить ко всей плёнке | पूरे रोल पर लगाएँ | تطبيق على الفيلم كله | |
| 65 | Reset | 초기화 | リセット | 重置 | Restablecer | Réinitialiser | Redefinir | Сбросить | रीसेट करें | إعادة تعيين | |
| 66 | Save as new photo | 새 사진으로 저장 | 新規写真として保存 | 存为新照片 | Guardar como foto nueva | Enregistrer comme nouvelle photo | Salvar como nova foto | Сохранить как новое фото | नई फ़ोटो के रूप में सेव करें | حفظ كصورة جديدة | |

### 6.5 Analog tools

| # | EN | KO | JA | ZH | ES | FR | PT | RU | HI | AR | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 67 | light meter / exposure calculator | 노출계 / 노출 계산기 | 露出計 / 露出計算 | 测光表 / 曝光计算器 | fotómetro / calculadora de exposición | posemètre / calculateur d’exposition | fotômetro / calculadora de exposição | экспонометр / калькулятор экспозиции | लाइट मीटर / एक्सपोज़र कैलकुलेटर | مقياس الضوء / حاسبة التعريض | `an.meter`: keep "Sunny 16". |
| 68 | aperture | 조리개 | 絞り | 光圈 | apertura | ouverture | abertura | диафрагма | अपर्चर | فتحة العدسة | |
| 69 | shutter speed | 셔터 속도 | シャッタースピード | 快门速度 | velocidad de obturación | vitesse d’obturation | velocidade do obturador | выдержка | शटर स्पीड | سرعة الغالق | |
| 70 | ISO | ISO | ISO | ISO | ISO | ISO | ISO | ISO | ISO | ISO | Latin in all languages. |
| 71 | shooting log | 촬영 노트 | 撮影メモ | 拍摄记录 | registro de tomas | carnet de prise de vue | caderno de fotos | журнал съёмки | शूटिंग लॉग | سجل التصوير | |
| 72 | tripod | 삼각대 | 三脚 | 三脚架 | trípode | trépied | tripé | штатив | ट्राइपॉड | حامل ثلاثي | |

### 6.6 Album, sharing, system

| # | EN | KO | JA | ZH | ES | FR | PT | RU | HI | AR | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 73 | album | 앨범 | アルバム | 相册 | álbum | album | álbum | альбом | एल्बम | الألبوم | |
| 74 | Import photos | 사진 불러오기 | 写真を読み込む | 导入照片 | Importar fotos | Importer des photos | Importar fotos | Импортировать фото | फ़ोटो इंपोर्ट करें | استيراد الصور | |
| 75 | Share | 공유 | 共有 | 分享 | Compartir | Partager | Compartilhar | Поделиться | शेयर करें | مشاركة | zh: in-app 分享; in iOS menu paths Apple's 共享. |
| 76 | Save (to gallery) | 저장 | 保存 | 保存 | Guardar | Enregistrer | Salvar | Сохранить | सेव करें | حفظ | |
| 77 | Delete | 삭제 | 削除 | 删除 | Eliminar | Supprimer | Apagar | Удалить | डिलीट करें | حذف | |
| 78 | Undo | 되돌리기 | 取り消す | 撤销 | Deshacer | Annuler | Desfazer | Отменить | वापस लें | تراجع | fr: Apple uses "Annuler" for both Undo and Cancel. |
| 79 | Cancel | 취소 | キャンセル | 取消 | Cancelar | Annuler | Cancelar | Отменить | रद्द करें | إلغاء | |
| 80 | Done | 완료 | 完了 | 完成 | OK | OK | OK | Готово | हो गया | تم | Apple uses "OK" for Done in es/fr/pt. |
| 81 | Retry | 다시 시도 | 再試行 | 重试 | Reintentar | Réessayer | Tentar de novo | Повторить | फिर कोशिश करें | إعادة المحاولة | |
| 82 | Settings | 설정 | 設定 | 设置 | Ajustes | Réglages | Ajustes | Настройки | सेटिंग्ज़ | الإعدادات | es: "Ajustes" for length; see 11. |
| 83 | backup | 백업 | バックアップ | 备份 | respaldo | sauvegarde | backup | резервная копия | बैकअप | نسخة احتياطية | es: LatAm "respaldo"; see 11. |
| 84 | Restore from backup | 백업에서 복원 | バックアップから復元 | 从备份恢复 | Restaurar respaldo | Restaurer une sauvegarde | Restaurar backup | Восстановить из копии | बैकअप से रीस्टोर करें | الاستعادة من نسخة احتياطية | |
| 85 | storage | 저장 공간 | ストレージ | 储存空间 | almacenamiento | stockage | armazenamento | хранилище | स्टोरेज | مساحة التخزين | |
| 86 | device | 기기 | デバイス | 设备 | dispositivo | appareil (prefer téléphone) | dispositivo | устройство | डिवाइस | جهاز | |
| 87 | Home Screen | 홈 화면 | ホーム画面 | 主屏幕 | pantalla de inicio | écran d’accueil | Tela de Início | экран «Домой» | होम स्क्रीन | الشاشة الرئيسية | Match the OS wording; see 9. |
| 88 | NEW (badge) | 새 롤 | NEW | 新 | NUEVO | NOUVEAU | NOVO | НОВОЕ | नया | جديد | Badge: keep ≤ 6 Latin chars; ja may keep NEW. |

---

## 7. Arabic / RTL notes

### 7.1 Direction and mirroring

- The whole UI runs `dir="rtl"` for ar. Layout uses logical properties (start/end), so tab order, lists and toolbars flow right to left.
- **Mirror:** back/next chevrons, disclosure arrows, the order of album grids (first roll at the right), carousels (the camera shelf, film picker), progress that fills along the reading direction, sliders (the platform convention is min on the right in RTL; the "−" and "+" labels move with their ends).
- **Never mirror:** photos, negatives, viewfinder overlays, camera body art, contact sheets (it is an exported image), the shutter button, clocks/timers, play icons, checkmarks, the Film Camela wordmark, and the **physical order of half-frame and quad-lens shots** (the negative is still left → right).
- Swipe in the photo viewer: in RTL the **next** photo comes from the left. Translate `view.prev`/`view.next` by meaning (السابقة / التالية), never as "left/right".

### 7.2 Numbers (decision: Western digits 0–9)

- Model and film names always contain Western digits (Pro 35, Sunny 200, Expired '98). Mixing them with Arabic-Indic digits (٣٦ لقطة next to Pro 35) looks broken, so the Arabic UI uses **Western digits everywhere**. Engineering: format ar numbers and dates with `numberingSystem: 'latn'` (or locale `ar-u-nu-latn`). See 11 for the alternative.
- Percent with Western digits: "%" (not ٪).
- Signed values (EV +1, −0.5, stops) must be isolated left-to-right (code wraps them in LRI…PDI or `<bdi dir="ltr">`) so the minus sign does not jump to the other side. Use the real minus "−" (U+2212).
- Ranges with Latin digits: write "10–99" as usual; the bidi algorithm keeps the order.

### 7.3 Latin text inside Arabic sentences

- Placeholders `{stock}`, `{name}`, `{used}`, `{time}` and any Latin token ("35mm", "PRO", "CSV", ".zip", "ISO 400", "Film Camela") must be wrapped by **code** in first-strong isolation (FSI…PDI or `<bdi>`). Translators do not type control characters.
- Each string's base direction is set to RTL explicitly, not "auto": a sentence that starts with "Film Camela…" must still be laid out RTL.
- Put a short Arabic noun before Latin names where it helps: "كاميرا Pro 35", "فيلم Sunny 200", "تطبيق Film Camela".

### 7.4 Direction words and arrows in strings

- `a11y.stockKeys` / `a11y.cameraKeys` ("← → keys"): write "مفتاحا الأسهم" (arrow keys) without arrow glyphs; the glyph order is confusing in RTL.
- `hint.ios` ("Share → Add to Home Screen"): replace the arrow with "ثم" ("then"): «مشاركة» ثم «إضافة إلى الشاشة الرئيسية». Same advice for `err.storagePermission` (Settings > Apps > …): use "←" (pointing left, the RTL reading direction) or "ثم".
- `cam.halfNext` ("Next shot fills the right half"): this is the **physical** right half of the negative, which is not mirrored. Write "الأيمن" literally: «اللقطة التالية تملأ النصف الأيمن».
- "Left/right" anywhere else should be avoided in favor of "next/previous" or "first/second".

### 7.5 Typography

- Arabic and Devanagari need more line height than Latin (about 1.5–1.6 vs 1.3). Check two-line buttons and toasts.
- Ellipsis "…" sits at the logical end (visual left).
- Separator " · " works in RTL; keep spaces on both sides.

---

## 8. Length guidance

### 8.1 Budget

- **UI labels must not exceed the English length by more than ~30%** (measure width, not characters). The reference device is a 360 px-wide phone.
- One CJK character is about 1.8 Latin characters wide; Devanagari and Arabic are about 1.0–1.2 but taller.
- Typical expansion against en: es / fr / pt +20–30%, ru +15–30% (long words), hi +10–30%, ar −10 to +20%, ja / zh / ko about 50–70% of en width.
- If a label does not fit, shorten the wording (use the chip forms in section 6), never abbreviate with a period ("Config."), never shrink the font.

### 8.2 Tightest strings (by key)

| Area | Keys | en | Budget |
|---|---|---|---|
| **Tab bar** (5 items, ~72 px each) | `tab.camera`, `tab.lab`, `tab.gallery`, `tab.analog`, `tab.settings` | Camera · Lab · Album · Analog · Settings | ≤ 10 Latin chars / 4 CJK / 8 Devanagari or Arabic letters |
| **Camera toolbar chips** | `cam.flash`, `cam.timer`, `cam.grid`, `cam.date`, `cam.zoom`, `cam.aspect`, `cam.ev`, `cam.palette`, `cam.more` | Flash · Timer · Grid · Date · Zoom · Format · Exposure · Palette · More | ≤ 8 Latin / 3 CJK. Use the chip forms (Таймер, 定时, Expo). |
| **Counters / pills** | `cam.left`, `cam.exposures`, `cam.saved`, `cam.quadProgress`, `cam.sec`, `cam.nShots`, `lab.readyIn`, `cam.pinned`, `common.pro`, `gal.new` | 24 left · 36 exp · Frame 12 · Lens 2/4 · 10s | ≤ 10 Latin incl. digits |
| **Lab speed chips** | `speed.instant`, `speed.1h`, `speed.morning`, `speed.3d` | Instant · 1 hour · Next 9 AM · 3 days | ≤ 10 Latin; the `.d` lines below them get one line (≤ 28 Latin) |
| **Primary buttons** | `cam.loadFilm`, `cam.load`, `cam.sendToLab`, `cam.rewind`, `cam.develop`, `cam.unload`, `cam.finishPack`, `cam.finishCard`, `lab.rush`, `lab.open`, `gal.import`, `gal.openLab`, `gal.contact`, `common.start` | Load film · Send to lab · Develop now · Get started | ≤ 18 Latin |
| **Dialog buttons** | `common.cancel`, `common.delete`, `common.done`, `common.retry`, `common.skip`, `common.undo`, `dr.discard`, `cam.switchOkFilm`, `cam.switchOkDone` | Cancel · Delete · Done · Send to lab & switch | ≤ 14 Latin; `cam.switchOkFilm` may wrap to 2 lines but try ≤ 22 |
| **Photo viewer bar** | `view.share`, `view.saveImage`, `view.darkroom`, `view.info`, `roll.select`, `roll.shareN`, `roll.saveN` | Share · Save · Darkroom · Info | ≤ 10 Latin (icon + label) |
| **Darkroom controls** | `dr.film`, `dr.push`, `dr.grain`, `dr.leak`, `dr.leak.reroll`, `dr.flash`, `dr.date`, `dr.border`, `dr.halation`, `dr.expired`, `dr.ev`, `dr.palette`, `dr.tone`, `dr.reset`, `dr.applyRoll`, `dr.rotate`, `dr.redevelop`, `dr.saveNew` | Grain · Light leak · Border · Reset · Apply to roll | Labels ≤ 22 Latin (the parenthesized part of `dr.push` / `dr.halation` / `dr.expired` may be dropped if needed) |
| **Darkroom chips** | `dr.border.*`, `dr.tone.*`, `palette.*`, `dr.normal`, `dr.stops` | None · 35mm · Instant · Print · Slide · Cine · Sprocket · Cool · Warm · Washed · Night | ≤ 9 Latin / 3 CJK |
| **Settings toggles** | `set.storage.persistAsk`, `set.storage.persisted`, `set.storage.refusedShort`, `common.on`, `common.off`, `update.reload` | Turn on · Protected · Not allowed · On · Off · Reload | ≤ 12 Latin |

### 8.3 Suggested tab labels (all languages, already fitted)

| Key | en | ko | ja | zh | es | fr | pt | ru | hi | ar |
|---|---|---|---|---|---|---|---|---|---|---|
| `tab.camera` | Camera | 카메라 | カメラ | 相机 | Cámara | Appareil | Câmera | Камера | कैमरा | الكاميرا |
| `tab.lab` | Lab | 현상소 | 現像所 | 冲洗店 | Revelado | Labo | Revelação | Проявка | लैब | المعمل |
| `tab.gallery` | Album | 앨범 | アルバム | 相册 | Álbum | Album | Álbum | Альбом | एल्बम | الألبوم |
| `tab.analog` | Analog | 아날로그 | アナログ | 胶片机 | Analógico | Argentique | Analógico | Аналог | एनालॉग | تناظري |
| `tab.settings` | Settings | 설정 | 設定 | 设置 | Ajustes | Réglages | Ajustes | Настройки | सेटिंग्ज़ | الإعدادات |

---

## 9. Locale-specific content (change, don't just translate)

| Key | Issue | What to do |
|---|---|---|
| `set.backup.send`, `set.backup.restoreHint` | "KakaoTalk" is Korea-only. "Drive" is unavailable in mainland China. | ko keeps 카카오톡. Other locales: generic wording ("Send it to yourself: messages, email or cloud storage"). ja may name LINE; zh: "微信或其他 App" (no Drive). Owner to confirm. |
| `hint.ios` | Names Safari menu items. | Use Apple's own localized labels: ja 「共有」→「ホーム画面に追加」 · zh “共享”→“添加到主屏幕” · es “Compartir” → “Agregar a inicio” · fr « Partager » → « Sur l’écran d’accueil » · pt “Compartilhar” → “Adicionar à Tela de Início” · ru «Поделиться» → «На экран „Домой“» · hi “शेयर करें” → “होम स्क्रीन में जोड़ें” · ar «مشاركة» ثم «إضافة إلى الشاشة الرئيسية». **Verify each on a device in that language before release.** |
| `err.storagePermission` | Android menu path (Settings > Apps > Film Camela > Permissions). | Use the localized Android menu names of each language (verify on a device). |
| `speed.1h.d` ("A coffee break") | Cultural fit. | hi may use chai ("बस एक कप चाय जितना इंतज़ार"); pt-BR "cafezinho". Others keep coffee. |
| `set.credit` | Legal name. | Keep "© 2026 ATIUM GROUP Co., Ltd." in every non-ko locale. |
| `cam.err.unsupported` | Browser names. | Keep "Safari", "Chrome" as is. |
| Store listing (`03b`) | Keyword fields are per-store, per-locale. | Write keywords natively from local search terms; never translate the ko/en keyword list word for word. Same brand rules (§1.2.8). |

---

## 10. Example lines per language (Apple-like tone)

Each set shows the same eight moments, written natively. **(1)** `onb.1.title` · **(2)** `onb.1.body` · **(3)** lab explanation (`speed.why`) · **(4)** empty album (`gal.empty` / `gal.emptyHint`) · **(5)** "Send to lab" confirm (`cam.rewindConfirm`) · **(6)** backup hint (`set.backup.hint`) · **(7)** privacy (`onb.privacy`) · **(8)** `speed.1h.d`.
Lines marked *(other)* show the plural "other" form; the other plural forms follow section 5.

### ko (source, refined)

1. 필름처럼, 한 장씩
2. 카메라를 고르고 롤을 넣어 보세요. 남은 장수를 세며, 한 장 한 장 마음을 담아요.
3. 잊을 즈음 도착하는 설렘, 그게 필름의 재미예요. 바로 보고 싶다면 ‘즉시’를 고르세요.
4. 아직 현상된 사진이 없어요. / 첫 롤을 찍으러 가 볼까요?
5. {shots} 찍었어요. 남은 {left}은 비워 둔 채 현상소로 보낼까요?
6. 사진과 기록은 이 기기에만 머물러요. 폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업 파일(.zip)로 챙겨 두세요.
7. 계정도 서버도 없어요. 모든 사진은 이 기기 안에만 있어요.
8. 커피 한 잔의 기다림

### en-US

1. Shoot like film.
2. Pick a camera, load a roll, and make every frame count.
3. Forget the roll, then find it again. That’s the joy of film. Want them now? Choose Instant.
4. No photos yet. / Your first roll is waiting.
5. You’ve taken {shots}. Send this roll to the lab? The remaining {left} will stay blank.
6. Your photos and logs live only on this device. Before you switch phones or clear browser data, keep a backup (.zip) somewhere safe.
7. No account. No servers. Every photo stays on this device.
8. Just long enough for a coffee.

### ja

1. フィルムのように、撮る。
2. カメラを選んで、フィルムを入れましょう。残りの枚数を数えながら、一枚ずつ大切に。
3. 忘れたころに届く、あのときめき。待つ時間も、フィルムの楽しみです。すぐに見たいときは「今すぐ」を。
4. 現像された写真はまだありません。／最初の1本を撮りに行きましょう。
5. {shots}撮りました。残りの{left}は空けたまま、現像に出しますか？
6. 写真と記録は、このデバイスにだけ保存されます。機種変更やブラウザのデータ消去の前に、バックアップファイル（.zip）を保存しておきましょう。
7. アカウントも、サーバーもありません。写真はすべて、このデバイスの中だけに。
8. コーヒー1杯ぶんの待ち時間

### zh-CN

1. 像胶片一样，慢慢拍。
2. 选一台相机，装上一卷胶卷。数着剩下的张数，认真拍好每一张。
3. 快要忘记时，照片才送到。这份惊喜，就是胶片的乐趣。想马上看到？选择“立即”。
4. 还没有冲洗好的照片。／去拍下你的第一卷吧。
5. 已拍 {shots}。剩下的 {left}将留空，现在送去冲洗吗？
6. 照片和记录只保存在这台设备上。换手机或清除浏览器数据前，记得先保存一份备份文件（.zip）。
7. 无需账户，没有服务器。所有照片都只留在这台设备上。
8. 一杯咖啡的时间

### es (neutral)

1. Cada foto cuenta.
2. Elige una cámara y carga un rollo. Con las fotos contadas, cada disparo se vuelve especial.
3. La espera también es parte de la magia: te olvidas del rollo y, un día, vuelve. ¿No quieres esperar? Elige “Al instante”.
4. Aún no hay fotos reveladas. / Tu primer rollo te espera.
5. Llevas {shots}. ¿Enviar el rollo a revelar? Las {left} restantes quedarán sin usar. *(other)*
6. Tus fotos y registros solo se guardan en este dispositivo. Antes de cambiar de teléfono o borrar los datos del navegador, guarda un respaldo (.zip).
7. Sin cuenta. Sin servidores. Tus fotos se quedan en este dispositivo.
8. Lo que dura un café

### fr

(Spaces before `: ? !` and inside « » are non-breaking in shipped strings; see 2.6.)

1. Comme en argentique.
2. Choisissez un appareil, chargez une pellicule. Chaque vue compte.
3. Oublier la pellicule, puis la redécouvrir : c’est tout le charme de l’argentique. Envie de voir tout de suite ? Choisissez « Immédiat ».
4. Aucune photo développée pour l’instant. / Votre première pellicule vous attend.
5. Vous avez pris {shots}. Envoyer la pellicule au labo ? Les vues restantes ({left}) resteront vierges.
6. Vos photos et vos notes restent uniquement sur cet appareil. Avant de changer de téléphone ou d’effacer les données du navigateur, enregistrez une sauvegarde (.zip).
7. Pas de compte, pas de serveur. Vos photos restent sur cet appareil.
8. Le temps d’un café

### pt-BR

1. Cada clique conta.
2. Escolha uma câmera e coloque um filme. Com as poses contadas, cada clique ganha outro valor.
3. A graça está na espera: esquecer o filme e, de repente, reencontrar as fotos. Não quer esperar? Escolha “Na hora”.
4. Nenhuma foto revelada ainda. / Seu primeiro filme está esperando por você.
5. Você fez {shots}. Mandar o filme revelar? As {left} restantes vão ficar em branco. *(other)*
6. Suas fotos e anotações ficam só neste dispositivo. Antes de trocar de celular ou limpar os dados do navegador, salve um arquivo de backup (.zip).
7. Sem conta, sem servidores. Suas fotos ficam só neste dispositivo.
8. O tempo de um cafezinho

### ru

1. Снимайте, как на плёнку.
2. Выберите камеру и зарядите плёнку. Кадров немного — каждый на счету.
3. Вся прелесть — в ожидании: забыть о плёнке и вдруг получить снимки. Не хотите ждать? Выберите «Сразу».
4. Проявленных снимков пока нет. / Ваша первая плёнка ждёт.
5. Отснято: {shots}. Отдать плёнку в проявку? Неотснятые кадры ({left}) останутся пустыми.
6. Фото и записи хранятся только на этом устройстве. Перед сменой телефона или очисткой данных браузера сохраните резервную копию (.zip).
7. Ни аккаунта, ни серверов. Все фото остаются на этом устройстве.
8. Как раз на чашку кофе

### hi

1. फ़िल्म की तरह खींचिए
2. कैमरा चुनिए, रोल डालिए। गिनी-चुनी तस्वीरें हैं, तो हर एक दिल से खींचिए।
3. जब आप भूलने लगें, तभी तस्वीरें आ जाएँ — यही तो फ़िल्म का मज़ा है। अभी देखना है? “तुरंत” चुनें।
4. अभी तक कोई तस्वीर डेवलप नहीं हुई है। / अपने पहले रोल से शुरुआत कीजिए।
5. आपने {shots} खींच ली हैं। बाकी {left} खाली छोड़कर रोल लैब भेजें? *(other)*
6. आपकी तस्वीरें और नोट्स सिर्फ़ इसी डिवाइस पर रहते हैं। फ़ोन बदलने या ब्राउज़र डेटा मिटाने से पहले बैकअप फ़ाइल (.zip) सेव कर लें।
7. न कोई अकाउंट, न कोई सर्वर। आपकी सारी तस्वीरें इसी डिवाइस पर रहती हैं।
8. बस एक कप चाय जितना इंतज़ार

### ar

1. لكل لقطة قيمتها.
2. اختر كاميرا وأدخِل فيلمًا. اللقطات معدودة، فاجعل كل واحدة منها تستحق.
3. أن تنسى الفيلم، ثم تصلك صوره فجأة… هذه متعة الفيلم. لا تريد الانتظار؟ اختر «فورًا».
4. لا توجد صور محمّضة بعد. / فيلمك الأول في انتظارك.
5. التقطت {shots}. هل تريد إرسال الفيلم للتحميض؟ ستبقى اللقطات المتبقية ({left}) فارغة.
6. تُحفظ صورك وسجلاتك على هذا الجهاز فقط. قبل تغيير هاتفك أو مسح بيانات المتصفح، احفظ نسخة احتياطية (.zip).
7. لا حساب ولا خوادم. تبقى كل صورك على هذا الجهاز.
8. بقدر فنجان قهوة

---

## 11. Debatable term decisions (with reasons)

| Locale | Decision | Alternative | Why |
|---|---|---|---|
| ja | Lab = **現像所**; action = **現像に出す** | ラボ | 現像所 is clear to everyone and mirrors ko 현상소; 現像に出す is exactly how Japanese shooters say "send to the lab". ラボ is fine among enthusiasts but colder. |
| ja | Contact sheet = **ベタ焼き** | コンタクトシート | The real darkroom word, loved by film fans, parallels ko 밀착 인화. Use コンタクトシート if testers find it obscure. |
| ja | Rolls counted with **本**, exposures with **枚**, frame numbers **コマ** | ロール | Japanese photographers say "フィルム1本", "36枚撮り", "12コマ目"; ロール sounds translated. |
| zh | Develop = **冲洗**; push/pull = **迫冲／拉冲** | 显影, 增感/减感 | 冲洗 is what film fans and labs say ("送去冲洗", "冲扫"); 显影 is chemistry. 迫冲 is the established push-processing term. |
| zh | **你**, **分享 / 保存** in-app | 您, Apple's 共享 / 存储 | Apple CN uses 你. For a cross-platform app (Android, web) 分享/保存 are the everyday words; Apple's wording is used only when pointing at iOS menus. |
| zh | Instant camera = **即时成像相机** | 拍立得 | 拍立得 grew out of a brand name; avoided like チェキ and Polaroid. |
| es | Roll = **rollo** | carrete | "Carrete" is Spain-only; "rollo" is standard across Latin America and understood in Spain. |
| es | Backup = **respaldo** | copia de seguridad | Apple's Latin American Spanish uses respaldo; it is also shorter. Spain users understand it. |
| es | Settings = **Ajustes** | Configuración | Apple es-419 uses Configuración, but at 13 letters it breaks the 5-item tab bar on 360 px. "Ajustes" (Apple Spain) is understood everywhere. |
| es | Lab tab = **Revelado**, action "Enviar a revelar" | Laboratorio | "Llevar/mandar a revelar" is how people actually talk; "Laboratorio" (11 letters) is too long for the tab and stays for the screen title. |
| es | Expired = **caducada** | vencida | The Spanish-speaking film community says "película caducada" widely; "vencida" is common in parts of LatAm (Argentina). Either is understood. |
| es/fr/pt | Done = **OK** | Listo / Terminé / Concluído | Matches Apple's own button in these locales. |
| fr | Analog tab = **Argentique**; exposure = **vue**; lab = **labo** | Analogique, pose, laboratoire | "L’argentique" is the French name for film photography and carries exactly the emotion we want. "36 vues" and "le labo" are what French shooters say. |
| fr | Stop = **IL** | diaph, stop | IL (indice de lumination) is the standard French unit for exposure steps. "stop" is understood by enthusiasts if testers prefer it. |
| pt-BR | Lab tab = **Revelação**, action "**Mandar revelar**"; exposures = **poses** | Laboratório, fotos | "Mandar revelar" and "filme de 36 poses" are the natural Brazilian phrases with a warm nostalgic ring. |
| pt-BR | Push/pull = **puxar / segurar** | push/pull in English | "Puxar o filme" is established for push; "segurar" for pull is less universal. Keep "Brilho" as the main label so no one depends on the jargon. Verify with a Brazilian film shooter. |
| ru | Lab tab = **Проявка**, action "**Отдать в проявку**"; screen title "Лаборатория"; darkroom = **Тёмная комната** | Лаборатория (tab), Фотолаборатория (darkroom) | "Отдать плёнку в проявку" is the everyday phrase; "Лаборатория" (11 letters) does not fit the tab. "Фотолаборатория" can mean both lab and darkroom, so the darkroom uses тёмная комната to keep the two places distinct. |
| ru | Analog tab = **Аналог** | Плёнка, Инструменты | Russian film shooters say "снимаю на аналог"; "Плёнка" would collide with the film term. |
| hi | Develop = **डेवलप** (transliteration) | धुलवाना / धुलाई | "रील धुलवाना" is the warm, real-life phrase from the film era, but it means "get it washed" and is unclear as a button. UI uses डेवलप; expressive copy may use "धुलवाना" once for nostalgia. |
| hi | Roll = **रोल** | रील | Many Indians call a film roll "रील", but today "Reel" means Instagram Reels and also appears in our model names (Reel 8, Reel 40). रोल avoids the clash. |
| hi | Undo = **वापस लें** | पूर्ववत करें, अनडू करें | Conversational instead of Sanskritized; "अनडू" is acceptable if testers prefer it. |
| ar | Develop = **التحميض**; lab = **معمل التحميض** (tab **المعمل**) | مختبر | معمل تحميض is the familiar photo-lab term; مختبر sounds scientific. |
| ar | Load film = **إدخال فيلم** | تحميل الفيلم | تحميل is the standard word for "download" in Arabic UIs. |
| ar | **Western digits** (0–9) | Arabic-Indic digits (٠–٩) | Model names keep Western digits; mixing scripts looks broken. Western digits are common in Gulf and Maghreb UIs. If the owner prefers ٠–٩, apply them to all formatted numbers but **never** inside model/film names. |
| all | "9 AM" chip never says "tomorrow" | "Tomorrow 9 AM" | The arrival can be today if the roll is sent before 9 AM (`speed.at.today`). |

---

## 12. Translator checklist

- [ ] Register and pronoun match section 2 (ja です・ます, zh 你, es tú, fr vous, pt você, ru вы lowercase, hi आप, ar neutral).
- [ ] Every `{placeholder}` copied exactly; plural forms supplied for every key in 5.3.
- [ ] Film Camela, camera and film names untouched (section 3).
- [ ] Glossary terms used consistently, especially **Send to lab**, **develop**, **roll**, **darkroom**.
- [ ] No exclamation marks, no hype, no brand names, no push-notification promises.
- [ ] Punctuation conventions: ja/zh full-width; fr non-breaking spaces and « »; es ¿ ¡ paired; ar ، ؛ ؟; hi । only after full sentences; ru « » and ё.
- [ ] Tab bar and toolbar labels fit the budgets in section 8 (test on a 360 px screen).
- [ ] Arabic: checked in RTL with Latin names and signed numbers; no arrow glyphs for direction; "right half" left literal in `cam.halfNext`.
- [ ] Section 9 items changed for your locale (KakaoTalk, iOS/Android menu paths).
- [ ] Read the expressive strings aloud. They should sound like something a thoughtful person would say, not a translation.
