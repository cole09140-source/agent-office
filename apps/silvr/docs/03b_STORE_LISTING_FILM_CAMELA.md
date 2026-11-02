# Film Camela 스토어 등록 문안 (SILVR → Film Camela 이름 변경판)

> 새 이름 **Film Camela**용 문안입니다. 기존 `03_STORE_LISTING.md`(SILVR)는 그대로 두고, 이름 변경을 확정하면 이 문서 기준으로 Play Console·App Store Connect에 옮겨 적으세요.
> 근거: `src/i18n.ts`, `src/cameras/models.ts`, `src/cameras/pins.ts`, `src/film/stocks.ts`, `src/entitlements.ts`(v1.0 결제 없음, 전 기능 무료), `public/privacy.html` v1.3.

## 0. 채워 넣을 값 (토큰)

| 토큰 | 뜻 | 세는 법 | 작성 시점 값 (2026-11-01) |
|------|----|---------|------------------|
| `{{CAMERA_COUNT}}` | 카메라 바디 수 | `CAMERAS.length` (`src/cameras/models.ts`) | 22 |
| `{{FILM_COUNT}}` | 필름 + 디지털 센서 수 | `STOCKS.length` (`src/film/stocks.ts`) — 필름 17 + 센서 3(CCD·Pixel·Toy CMOS) | 20 |

- 아래 글자 수는 **두 토큰을 두 자리 숫자로 바꿨을 때** 기준입니다(예: 22, 20). 숫자가 한 자리가 되면 1자씩 줄어요.
- 다른 에이전트가 바디를 추가하는 중이라, 출시 직전에 위 두 값을 다시 세어 문서 전체를 일괄 치환하세요.
- **Sprocket 35**(필름 구멍까지 찍히는 파노라마)를 빼기로 하면, 설명의 "필름 구멍까지 찍히는 스프로킷 파노라마" / "a panorama that shoots over the sprocket holes" 구절만 지우면 됩니다.
- 글자 수 세는 법: 유니코드 글자 단위(한글 1음절 = 1자, 공백·줄바꿈·기호 포함). 두 스토어의 입력 칸도 글자 단위로 셉니다(키워드는 아래 참고).

## 1. 기본 정보 (변경분만)

| 항목 | 값 |
|------|----|
| 앱 이름 (KO) | Film Camela – 필름 카메라 (20/30자) |
| 앱 이름 (EN) | Film Camela – Analog Camera (27/30) |
| 패키지 / 번들 ID | `app.silvr.camera` 그대로 (스토어에 노출되지 않음, 첫 업로드 후 변경 불가) |
| 가격 | 무료 · 광고 없음 · 인앱 결제 없음 (v1.0) |
| 개인정보 라벨 | 데이터 수집 안 함 / Data Not Collected (아래 6장) |

---

## 2. 한국어

### Google Play

**앱 이름** — 20/30자
```
Film Camela – 필름 카메라
```

**간단한 설명** — 45/80자
```
롤로 아껴 찍고, 현상소에서 기다리고, 다크룸에서 다시 현상하는 필름 카메라예요.
```

