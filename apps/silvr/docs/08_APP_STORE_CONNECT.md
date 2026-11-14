# App Store Connect 입력 자료 (아티움그룹 주식회사)

iPhone 앱을 아티움그룹 주식회사 명의로 올릴 때 입력할 값입니다. 빌드는 Mac(Xcode)에서 `npm run cap:ios` 후 Archive → 업로드(`docs/04_LAUNCH_GUIDE.md` B). 스토어 문안 원문은 `docs/03b_STORE_LISTING_FILM_CAMELA.md`(Film Camela 이름판).

> **계정 (2026-11-02 사장님 확정)**: 스토어·결제·AdMob 계정은 모두 `atiumcompany@gmail.com` 기준입니다. Apple Developer / App Store Connect도 이 주소의 Apple ID로 등록돼 있는지(또는 등록할지) 확인하세요. AdMob 앱(iOS)도 같은 AdMob 계정에 추가합니다. Play 쪽은 개발자 계정 "Muzig AI"(ID 5890194990164154086, `07_PLAY_CONSOLE.md` 0장).
>
> **v1.1 (광고·인앱 결제)**: 아래 2장 가격, 2-1장 인앱 구입, 3장 App Privacy, 3-1장 추적(ATT), 4장 연령 등급, 4-1장 매니페스트가 바뀝니다. 개인정보 처리방침 v1.4가 웹에 먼저 게시돼 있어야 합니다.

## 0. Apple Developer Program — 조직으로 등록
| 항목 | 값 |
|------|----|
| 등록 유형 | **Organization** (개인 아님 — 개인으로 등록하면 판매자 이름이 개인 실명으로 표시됨) |
| 법적 이름 | ATIUM GROUP Co., Ltd. (아티움그룹 주식회사) — D-U-N-S 영문 이름과 똑같이 |
| D-U-N-S 번호 | Play와 같은 번호. 없으면 Apple의 D-U-N-S 조회 도구에서 요청하거나 나이스디앤비에서 발급 |
| 법적 권한 | 대표 정승익(계약 체결 권한자)이 신청하거나, 신청자가 권한을 위임받았다고 확인 |
| 회사 웹사이트 | https://muzig.ai (회사 도메인 이메일로 신청하면 심사가 빠름: play@muzig.ai) |
| 회사 주소·전화 | 경기도 성남시 분당구 판교역로192번길 16, 806호 · 대표 휴대폰 번호(문서에 적지 않음, Apple 확인 전화가 올 수 있음) |
| 연회비 | US$99 |

## 1. 새 앱
> **iPhone 전용** 빌드입니다(`TARGETED_DEVICE_FAMILY = 1`). iPad에서는 iPhone 앱 호환 모드로 실행되며, iPad 스크린샷은 필요 없습니다.
| 항목 | 값 |
|------|----|
| 플랫폼 | iOS |
| 이름 | 필름 카메라 - Film Camela (영어 현지화: Film Camera - Film Camela) — 원문 `03b` 1장 |
| 기본 언어 | 한국어 |
| 번들 ID | `com.filmcamela.app` (Certificates, Identifiers & Profiles에서 먼저 등록) |
| SKU | `SILVR-IOS-001` (내부용, 사용자에게 안 보임 · 앱을 만든 뒤에는 못 바꿔요) |
| 사용자 액세스 | 전체 액세스 |

## 2. 앱 정보
| 항목 | 값 |
|------|----|
| 부제(30자) | 네거티브가 남는 필름 카메라 / The film camera that keeps your negatives |
| 카테고리 | 기본: 사진 및 비디오 · 보조: 라이프스타일(선택) |
| 저작권 | © 2026 ATIUM GROUP Co., Ltd. |
| 판매자 | ATIUM GROUP Co., Ltd. (조직 등록 시 자동 표시) |
| 개인정보 처리방침 URL | `https://silvr.muzig.ai/privacy.html` (웹 배포 후 유효) |
| 지원 URL | `https://silvr.muzig.ai/support.html` (웹 배포 후 유효) |
| 마케팅 URL(선택) | https://muzig.ai |
| 콘텐츠 권한 | 제3자 콘텐츠 없음 |
| 가격 | 무료 (앱 다운로드 무료 · v1.1부터 인앱 구입 있음) |
| 사용권 계약(EULA) | 사용자 지정 EULA 칸에 `https://silvr.muzig.ai/terms.html` 주소를 안내하거나, Apple 표준 EULA를 쓰면 설명 끝에 표준 EULA 링크를 넣기(구독 앱은 설명 또는 EULA 칸에 이용약관 링크가 필수 — 심사 지침 3.1.2) |

