# 11. 수익화 (v1.1) — 하루 무료 촬영 · 보상형 광고 · Pro

> 기준일 2026-11-02 · 앱 `com.filmcamela.app` · 버전 1.1.0 (Android versionCode 2 / iOS build 2)
> 엔진 코드: `src/monetize/` (화면 없음 — MY 탭은 UI 담당이 이 API 위에 만들어요)
> **모든 스토어·광고 계정은 Google 계정 `atiumcompany@gmail.com` 하나로 해요.**
> Play Console 조직 "Muzig AI"(개발자 ID 5890194990164154086) · Google 결제 프로필 · AdMob 모두 같은 계정이에요.

---

## 1. 규칙 (사장님 결정)

| 항목 | 내용 |
|------|------|
| 무료 사용자 | 하루 **10장** 무료 촬영. 기기의 **현지 자정**에 다시 10장 |
| 1장의 기준 | 셔터를 눌러 실제로 찍힌 한 번. 하프 프레임·이중 노출은 **누를 때마다 1장**, 4분할(쿼드)은 한 번 누르면 1장 |
| 세지 않는 것 | 사진 **불러오기**(가져오기), 타이머 취소·앱 전환으로 안 찍힌 셔터, 저장에 실패한 셔터(자동 환불) |
| 보상형 광고 | MY 탭에서 광고 1편을 끝까지 보면 **+10장**. 하루 최대 **10편** |
| 광고로 받은 장수 | 자정에 사라지지 않고 **계속 남아요**. 무료 10장을 먼저 쓰고, 그다음 광고로 받은 장수를 써요 |
| Pro | **무제한 촬영 + 광고 없음**. 주간 구독 / 3개월 구독 / 평생 이용권 |
| 필름·카메라 | 지금은 **모두 무료**(필름·카메라에 유료 잠금 없음, PRO 배지도 숨김) |
| 웹(PWA) | 스토어 결제·광고 없음 → **하루 10장만**. 엔진이 `canBuy=false`, `canWatchAds=false` 를 알려 주니 UI는 "앱 받기"를 보여 주면 돼요 |

### 시계 조작 방지
- 기기 시계를 **앞날로 돌렸다가 되돌려도** 무료 장수·광고 횟수가 다시 채워지지 않아요(저장된 날짜는 앞으로만 가요).
- 시계를 과거로 돌리면 이미 쓴 장수는 그대로 "쓴 상태"로 남아요. 진짜 다음 자정이 지나야 다시 10장.
- 날짜가 30일 넘게 미래로 잘못 저장돼 있으면(고장 난 시계) 오늘 날짜로 다시 맞추되, 쓴 장수는 되돌리지 않아요. 덕분에 시계가 한때 크게 틀렸던 폰도 영영 막히지는 않아요.
- 단, 이 "다시 맞추기"는 설치당 **3번까지**예요. 오늘 ↔ 먼 미래를 왔다 갔다 해서 무료 장수를 계속 채우는 꼼수를 막기 위해서예요(3번을 다 쓰면 저장된 미래 날짜가 지나야 무료 10장이 다시 생겨요. 광고로 받은 장수는 그대로 쓸 수 있어요).
- 서버가 없어서 완벽한 방지는 불가능해요. 목표는 "귀찮아서 안 하는 수준"이에요.

### 서버 없음 (개인정보 약속)
- 계정·로그인·자체 서버·RevenueCat 같은 외부 서버 **없음**.
- Pro 여부는 **기기에서 스토어에 직접 물어봐요**(Android Google Play Billing / iOS StoreKit 2). 결과는 기기 안(IndexedDB)에 저장해 오프라인에서도 써요.
- 앱을 켤 때와 앱으로 돌아올 때(1분 간격 제한) 스토어에 다시 확인해요. 환불·만료되면 그때 Pro가 꺼져요.
- 오프라인일 때 저장된 Pro를 믿는 기간: 평생 이용권은 계속, 구독은 만료일 + 3일(iOS) 또는 마지막 확인 + 3일(Android는 기기에서 만료일을 주지 않아요).