**자세한 설명** — 1384/4000자
```
Film Camela는 필름처럼 찍고, 현상소에서 기다리고, 암실처럼 다시 현상하는 카메라예요.

■ 한 롤씩, 한 장씩
카메라를 고르고 필름을 넣으면 남은 장수가 하나씩 줄어요. 카메라마다 10~99장. 마구 찍고 지우는 대신, 한 장을 고르는 즐거움을 되찾아 보세요.

■ 현상소는 왜 있나요?
다 찍은 롤은 현상소로 보내요. 받아볼 시간은 직접 골라요: 즉시 · 1시간 · 아침 9시 · 3일.
· 어떤 사진이 나올지 기다리는 동안 설레요. 진짜 필름처럼요.
· 결과를 바로 못 보니, 찍을 때는 화면보다 눈앞의 순간에 집중하게 돼요.
· 기다리기 싫다면 '즉시'를 고르거나, 현상 중에도 '지금 바로 현상'을 누르면 돼요.
· 인스턴트 카메라와 디지털 카메라는 현상소 없이 바로 확인해요.

■ {{CAMERA_COUNT}}대의 카메라, 저마다 다른 촬영 방식
· 35mm SLR, 레인지파인더, 거리 스냅용 컴팩트
· 27장 일회용: 플래시는 매번 충전해요
· 방수 일회용 Aqua 27: 물속처럼 청록빛이 도는 사진
· 정사각·와이드 인스턴트: 찍으면 사진이 나와 서서히 떠올라요
· 위에서 내려다보는 이안 리플렉스 Twin 66: 6×6 정사각 12장
· 두 번 눌러 한 장이 되는 하프프레임, 렌즈 4개가 연속으로 찍는 4렌즈 카메라, 첫 장 위에 겹쳐 찍는 이중 노출
· 180° 어안, 2.39:1 시네마스코프, 65:24 파노라마, 필름 구멍까지 찍히는 스프로킷 파노라마
· 8mm 홈무비의 한 프레임, 하얀 마운트에 담기는 슬라이드, 강한 정면 플래시의 Party Flash
· 2003년 디카, 0.3메가 어린이 디카, 4색 픽셀 카메라
자주 쓰는 카메라는 고정해 두면 목록 맨 앞에 보여요.

■ 오리지널 필름·센서 {{FILM_COUNT}}종
따뜻한 Sunny 200, 인물용 Muse 400, 흑백 Mono 400, 네온 아래 붉게 번지는 Neon 800T, 쨍한 슬라이드 Velvet 50, 1998년에 만료된 Expired '98까지. 카메라마다 넣을 수 있는 필름이 달라요.

■ 다크룸에서 다시 현상
원본 네거티브는 지워지지 않아요. 찍은 뒤에도 필름을 바꾸고 증감현상(±2스톱), 만료 정도, 입자, 할레이션, 빛샘, 테두리를 조절해 새로 현상할 수 있어요. 롤 전체에 한 번에 적용할 수도 있어요.

■ 밀착 인화
롤 하나를 35mm 스트립으로 엮은 한 장으로 저장하고 공유해요.

■ 실제 필름 카메라를 위한 도구
Sunny 16 노출 계산기와 컷별 촬영 노트(CSV 내보내기). 필름 카메라를 처음 들었을 때도 든든해요.

■ 내 사진은 내 기기에만
계정, 서버, 광고, 추적이 없어요. 사진과 기록은 기기 안에만 저장되고 워터마크도 붙지 않아요. 기기를 바꿀 때는 백업 파일(.zip)로 옮기면 돼요.

카메라 권한을 허용하지 않아도 갤러리 사진을 불러와 현상할 수 있어요.
```

**출시 노트 (1.0.0)** — 153/500자
```
Film Camela 첫 출시예요.
· 카메라 {{CAMERA_COUNT}}대, 필름·센서 {{FILM_COUNT}}종
· 현상소에서 기다리거나 '즉시'로 바로 받아보기
· 다크룸 재현상, 밀착 인화
· Sunny 16 노출 계산기와 촬영 노트
· 자주 쓰는 카메라 고정
· 계정·광고·추적 없이 사진은 기기에만 저장돼요
```

### App Store

**이름** — 20/30자
```
Film Camela – 필름 카메라
```

**부제** — 19/30자
```
롤로 아껴 찍고 기다리는 감성 필카
```
> "필카"·"감성"은 검색량이 많은 말이라 부제에 넣었어요(부제도 검색에 반영됨). 그래서 키워드 칸에서는 뺐습니다.

**프로모션 텍스트** — 85/170자
```
한 장씩 아껴 찍고, 현상소에서 설레며 기다려요. 기다리기 싫으면 즉시 현상도 돼요. 원본 네거티브가 남아 언제든 다른 필름으로 다시 현상할 수 있어요.
```

**설명** — Google Play "자세한 설명"과 같은 글을 그대로 씁니다 (1384/4000자).

**키워드** — 87/100자 · 22개 · UTF-8 211바이트
```
일회용,인스턴트,즉석사진,빈티지,레트로,흑백,아날로그,현상,암실,다크룸,노출계,디카,하프프레임,이중노출,어안,파노라마,방수,빛샘,입자,필터,35mm,밀착인화
```
- 이름·부제에 이미 있는 말(Film, Camela, 필름, 카메라, 필카, 감성 등)은 넣지 않았어요. 다른 회사 상표 없음.
- 쉼표 뒤 공백 없음. App Store Connect가 길이 초과로 거부하면 뒤에서부터(밀착인화, 35mm, 필터…) 지우세요.

**이 버전의 새로운 기능** — Google Play 출시 노트와 같음 (153/4000자)