## 2-1. 인앱 구입 (v1.1 신규)
먼저 **비즈니스 → 유료 앱 계약(Paid Apps Agreement)** 에 서명하고 은행·세금 정보를 넣어야 인앱 상품이 판매됩니다. 제품 ID는 엔진 코드(`src/monetize/config.ts`)의 값과 정확히 같아야 합니다(아래 표, 2026-11-02 기준).

| 유형 | 제품 ID (`src/monetize/config.ts`) | 참조 이름 | 기간 | 가격(기준) |
|------|------|-----------|------|-----------|
| 자동 갱신 구독 (구독 그룹 "Film Camela Pro") | `filmcamela_pro_week` | Pro 7일 | 1주 | US$4.99 |
| 자동 갱신 구독 (같은 그룹) | `filmcamela_pro_3month` | Pro 3개월 | 3개월 | US$9.99 |
| 비소모성(Non-Consumable) | `filmcamela_pro_lifetime` | Pro 평생 | — | US$19.99 |

- 같은 구독 그룹에 두 구독을 넣어야 업그레이드·다운그레이드가 자동 처리되고 중복 결제가 안 됩니다.
- 상품마다 현지화된 표시 이름·설명(예: "Pro 7일 — 촬영 수 제한·광고 없음"), 심사용 스크린샷(결제 화면), 심사 메모가 필요합니다. 첫 인앱 상품은 **앱 바이너리와 함께 심사에 제출**해야 합니다.
- 결제 화면(앱 안)에 반드시 보여야 할 것(심사 지침 3.1.2): 상품 이름, 기간, 가격(기간당), 자동 갱신 안내, **개인정보 처리방침·이용약관 링크**, **구매 복원** 버튼. 평생 이용권(비소모성)이 있으므로 구매 복원 버튼은 필수입니다.
- 심사 메모(v1.1): "무료 이용자는 하루 10장 촬영, MY 탭의 보상형 광고(Google AdMob)로 10장씩 추가(하루 10회). Pro(구독 2종·평생)는 제한과 광고를 없앰. 계정·서버 없음. 샌드박스 계정으로 MY 탭 → Pro에서 구매·구매 복원 확인 가능."

## 3. 앱 개인정보 보호 (App Privacy) — v1.1부터 바뀜
v1.0의 "데이터를 수집하지 않음"은 **더 이상 쓸 수 없습니다.** Google Mobile Ads SDK가 광고를 볼 때 데이터를 Google로 보내기 때문입니다.

근거: Google의 AdMob 공식 안내 "Prepare for Apple's App Store data disclosure requirements"(iOS SDK 7.68.0 기준, 2026-10-30 갱신) — https://developers.google.com/admob/ios/privacy/data-disclosure . 나열된 항목: IP 주소(대략적인 위치 추정), 충돌 로그, 성능 데이터, 기기 ID(광고 식별자 등), 광고 데이터(본 광고), 기타 제품 상호작용(앱 실행, 탭, 동영상 시청). Google 페이지는 "사용자에게 연결됨"·"추적에 사용됨" 분류를 명시하지 않으므로, 아래는 **보수적으로 고른 권장 답**입니다(처리방침 v1.4와 일치).

"귀하 또는 타사 파트너가 이 앱에서 데이터를 수집합니까?" → **예**

| 데이터 유형 (App Store Connect 이름) | 목적 | 사용자에게 연결 | 추적에 사용 |
|------|------|------|------|
| 위치 → **대략적인 위치(Coarse Location)** — IP로 추정 | 타사 광고 · 분석 | 아니요 | 아니요 |
| 식별자 → **기기 ID(Device ID)** — IDFA(허용 시), 앱/개발자 범위 식별자 | 타사 광고 · 분석 | 예 | **예** (ATT 사용 시) |
| 사용 데이터 → **광고 데이터(Advertising Data)** | 타사 광고 · 분석 | 예 | **예** (ATT 사용 시) |
| 사용 데이터 → **제품 상호작용(Product Interaction)** | 타사 광고 · 분석 | 예 | 아니요 |
| 진단 → **충돌 데이터(Crash Data)** | 분석 · 앱 기능 | 아니요 | 아니요 |
| 진단 → **성능 데이터(Performance Data)** | 분석 · 타사 광고 | 예 | 아니요 |