### 광고는 "선택"이에요 (개인정보)
- 사용자가 MY에서 **"광고 보고 충전"을 처음 누르기 전에는 광고 SDK가 아무것도 하지 않아요.** Google 광고·동의 서버에 연결하지 않고, SDK도 시작하지 않아요(Google 측정 자동 시작도 `DELAY_APP_MEASUREMENT_INIT` / `GADDelayAppMeasurementInit` 로 미뤄 둠).
- 처음 누르면 순서대로: ① (유럽·영국 등 필요한 지역이면) Google UMP 동의 창 → ② iOS 추적 허용(ATT) 창 → ③ 광고 SDK 시작 → ④ 광고.
- 한 번이라도 광고를 본 사용자는 그다음 실행부터 시작할 때 동의 정보를 조용히 갱신해요(Google 권장).
- 동의를 거부하면 그 실행 동안은 광고를 띄우지 않아요. ATT를 거부해도 광고·보상은 똑같아요(IDFA만 안 보냄).
- **보상은 광고 SDK의 "보상 획득" 콜백이 왔을 때만** 줘요. 중간에 닫으면 0장.
- Pro 사용자에게는 광고를 절대 띄우지 않아요.

---

## 2. 상품 ID와 가격

| 상품 | ID (Play·App Store 똑같이) | 종류 | 기간 | 기준 가격 |
|------|------|------|------|------|
| 주간 Pro | `filmcamela_pro_week` | 자동 갱신 구독 | 1주 (Play 기본 요금제 ID `p1w`, 결제 주기 P1W) | US$4.99 |
| 3개월 Pro | `filmcamela_pro_3month` | 자동 갱신 구독 | 3개월 (Play 기본 요금제 ID `p3m`, 결제 주기 P3M) | US$9.99 |
| 평생 Pro | `filmcamela_pro_lifetime` | 일회성(비소모성) | 영구 | US$19.99 |

- 앱은 가격을 코드에 적지 않아요. **스토어가 돌려주는 현지 가격 문자열**(예: ₩6,500)을 그대로 보여 줘요.
- ID·기본 요금제 ID는 **한 번 만들면 못 바꿔요.** 아래와 정확히 똑같이 만들어 주세요(코드: `src/monetize/config.ts` 의 `PRODUCTS`).

---

## 3. Google Play Console (atiumcompany@gmail.com)

### 3-0. 먼저 할 것
1. Play Console(조직 "Muzig AI") → 앱 `com.filmcamela.app` 이 만들어져 있어야 해요.
2. **결제 프로필**: Play Console → 설정 → 결제 프로필 → 판매자 계정을 `atiumcompany@gmail.com` 의 Google 결제 프로필로 연결(사업자 정보·정산 계좌). 이게 없으면 유료 상품을 만들 수 없어요.
3. **v1.1 AAB(versionCode 2)를 내부 테스트 트랙에 한 번 올려야** 상품 만들기 메뉴가 열려요(앱에 `com.android.vending.BILLING` 권한이 들어 있어야 함 — 이미 들어 있어요).

### 3-1. 구독 2개
수익 창출 → 제품 → **구독** → 구독 만들기
1. 제품 ID `filmcamela_pro_week`, 이름 "Film Camela Pro (1주)"
   - 혜택 문구 예: "무제한 촬영", "광고 없음"
   - **기본 요금제 추가** → 기본 요금제 ID `p1w` → 유형 **자동 갱신** → 결제 주기 **1주** → 유예 기간(권장 3일)·계정 보류 기본값
   - 가격 설정 → 미국 US$4.99 입력 → "가격 변환"으로 나머지 국가 자동(한국은 필요하면 ₩ 직접 조정)
   - 기본 요금제 **활성화**
2. 제품 ID `filmcamela_pro_3month`, 이름 "Film Camela Pro (3개월)"
   - 기본 요금제 ID `p3m` → 자동 갱신 → 결제 주기 **3개월** → US$9.99 → 활성화
3. 무료 체험·할인 혜택(offer)은 지금은 만들지 않아요(엔진은 기본 요금제만 구매해요).

### 3-2. 평생 이용권 (일회성 제품)
수익 창출 → 제품 → **일회성 제품**(예전 이름 "인앱 상품") → 만들기
- 제품 ID `filmcamela_pro_lifetime`, 이름 "Film Camela Pro (평생)"
- 구매 옵션: 기본 "구매(Buy)" 옵션 하나 · US$19.99 · 가격 변환 → **활성화**
- 소모성이 아니에요(엔진이 consume 하지 않아요 → 한 번 사면 계속 보유).