### 스크린샷 문구 (각 30자 이내)

| # | 화면 | 문구 | 글자 수 |
|---|---|---|---|
| 1 | 카메라 · 뷰파인더 | 뷰파인더로 보고, 한 장씩 아껴서 | 18/30 |
| 2 | 카메라 선반 · 고정 핀 | 카메라 {{CAMERA_COUNT}}대, 아끼는 건 맨 앞에 | 19/30 |
| 3 | 현상 속도 고르기 | 언제 받아볼지 직접 골라요 | 14/30 |
| 4 | 현상 완료된 롤 | 현상 완료! 롤을 열어 봐요 | 15/30 |
| 5 | 다크룸 | 찍은 뒤에도 필름을 바꿔 다시 현상 | 19/30 |
| 6 | 밀착 인화 | 한 롤을 밀착 인화 한 장으로 | 16/30 |
| 7 | 아날로그 · 노출계/촬영 노트 | 진짜 필카엔 노출계와 촬영 노트 | 17/30 |
| 8 | 개인정보 | 계정 없이, 사진은 내 기기에만 | 17/30 |

---

## 3. English

### Google Play

**App name** — 27/30
```
Film Camela – Analog Camera
```
> "Film Camela – Film Camera" would repeat "Film"; "Analog Camera" adds a search term instead.

**Short description** — 76/80
```
Shoot a roll, wait for the lab, re-develop anytime. Your negatives are kept.
```

**Full description** — 2553/4000
```
Film Camela shoots like film, makes you wait for the lab, and develops like a darkroom.

ONE ROLL AT A TIME
Pick a camera, load a roll and watch the counter go down: 10 to 99 shots depending on the camera. No spraying and deleting. Every frame counts again.

WHAT'S THE LAB FOR?
When a roll is finished, you send it to the lab and pick when it comes back: instant, 1 hour, next 9 AM or 3 days.
• The wait is the fun part. You don't know exactly what you got until the roll comes back, just like real film.
• Since you can't check every shot, you look at the moment instead of the screen.
• In a hurry? Pick Instant, or tap "Develop now" while a roll is still in the lab.
• Instant and digital cameras skip the lab. Their shots are ready right away.

{{CAMERA_COUNT}} CAMERAS, EACH WITH ITS OWN QUIRKS
• A 35mm SLR, a quiet rangefinder and a street compact
• A 27-shot disposable: charge the flash before every flash shot
• Aqua 27, a waterproof disposable with that blue-green underwater cast
• Square and wide instant cameras: prints eject and slowly appear
• Twin 66, a twin-lens reflex you look down into: 12 square 6×6 frames
• Half-frame pairs, a 4-lens action camera and double exposures
• A 180° fisheye, 2.39:1 anamorphic scope, 65:24 panoramas and a panorama that shoots over the sprocket holes
• A frame from an 8mm home movie, slides in white mounts, and Party Flash with its harsh direct flash
• A 2003 digicam, a 0.3 MP kids' camera and a 4-color pixel camera
Pin the ones you use most and they stay at the front of the line-up.

{{FILM_COUNT}} ORIGINAL FILM STOCKS AND SENSORS
Warm Sunny 200, portrait-friendly Muse 400, gritty Mono 400 black & white, tungsten Neon 800T with red glow around neon, punchy Velvet 50 slide film and the unpredictable Expired '98. Each camera takes its own set of films.

RE-DEVELOP IN THE DARKROOM
Your original negatives are never thrown away. After the shot you can still change the film stock, push or pull ±2 stops, and adjust expiry, grain, halation, light leaks and borders. Apply it to one frame or the whole roll.

CONTACT SHEETS
Save and share a whole roll as one sheet of 35mm strips.

TOOLS FOR YOUR REAL FILM CAMERA
A Sunny 16 exposure calculator and a frame-by-frame shooting log with CSV export. Handy if you're just getting into film.

YOUR PHOTOS STAY ON YOUR PHONE
No account, no servers, no ads, no tracking, no watermark. Photos and logs are stored only on your device. Moving to a new phone? Take a backup file (.zip) with you.

No camera permission? You can still import photos from your gallery and develop them.
```

**Release notes (1.0.0)** — 296/500
```
Film Camela's first release.
• {{CAMERA_COUNT}} cameras and {{FILM_COUNT}} film stocks and sensors
• Wait for the lab, or pick Instant and see your roll now
• Darkroom re-develop and contact sheets
• Sunny 16 calculator and shooting log
• Pin your favorite cameras
• No account, ads or tracking. Photos stay on your device
```