- **신고하지 않는 것**: 사진·동영상, 정밀 위치(촬영 노트 좌표는 기기에만), 구매 내역(Apple이 처리, 앱은 거래 정보를 기기에만 두고 운영자 서버로 보내지 않음 → 기기 안에서만 처리되는 데이터는 "수집" 아님), 연락처·이메일(문의 메일은 앱 밖).
- 현재 엔진(`src/monetize/ads.ts`)은 처음 "광고 보기"를 누를 때 ATT 창을 띄웁니다 → 위 표대로 "추적에 사용: 예"(기기 ID·광고 데이터). 나중에 ATT를 빼면 "추적에 사용"을 모두 "아니요"로 바꾸세요.
- 엔진은 MY 탭에서 "광고 보기"를 처음 누르기 전까지 UMP 조회·SDK 시작·미리 불러오기를 하지 않고, Google 앱 측정 자동 시작도 미룹니다(`GADDelayAppMeasurementInit`). 광고를 한 번도 안 본 이용자는 Google 광고·동의 서버와 통신하지 않습니다(처리방침 v1.4 4항). App Store 라벨은 "광고를 볼 때 수집"을 따로 구분하지 않으므로 위 표 그대로 신고합니다.
- Xcode → Archive → Generate Privacy Report로 SDK 매니페스트 합계를 뽑아 위 답과 대조하세요.