### 3-3. 테스트 결제 (라이선스 테스터)
1. Play Console **홈 화면의 "설정" → 라이선스 테스트** → 테스터 Gmail 추가:
   - `atiumcompany@gmail.com` (필수), 사장님·QA 폰에 로그인된 Gmail
   - 라이선스 응답: `RESPOND_NORMALLY`
2. 테스트 → **내부 테스트** 트랙 → 테스터 목록에도 같은 계정 추가 → 참여 링크로 참여 → **Play 스토어에서 설치**(adb로 깐 디버그 APK는 결제가 안 열릴 수 있어요. 결제 테스트는 Play에서 받은 빌드로).
3. 라이선스 테스터는 "테스트 카드, 항상 승인 / 항상 거절 / 지연 승인(=결제 대기)"을 고를 수 있어요 → 성공·실패·대기 세 경우를 다 확인하세요.
4. 테스트 구독은 빨리 갱신돼요: 1주 → 약 5분, 3개월 → 약 10분마다 갱신, 6번 갱신 후 자동 해지.
5. 확인할 것: 구매 → 무제한 · 광고 버튼 사라짐 / 앱 지우고 다시 설치 → "구매 복원"으로 Pro 복귀 / Play에서 구독 해지 후 만료 → Pro 꺼짐 / 평생 구매 후 환불(주문 관리) → 다음 실행 때 Pro 꺼짐.

### 3-4. 정책 신고 (v1.1)
- 앱 콘텐츠 → **광고 포함: 예**
- **광고 ID**: 예, 광고용(AdMob SDK가 `AD_ID` 권한을 자동으로 넣어요)
- **데이터 보안**: "기기 또는 기타 ID — 수집·공유, 목적: 광고" (AdMob). 사용자가 광고를 고를 때만 쓰인다고 설명에 적어도 돼요. 결제 정보는 Google Play가 처리하므로 앱이 수집하지 않아요.
- 타깃 연령에 13세 미만을 넣지 마세요(가족 정책·광고 SDK 조건이 달라져요).
- 개인정보처리방침에 AdMob·UMP·결제 내용 반영(법무 문서 담당).

---

## 4. App Store Connect

### 4-0. 먼저 할 것
- 계약·세금·금융 → **유료 앱 계약(Paid Applications Agreement)** 동의, 세금 양식, 은행 계좌. 이게 "활성"이어야 인앱 구입이 팔려요.
- Xcode → App 타깃 → Signing & Capabilities → **+ Capability → In-App Purchase** 추가(번들 ID `com.filmcamela.app`).

### 4-1. 구독 그룹과 구독 2개
앱 → 수익화 → **구독** → 구독 그룹 만들기: 참조 이름 `Film Camela Pro`
1. 구독 추가: 참조 이름 "Pro 1주", 제품 ID `filmcamela_pro_week`, 기간 **1주**, 가격 US$4.99(대한민국 등은 자동 환산, 필요하면 조정), 현지화(한국어/영어 표시 이름·설명), 심사용 스크린샷(MY 탭 구매 화면), 심사 메모
2. 구독 추가: "Pro 3개월", `filmcamela_pro_3month`, 기간 **3개월**, US$9.99
3. 두 구독은 **같은 그룹**에 둬요(서로 업·다운그레이드 가능, 동시에 두 개 결제 안 됨). 그룹 안 순위: 3개월을 위(더 높은 등급)로.
4. 구독 그룹 현지화(그룹 표시 이름)도 한국어·영어로 입력.

### 4-2. 평생 이용권
앱 → 수익화 → **앱 내 구입** → + → 유형 **비소모성** → 참조 이름 "Pro 평생", 제품 ID `filmcamela_pro_lifetime`, US$19.99, 현지화, 심사 스크린샷.

### 4-3. 심사 제출
- 처음 낼 때는 상품 3개를 **앱 버전 1.1.0과 함께** 제출해요(버전 페이지 → "앱 내 구입 및 구독" 섹션에서 선택).
- 구매 화면에 꼭 있어야 하는 것(UI 담당): 가격·기간·자동 갱신 안내, 이용약관(EULA)·개인정보처리방침 링크, **구매 복원** 버튼.