### App Store

**Name** — 27/30
```
Film Camela – Analog Camera
```

**Subtitle** — 29/30
```
Shoot a roll, wait for prints
```

**Promotional text** — 160/170
```
Make every frame count, then wait for the lab like it's real film, or skip the wait with Instant. Your negatives are kept, so you can re-develop any shot later.
```

**Description** — same text as the Google Play full description (2553/4000).

**Keywords** — 100/100 · 12 terms
```
disposable,instant,vintage,retro,35mm,darkroom,grain,fisheye,double exposure,light meter,sunny16,b&w
```
- No words already in the name/subtitle (film, camela, analog, camera, shoot, roll, wait, prints), no third-party trademarks, no space after commas.

**What's New** — same as the Play release notes (296/4000).

### Screenshot captions (≤ 30 each)

| # | Screen | Caption | Chars |
|---|---|---|---|
| 1 | Camera · viewfinder | Frame it. Make it count. | 24/30 |
| 2 | Camera line-up · pins | {{CAMERA_COUNT}} cameras. Pin your favorites | 30/30 |
| 3 | Lab speed choice | You choose when prints arrive | 29/30 |
| 4 | Developed roll | Your roll is back from the lab | 30/30 |
| 5 | Darkroom | Change the film after the shot | 30/30 |
| 6 | Contact sheet | One roll, one contact sheet | 27/30 |
| 7 | Analog · meter / log | A meter and log for real film | 29/30 |
| 8 | Privacy | No account, no cloud, no ads | 28/30 |

---

## 4. "현상소는 뭐 하는 곳이에요?" — 문안용 설명

설명 본문에 이미 들어 있는 블록입니다. 그래픽 이미지·FAQ·지원 페이지에 따로 써도 됩니다.

**한국어** (236자)
```
■ 현상소는 왜 있나요?
다 찍은 롤은 현상소로 보내요. 받아볼 시간은 직접 골라요: 즉시 · 1시간 · 아침 9시 · 3일.
· 어떤 사진이 나올지 기다리는 동안 설레요. 진짜 필름처럼요.
· 결과를 바로 못 보니, 찍을 때는 화면보다 눈앞의 순간에 집중하게 돼요.
· 기다리기 싫다면 '즉시'를 고르거나, 현상 중에도 '지금 바로 현상'을 누르면 돼요.
· 인스턴트 카메라와 디지털 카메라는 현상소 없이 바로 확인해요.
```

**English** (489)
```
WHAT'S THE LAB FOR?
When a roll is finished, you send it to the lab and pick when it comes back: instant, 1 hour, next 9 AM or 3 days.
• The wait is the fun part. You don't know exactly what you got until the roll comes back, just like real film.
• Since you can't check every shot, you look at the moment instead of the screen.
• In a hurry? Pick Instant, or tap "Develop now" while a roll is still in the lab.
• Instant and digital cameras skip the lab. Their shots are ready right away.
```

사장님 질문("현상소는 왜 있어?")에 대한 한 줄 답: **찍은 결과를 바로 못 보게 해서 진짜 필름의 설렘과 '한 장의 무게'를 살리는 장치예요. 원치 않으면 '즉시'로 건너뛰고, 인스턴트·디지털 카메라는 처음부터 현상소를 거치지 않아요.**

- 근거: 롤 시트의 "현상소로 보내기"로 현상소에 감(`cam.rewind`·`lab.emptyHint`), 속도 4가지(`speed.*`), 현상 중 "지금 바로 현상"(`lab.rush`), `instant: true` 바디(정사각·와이드 인스턴트, CCD 2003, Bit Pocket, KidCam 0.3)는 바로 확인.
- 푸시 알림 기능은 없어요(앱 안 토스트만). 그래서 문안에 "알림이 와요"는 쓰지 않았습니다.

---

## 5. 문안 원칙 점검