## 3-1. 추적(App Tracking Transparency) — 현재 엔진이 ATT를 씀
- `@capacitor-community/admob`의 `requestTrackingAuthorization()`(또는 AdMob UMP의 IDFA 설명 메시지 후 ATT 창)를 쓰면 App Privacy에서 **"추적에 사용되는 데이터: 예"** 로 답해야 합니다(위 표의 기기 ID·광고 데이터).
- ATT 창은 설치당 한 번만 뜹니다. 거부해도 광고는 나오며 IDFA만 보내지 않습니다(Google 안내: https://developers.google.com/admob/ios/privacy/idfa). 거부했다고 기능을 막거나 보상을 주면 안 됩니다(심사 지침 5.1.1·3.2.2).
- `Info.plist`에 필요한 키: `NSUserTrackingUsageDescription`(아래 문구), `GADApplicationIdentifier`(AdMob iOS 앱 ID), `SKAdNetworkItems`(Google 목록 그대로). `AppTrackingTransparency` 프레임워크 연결.
- **`NSUserTrackingUsageDescription` 문구** (기본 `Info.plist`는 영어, 한국어는 `ko.lproj/InfoPlist.strings`):
  - 한국어: `허용하면 Google AdMob이 이 기기의 광고 식별자로 나에게 더 맞는 광고를 보여 줄 수 있어요. 허용하지 않아도 광고 보상과 모든 무료 기능은 똑같아요. 사진은 기기 밖으로 나가지 않아요.`
  - English: `If you allow this, Google AdMob can use this device's advertising identifier to show you more relevant ads. Ad rewards and every free feature work the same either way. Your photos never leave your device.`
  - 버튼을 누르도록 유도하는 문구("허용을 눌러 주세요", 보상 약속)는 넣지 않습니다.
  - 현재 `ios/App/App/Info.plist`에는 엔진 담당이 넣은 한·영 한 줄 문구("무료 촬영 충전을 위해 직접 고른 광고를 더 관련성 있게 보여 주는 데만 사용해요…")가 있습니다. 심사에서 "누가 무엇을 추적하는지"를 분명히 하도록 위 문구(Google AdMob·광고 식별자 명시)로 바꾸고, 한국어는 `ko.lproj/InfoPlist.strings`로 나누는 것을 권장합니다. "충전을 위해"는 ATT 허용이 보상 조건처럼 읽힐 수 있어 빼는 편이 안전합니다(허용 여부와 보상은 무관).

## 4. 연령 등급 설문
폭력·성적 콘텐츠·욕설·약물·도박·공포 모두 "없음", 무제한 웹 접근 "아니요", 사용자 생성 콘텐츠 공유 기능 "아니요" → **4+** (v1.1에서도 같음). 설문에 **광고(Advertising)** 항목이 있으면 "예"로 답하세요. 인앱 구입 여부는 등급이 아니라 스토어 페이지의 "앱 내 구입" 표시로 나타납니다. AdMob → 차단 관리에서 최대 광고 콘텐츠 등급을 **G** 또는 **PG**로 두어 4+ 앱에 맞추세요.

## 4-1. 개인정보 매니페스트 (`ios/App/App/PrivacyInfo.xcprivacy`)
앱 타깃 리소스에 들어 있습니다. v1.1에서 다음처럼 바꿨습니다(2026-11-02):
- `NSPrivacyTracking` = **true** — 엔진이 ATT 허용 후 IDFA를 Google AdMob에 넘기므로(추적).
- `NSPrivacyTrackingDomains` = **빈 배열 유지**. 추적 도메인은 Google Mobile Ads SDK가 자기 매니페스트(`GoogleMobileAds.xcframework`의 `PrivacyInfo.xcprivacy`)에 선언하고, Apple은 SDK와 앱 매니페스트를 합쳐서 봅니다. 앱 코드 자체는 추적 도메인에 접속하지 않으므로 같은 도메인을 앱 쪽에 또 적지 않습니다. iOS 17+는 ATT 거부 시 선언된 추적 도메인 연결을 자동 차단합니다.
- `NSPrivacyCollectedDataTypes` = 3장 표와 같은 6가지(대략적인 위치, 기기 ID, 광고 데이터, 제품 상호작용, 충돌 데이터, 성능 데이터)를 Google 안내대로 넣음. 엄밀히는 SDK가 수집하는 항목이라 SDK 매니페스트에도 있지만, App Store Connect 답변과 앱 매니페스트를 일치시켜 심사 혼선을 줄이려고 앱 쪽에도 적었습니다.
- `NSPrivacyAccessedAPITypes`: 기존 `@capacitor/filesystem`의 파일 시각 API(`NSPrivacyAccessedAPICategoryFileTimestamp` / `C617.1`) 그대로.
- 출시 전 Xcode → Archive → **Generate Privacy Report**로 앱+SDK 합계를 뽑아 3장 App Privacy 답과 대조하세요. 플러그인을 추가하면 그 README의 요구 사항을 이 파일에 더하세요.

## 5. 수출 규정(암호화)
`Info.plist`에 `ITSAppUsesNonExemptEncryption = false`가 이미 들어 있어 업로드 때마다 묻지 않습니다(표준 HTTPS 외 암호화 없음).

## 6. 버전 1.0.0 정보
| 항목 | 값 |
|------|----|
| 프로모션 텍스트·설명·키워드 | `03_STORE_LISTING.md` |
| 스크린샷 | 6.7"(1290×2796) `ios67-ko-framed/`·`ios67-en-framed/` 6장. 6.5"는 6.7"로 대체 가능 |
| 이 버전의 새로운 기능 | 첫 출시 — `07_PLAY_CONSOLE.md`의 출시 노트와 같은 문구 |
| 심사 연락처 | 정승익 · play@muzig.ai · 대표 휴대폰 번호(입력 시 직접 기입) |
| 로그인 필요 | 아니요 |
| 심사 메모 | 1.0: `03_STORE_LISTING.md`의 "심사 메모" (로그인 없음, 오프라인 동작, 카메라 거부 시 불러오기로 확인 가능, 결제 없음) · **1.1: 2-1장의 심사 메모로 교체**("결제 없음" 삭제, 광고·Pro·샌드박스 구매 복원 안내) |

## 7. 출시 전에 Mac에서 확인할 것
- Xcode Signing & Capabilities: Team = ATIUM GROUP Co., Ltd., 번들 ID `com.filmcamela.app`
- 실제 iPhone에서 카메라·사진 저장("이미지 저장")·백업 공유 시트("파일에 저장") 확인(`docs/05_QA_REPORT.md` 남은 항목)

## 판매 국가 (상표 위험)

App Store Connect는 기본값이 **모든 국가**입니다. [가격 및 사용 가능 여부]에서 **대한민국**(원하면 미국 추가)만 선택하세요.
EU·호주는 같은 이름의 등록 상표(9류)가 있어 위험도가 중간~높음입니다(`06_TRADEMARK_SEARCH.md`). Play도 같은 기준으로 한국부터 엽니다(`07_PLAY_CONSOLE.md`).