### 4-4. 샌드박스 테스트
- 사용자 및 액세스 → **샌드박스** → 테스터 추가(실제로 안 쓰는 이메일). 기기 설정 → App Store → 샌드박스 계정으로 로그인.
- 샌드박스 갱신 주기: 1주 → 3분, 3개월 → 15분.
- Ask to Buy(자녀 승인 대기)는 엔진이 "대기(pending)"로 처리하고, 승인되면 `transactionUpdated` 로 자동 반영돼요.
- (Android 참고) Play의 결제 대기 상태는 `purchaseState` **"2"** 예요(플러그인 타입 주석의 "0"은 틀림). 구독 상품 목록은 Android에서 `identifier` = 기본 요금제 ID(`p1w`/`p3m`), `planIdentifier` = 제품 ID 로 와요 — 엔진이 둘 다 맞춰서 찾아요.

---

## 5. AdMob (atiumcompany@gmail.com 으로 로그인한 AdMob)

1. https://admob.google.com 에 **`atiumcompany@gmail.com` 으로 로그인** → AdMob 계정 만들기(국가 대한민국, 시간대 서울, 결제 통화). 지급은 같은 계정의 Google 결제 프로필로 연결.
2. **앱 추가 (Android)**: 앱 → 앱 추가 → Android → "앱이 Google Play에 등록되어 있나요?"
   - Play에 공개됐으면 "예" → `com.filmcamela.app` 검색해 선택(= **AdMob 앱 ↔ Play 앱 연결**).
   - 아직 미공개면 "아니요"로 만들고, 공개 후 앱 설정 → **앱 스토어 세부정보 → 스토어 추가(연결)** 에서 같은 계정의 Play 앱과 연결.
   - 만들어진 **앱 ID**(`ca-app-pub-…~…`)를 복사.
3. **보상형 광고 단위**: 그 앱 → 광고 단위 → 광고 단위 추가 → **보상형** → 이름 `MY 충전 (+10장)` → 보상 설정: 수량 **10**, 항목 **shots** → 서버 측 확인(SSV)은 끔(서버 없음) → 만들기 → **광고 단위 ID**(`ca-app-pub-…/…`) 복사.
4. iOS도 2~3번을 똑같이(App Store 앱과 연결).
5. **개인정보 보호 및 메시지**:
   - "유럽 규정(GDPR)" 메시지 만들기 → 두 앱 선택 → 게시. (영국·스위스 포함. 이게 없으면 EEA에서 광고가 안 나와요)
   - (선택) iOS "IDFA 설명 메시지" — 켜면 ATT 창 앞에 Google 설명 화면이 먼저 떠요.
   - 미국 주별 규정 메시지는 필요하면 추가.
6. **차단 관리** → 최대 광고 콘텐츠 등급 **G 또는 PG**(앱 연령 등급 4+/전체이용가에 맞춤). 민감한 카테고리(도박 등) 차단 권장.
7. **app-ads.txt**: AdMob → 앱 → app-ads.txt 안내의 한 줄(`google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`)을 **스토어 등록정보의 "웹사이트" 도메인 루트**에 올려요.
   - 스토어 웹사이트가 `https://silvr.muzig.ai` 이면 → `https://silvr.muzig.ai/app-ads.txt` — **이미 `public/app-ads.txt` 에 넣어 뒀어요**(`google.com, pub-6568578451894077, DIRECT, f08c47fec0942fa0`). 웹(PWA)을 배포하면 함께 올라가요.
   - 스토어 웹사이트가 `https://muzig.ai` 이면 → `https://muzig.ai/app-ads.txt`
   - 크롤링에 최대 24시간. AdMob 앱 화면에서 "확인됨"이 뜨는지 보세요.
8. **테스트 기기**: 앱 실행 시 logcat/Xcode 콘솔에 찍히는 테스트 기기 ID를 `config.ts` 의 `ADMOB_TEST_DEVICE_IDS` 에 넣거나 AdMob → 설정 → 테스트 기기에 추가하세요(출시 빌드에서도 그 폰엔 테스트 광고만 나와요). **자기 광고를 실제로 클릭하면 계정이 정지될 수 있어요.**