| 항목 | 결과 |
|------|------|
| "1위·최고·No.1·best" 같은 순위·성과 주장 | 없음 (생성 스크립트로 검사) |
| 다른 브랜드 이름 (Huji, Gudak, Kodak, Fujifilm, Polaroid, Instax, Lomo 등) | 없음 |
| 앱 이름·간단한 설명에 가격/할인 문구 | 없음 ("무료"는 쓰지 않음) |
| 키워드 나열식 문장 | 없음 — 기능 설명 속에서만 단어가 나옴 |
| 사실 확인 | 장수 10~99(`capacities`), 증감현상 ±2스톱, 플래시 충전(`flash: 'charge'`), 6×6 12장(Twin 66), 0.3메가·640px(KidCam), 4색 팔레트(Pixel) — 모두 코드 기준 |
| 일부러 뺀 이름 | 앱 속 이름 중 남의 상표를 떠올리게 할 수 있는 **Insta SQ / Insta W / Insta Mini / Insta Wide**(Instax), **X-Pro 200**(후지필름 X-Pro), **Super 8**(형식 이름이지만 원래 코닥 규격), **Pixel Pocket**(Google Pixel)은 스토어 문안에서 일반 명칭으로 바꿔 썼어요. 앱 화면 이름도 2026-11-01에 **Pop SQ / Pop W / Pop 600 / Pop Mini / Pop Wide / Cross 200 / Reel 8 / Bit Pocket**으로 바꿨어요(내부 id는 그대로). |

---

## 6. 데이터 보안 (Play) / 앱 개인정보 보호 (App Store)

**답은 그대로 "수집하지 않음 / Data Not Collected"** 입니다. `public/privacy.html` v1.3(시행 2026-11-01)와 코드로 확인했어요.

| 확인한 것 | 결과 |
|-----------|------|
| 앱 코드의 외부 통신 | 없음 — `src/` 전체에 `fetch`·외부 URL 없음. 의존성은 Capacitor(app·core·filesystem·share)·Preact뿐, 분석·광고·로그인 SDK 없음 |
| 사진·네거티브·노트·설정 | 기기 안(IndexedDB)에만 저장 → 기기 내 처리라 "수집" 아님 |
| 위치(선택) | 사용자가 켠 컷에만 좌표를 **기기에** 기록. CSV·백업(.zip)은 사용자가 직접 내보내는 파일 → 수집 아님 |
| 공유 | 사용자가 누를 때 운영체제 공유 시트로만 → "공유(제3자 제공)" 아님 |
| 동작·방향 센서 | 회전 보정에만 쓰고 저장·전송 안 함 |
| 문의 메일 | 사용자가 앱 밖에서 직접 보내는 이메일 → 앱이 수집하는 데이터 아님 |
| 웹 호스팅 접속 기록(Vercel) | **웹(브라우저) 버전**의 서버 로그 → 스토어 앱(Android·iOS) 데이터가 아님. 앱은 국외 이전 없음(방침 4항) |
| Android 자동 백업 | `allowBackup=false` (07 문서) → Google Drive로 안 올라감 |

Play 데이터 보안 설문: "필수 사용자 데이터 유형을 수집하거나 공유하나요?" → **아니요**. 데이터 삭제: 설정 → 모든 데이터 삭제 또는 앱 삭제.
App Store: **Data Not Collected**, 추적 없음 (`PrivacyInfo.xcprivacy`와 일치).

### 이름 변경 반영 현황 (2026-11-01 앱에 반영됨)
- `public/privacy.html`·`terms.html`·`support.html`·`licenses.html` 본문의 앱 이름 → "Film Camela". 개인정보 처리방침은 v1.3(시행 2026-11-01, 변경 내용: 앱 이름 변경, 처리 내용은 그대로).
- 앱 안 문자열: 스플래시·온보딩 로고("FILM CAMELA"), 공유 제목(`share.title`), 오류 문구, 갤러리 저장 폴더 `Pictures/Film Camela`(`GalleryPlugin.java`), 파일 이름(`FilmCamela_…`), 밀착 인화·필름 테두리 라벨("FILM CAMELA …"), 런처 이름(Android `app_name`, iOS `CFBundleDisplayName`, PWA `short_name`).
- 그대로 둔 것: 패키지/번들 ID `app.silvr.camera`, 웹 주소 `silvr.muzig.ai`, 저장소(IndexedDB) 이름, 백업 형식 id `silvr-backup` — 사용자에게 보이지 않고, 바꾸면 기존 데이터·업데이트가 끊겨요.
- 개인정보 처리방침 URL `silvr.muzig.ai`는 동작만 하면 그대로 써도 되지만, 새 이름에 맞는 주소를 쓸지는 결정이 필요해요.