---

## 6. 광고 ID — `src/monetize/config.ts` (2026-11-02 실제 ID 반영 완료)

AdMob 게시자 `pub-6568578451894077` (계정 `atiumcompany@gmail.com`)

| 플랫폼 | 앱 ID (매니페스트/Info.plist에도 같은 값) | 보상형 광고 단위 (출시 빌드) |
|------|------|------|
| Android | `ca-app-pub-6568578451894077~3582572576` | `ca-app-pub-6568578451894077/6676086887` |
| iOS | `ca-app-pub-6568578451894077~3646151750` | `ca-app-pub-6568578451894077/6933613890` |

### 출시 빌드 vs 테스트 빌드 (실제 광고를 절대 누르지 않도록)
- **앱 ID는 실행 중에 바꿀 수 없어요.** SDK가 앱이 켜질 때 `android/app/src/main/res/values/strings.xml`(`admob_app_id`)과 `ios/App/App/Info.plist`(`GADApplicationIdentifier`)에서 읽어요. 그래서 디버그·출시 빌드 모두 **실제 앱 ID**가 들어 있어야 하고, 출시 빌드에는 반드시 실제 값이어야 해요(Google 권장 방식: 실제 앱 ID + 테스트 광고 단위).
- **광고 단위는 빌드에 따라 자동으로 골라요** (`ads.ts` `adsTestBuild()`):
  - Android 디버그 빌드(`assembleDebug`, debuggable) → Google **테스트** 광고 단위
  - Vite 개발 서버(`npm run dev`) → 테스트
  - `VITE_ADS_TEST=1 npm run build` 로 만든 웹 자산 → 서명된 출시 빌드라도 테스트 (TestFlight·내부 테스트 QA용. iOS는 디버그 자동 감지가 없으니 iOS QA 빌드는 이 방법이나 테스트 기기 등록을 쓰세요)
  - 그 외 출시 빌드(`npm run build` → `cap sync` → `bundleRelease` / Xcode Archive) → **실제** 광고 단위
- 값은 세 곳(`config.ts`·`strings.xml`·`Info.plist`)이 같아야 하고, `npx vitest run` 의 `tests/monetize-config.test.ts` 가 어긋나면 실패해요. 실제 광고 단위가 다른 게시자의 앱 ID와 짝지어져도 실패해요.
- `ADMOB_TEST_DEVICE_IDS`: (선택) QA 폰 ID. 상품 ID·가격·하루 10장·광고 10편·+10장은 `config.ts` 맨 위에서 바꿔요(스토어 ID는 바꾸지 마세요).
- iOS `SKAdNetworkItems` 는 Google 목록을 넣어 뒀어요. 출시 전 https://developers.google.com/admob/ios/quick-start 의 최신 목록과 한 번 맞춰 주세요.
- iOS 추적 문구: 영어는 `Info.plist`, 한국어는 `ios/App/App/ko.lproj/InfoPlist.strings`(08 문서 3-1 문구, Xcode 프로젝트에 등록됨). 다른 언어를 추가할 때 `xx.lproj/InfoPlist.strings` 를 더 만들고 Xcode 프로젝트에 등록하세요.

---

## 7. 엔진 API (UI 담당용 요약)

`import { … } from '../monetize'`

| 이름 | 종류 | 설명 |
|------|------|------|
| `quota` | signal | `{ freeLeft, earned, adsLeftToday, unlimited, resetsAt, ready }` |
| `quotaExhausted` | signal(number) | 장수가 없어 셔터가 거절될 때마다 +1 (같은 때 `window` 이벤트 `fc:quota-exhausted`) |
| `canShoot()` | 함수 | 지금 찍을 수 있는지(동기, 표시용) |
| `consumeShot()` / `refundShot()` | async | 카메라가 이미 사용 중 — UI는 부를 필요 없음 |
| `canBuy` / `products` / `isPro` / `entitlement` | signal | 결제 가능 여부, 현지 가격 목록, Pro 여부 |
| `purchase(id)` | async | `'purchased' \| 'pending' \| 'cancelled' \| 'failed' \| 'unavailable'` |
| `restore()` | async | `'restored' \| 'none' \| 'failed' \| 'unavailable'` |
| `manageSubscriptions()` | async | 스토어 구독 관리 화면 열기 |
| `billingBusy` / `purchasePending` | signal | 구매 진행 중 / 결제 대기 중 |
| `canWatchAds` / `adsAvailable` / `adShowing` | signal | 광고 가능 빌드인지 / 지금 광고 버튼을 켤지 / 광고 표시 중 |
| `showRewarded()` | async | `'rewarded' \| 'dismissed' \| 'failed' \| 'unavailable'` (보상은 엔진이 알아서 +10) |
| `privacyOptionsRequired` / `showPrivacyOptions()` | signal / async | 유럽 사용자용 "광고 개인정보 선택" 메뉴 표시 여부 / 동의 창 다시 열기 |

- **셔터가 거절되면 (출시된 동작)**: 엔진이 `quotaExhausted` 를 +1 하고 `window` 이벤트 `fc:quota-exhausted` 를 보내요. `src/app.tsx` 가 그 이벤트를 받아 **충전 시트 `PaywallSheet`**(`src/screens/My.tsx`)를 열어요(온보딩을 마친 뒤에만). 카메라 화면은 거절된 장수를 바로 돌려받고(`consumeShot` 실패 → 셔터 잠금 해제) 그 밖엔 아무것도 하지 않아요. 토스트·`console.warn` 은 더 이상 없어요.
  - 시트 제목 `pw.title`("오늘의 무료 10장을 다 썼어요"), 안내 `pw.lead`.
  - **앱(네이티브)**: 광고 가능 빌드면 "광고 보고 +10장"(`pw-watch-ad`, 주 버튼, 보상되면 시트가 닫힘) + "Pro로 무제한 찍기"(`pw-pro` → 시트를 닫고 MY 탭을 열어 Pro 카드로 스크롤·포커스, `proRequest`).
  - **웹**: 광고·결제 대신 앱 받기 카드(`GetAppCard`).
  - 항상 "내일 다시 찍을게요"(`pw-later`, 처음 포커스) + 다시 채워지는 시각(`my.resets`). 광고는 절대 저절로 시작되지 않고, 시트가 열린 뒤 0.45초 동안의 탭은 무시해요(셔터를 누른 스페이스 키가 시트 버튼까지 누르지 않게).
  - 시트가 열린 채로 Pro를 사거나 날이 바뀌어 무료 장수가 생기면 시트가 저절로 닫혀요.
- 카메라 뷰파인더에는 오늘 남은 장수 배지 `ShotsLeftBadge`(`shots-left`, 무료 + 광고로 받은 장수)가 프레임 카운터 반대쪽 아래 모서리에 떠요. 3장 이하면 연한 주황, 0장이면 진한 주황(강조색)으로 바뀌고, 누르면 MY 탭으로 가요. Pro·무제한일 때와 셀프타이머가 세는 동안에는 숨겨요.
- E2E 테스트용 탈출구: 웹 빌드에서만 `localStorage['fc-unlimited']='1'` 이면 무제한(앱에서는 무시). `e2e/helpers.ts` 의 `start()` 가 기본으로 켜요. 제한 자체는 `e2e/quota.spec.ts` 가 검사해요.

---

## 8. 출시 전 확인 목록
- [ ] Play: 구독 2개(기본 요금제 `p1w`·`p3m` 활성) + 일회성 1개 활성, 라이선스 테스터에 `atiumcompany@gmail.com`
- [ ] App Store: 유료 앱 계약 활성, 구독 그룹 + 구독 2개 + 비소모성 1개, In-App Purchase capability
- [ ] AdMob(`atiumcompany@gmail.com`): Play/App Store 연결, GDPR 메시지 게시, app-ads.txt "확인됨"(웹 배포 후)
- [x] `config.ts`·`strings.xml`·`Info.plist` 실제 AdMob ID 반영(11/2) → `npx vitest run` 통과
- [ ] 출시용 웹 자산은 `VITE_ADS_TEST` 없이 `npm run build` 로 만들기(QA용 빌드와 섞지 않기)
- [ ] 개인정보처리방침·데이터 보안·App Privacy에 AdMob/결제 반영
- [ ] 실제 기기: 10장 → 거절 → 광고 → +10장 → 자정 후 무료 10장 + 남은 광고 장수 / 구매·복원·환불
