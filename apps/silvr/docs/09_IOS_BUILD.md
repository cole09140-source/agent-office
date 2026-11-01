# iPhone(iOS) 앱 빌드 가이드 — Mac 없이 Windows에서

이 앱은 Capacitor 8 앱이에요. iPhone 앱을 만들려면 Apple의 Xcode가 필요하고, Xcode는 Mac에서만 돌아가요.
Mac이 없으니 **GitHub이 빌려주는 Mac(GitHub Actions)** 으로 빌드하는 길을 기본으로 준비해 뒀어요.

| 길 | 필요한 것 | 추천 |
|----|-----------|------|
| **A. GitHub Actions** | GitHub 저장소, Apple Developer 계정, 비밀값 7개 등록 | ✅ 기본 |
| B. Mac 빌리기 | Mac 1대(지인·클라우드 대여) 몇 시간 | 처음 한 번 확인할 때·문제 생겼을 때 |

> 앱 정보 입력값(이름·카테고리·개인정보 등)은 `08_APP_STORE_CONNECT.md`, 스토어 문구는 `03_STORE_LISTING.md`에 있어요.

---

## 미리 알아 둘 것 (이미 준비된 항목)

아래는 저장소에서 확인을 마친 상태예요. 따로 손댈 필요 없어요.

| 항목 | 상태 | 위치 |
|------|------|------|
| 번들 ID | `app.silvr.camera` (앱 이름을 바꿔도 이 값은 그대로) | `ios/App/App.xcodeproj/project.pbxproj` |
| iPhone 전용 | `TARGETED_DEVICE_FAMILY = 1` — iPad 스크린샷 필요 없음 | 같은 파일 |
| 개인정보 매니페스트 | `PrivacyInfo.xcprivacy`가 앱 리소스에 포함됨 | `ios/App/App/PrivacyInfo.xcprivacy` |
| 최소 iOS 버전 | iOS 15.0 (Capacitor 8 요구 사항과 같음) | `project.pbxproj` |
| 권한 안내 문구 | 카메라·사진 저장·사진 불러오기·위치·동작 센서 (한국어+영어) | `ios/App/App/Info.plist` |
| 암호화 신고 | `ITSAppUsesNonExemptEncryption = false` → 업로드 때마다 안 물어봐요 | `Info.plist` |
| 앱 아이콘 | 1024×1024 한 장(투명 배경 없음) — Xcode가 나머지 크기를 자동으로 만들어요 | `Assets.xcassets/AppIcon.appiconset` |
| 실행 화면 | `LaunchScreen.storyboard` + Splash 이미지 | `ios/App/App/Base.lproj` |
| 패키지 방식 | Swift Package Manager (CocoaPods 안 씀 → `.xcworkspace` 없이 `.xcodeproj`를 열어요) | `ios/App/CapApp-SPM` |

---

## A. 가장 쉬운 길: GitHub Actions로 빌드

### A-0. 전체 흐름

```
Apple 사이트에서 인증서·프로필·API 키 만들기 (처음 한 번, 1시간 정도)
   ↓
GitHub 저장소에 비밀값(Secrets) 7개 등록 (처음 한 번)
   ↓
GitHub → Actions → "iOS build" → Run workflow 클릭 (매번)
   ↓ 20~30분 정도
① 시뮬레이터용 앱(컴파일 확인용)  ② 서명된 .ipa  ③ TestFlight 자동 업로드
```

비밀값을 하나도 안 넣어도 워크플로는 돌아가요. 그때는 **①(컴파일 확인)만** 하고 끝나요.
비밀값 7개가 다 있으면 ②·③까지 자동으로 해요.

워크플로 파일: 저장소 맨 위 `.github/workflows/ios-build.yml`

### A-1. Apple Developer Program 가입 확인

- `08_APP_STORE_CONNECT.md`의 0번(조직으로 등록)대로 가입이 끝나 있어야 해요.
- **App Store Connect에 앱이 먼저 만들어져 있어야** 업로드가 돼요(`08_APP_STORE_CONNECT.md` 1번, 번들 ID `app.silvr.camera`).

### A-2. 팀 ID 확인 → 비밀값 `APPLE_TEAM_ID`

1. https://developer.apple.com/account 로그인
2. **멤버십 세부 사항(Membership details)** → **팀 ID(Team ID)** — 영문·숫자 10자리예요. 적어 두세요.

### A-3. 앱 ID 등록 (처음 한 번)

1. https://developer.apple.com/account/resources/identifiers/list
2. **+** → **App IDs** → **App** → 계속
3. Description: `SILVR` / Bundle ID: **Explicit** → `app.silvr.camera`
4. Capabilities는 아무것도 체크하지 않아도 돼요 → **Register**

> 이미 등록돼 있으면 건너뛰세요.

### A-4. 배포 인증서 만들기 (Windows에서) → `IOS_DIST_CERT_P12_BASE64`, `IOS_DIST_CERT_PASSWORD`

인증서를 만들려면 "인증서 요청 파일(CSR)"이 필요해요. Mac의 키체인 대신 **Git for Windows에 들어 있는 OpenSSL**로 만들어요.

**1) PowerShell을 열고 아래를 한 줄씩 실행해요** (폴더는 바탕화면이 아니라 사용자 폴더에 만들어요)

```powershell
$ssl = "C:\Program Files\Git\mingw64\bin\openssl.exe"
New-Item -ItemType Directory -Force "$HOME\ios-signing" | Out-Null
Set-Location "$HOME\ios-signing"
& $ssl genrsa -out ios_dist.key 2048
& $ssl req -new -key ios_dist.key -out ios_dist.csr -subj "/emailAddress=play@muzig.ai/CN=ATIUM GROUP/C=KR"
```

→ `ios_dist.key`(비밀 열쇠 — 절대 공유 금지)와 `ios_dist.csr`(요청 파일)이 생겨요.

**2) Apple 사이트에서 인증서 발급**

1. https://developer.apple.com/account/resources/certificates/list → **+**
2. **Apple Distribution** 선택 → 계속
3. `ios_dist.csr` 파일 올리기 → 계속 → **Download** → `distribution.cer`를 `ios-signing` 폴더에 넣어요

**3) .p12 파일로 바꾸기**

```powershell
& $ssl x509 -inform DER -in distribution.cer -out distribution.pem
& $ssl pkcs12 -export -inkey ios_dist.key -in distribution.pem -out ios_dist.p12 -certpbe PBE-SHA1-3DES -keypbe PBE-SHA1-3DES -macalg sha1
```

- 두 번째 줄을 실행하면 **Export Password**를 두 번 물어봐요. 새 비밀번호를 정해서 입력하세요(화면에 안 보이는 게 정상). → 이 비밀번호가 `IOS_DIST_CERT_PASSWORD`예요.
- 끝의 `-certpbe ... -macalg sha1` 옵션은 빼지 마세요. 빼면 Mac이 파일을 못 읽어요("MAC verification failed").

### A-5. App Store 배포 프로필 만들기 → `IOS_PROVISIONING_PROFILE_BASE64`

1. https://developer.apple.com/account/resources/profiles/list → **+**
2. **Distribution** 아래 **App Store Connect** 선택 → 계속
3. App ID: `app.silvr.camera` → 계속
4. 인증서: 방금 만든 **Apple Distribution** 선택 → 계속
5. 프로필 이름: `SILVR App Store` (아무 이름이나 돼요) → **Generate** → **Download**
6. 받은 `SILVR_App_Store.mobileprovision`을 `ios-signing` 폴더에 넣어요

> "Development"나 "Ad Hoc" 프로필을 넣으면 워크플로가 일부러 멈추고 알려줘요.

### A-6. App Store Connect API 키 만들기 → `APPSTORE_API_KEY_ID`, `APPSTORE_API_ISSUER_ID`, `APPSTORE_API_KEY_P8_BASE64`

TestFlight 자동 업로드에 쓰는 열쇠예요.

1. https://appstoreconnect.apple.com → **사용자 및 액세스(Users and Access)** → **통합(Integrations)** 탭 → **App Store Connect API** → **팀 키(Team Keys)**
2. 처음이면 **액세스 요청**이 보여요 — 계정 소유자(Account Holder)가 눌러서 동의해야 해요
3. **+** (키 생성) → 이름 `GitHub Actions` → 액세스 **앱 관리(App Manager)** → 생성
4. 목록에서 **API 키 다운로드** → `AuthKey_XXXXXXXXXX.p8` 파일 (⚠️ **딱 한 번만** 받을 수 있어요. 잃어버리면 새로 만들어야 해요)
5. 같은 화면에서 두 값을 적어 두세요
   - **키 ID(Key ID)** — 표의 키 줄에 있어요 → `APPSTORE_API_KEY_ID`
   - **발급자 ID(Issuer ID)** — 표 위쪽에 있는 긴 값 → `APPSTORE_API_ISSUER_ID`

### A-7. 파일을 base64 글자로 바꾸기 (PowerShell)

GitHub 비밀값에는 파일을 그대로 못 넣어서, 글자로 바꿔 붙여 넣어요. 한 줄 실행하면 **클립보드에 복사**돼요. 바로 A-8에서 붙여 넣고 다음 줄로 넘어가세요.

```powershell
# 1) 인증서 → IOS_DIST_CERT_P12_BASE64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\ios-signing\ios_dist.p12")) | Set-Clipboard

# 2) 프로필 → IOS_PROVISIONING_PROFILE_BASE64  (파일 이름이 다르면 고쳐서)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\ios-signing\SILVR_App_Store.mobileprovision")) | Set-Clipboard

# 3) API 키 → APPSTORE_API_KEY_P8_BASE64  (XXXXXXXXXX 부분을 실제 키 ID로)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\Downloads\AuthKey_XXXXXXXXXX.p8")) | Set-Clipboard
```

### A-8. GitHub에 비밀값 7개 등록

1. https://github.com/cole09140-source/agent-office → **Settings** → 왼쪽 **Secrets and variables** → **Actions**
2. **New repository secret**을 눌러 아래 7개를 하나씩 만들어요 (이름은 대소문자까지 똑같이)

| 이름(Name) | 값(Secret) |
|------------|------------|
| `APPLE_TEAM_ID` | A-2의 팀 ID 10자리 |
| `IOS_DIST_CERT_P12_BASE64` | A-7 1)번 결과 붙여 넣기 |
| `IOS_DIST_CERT_PASSWORD` | A-4에서 정한 .p12 비밀번호 |
| `IOS_PROVISIONING_PROFILE_BASE64` | A-7 2)번 결과 |
| `APPSTORE_API_KEY_ID` | A-6의 키 ID |
| `APPSTORE_API_ISSUER_ID` | A-6의 발급자 ID |
| `APPSTORE_API_KEY_P8_BASE64` | A-7 3)번 결과 |

- 등록한 값은 GitHub에서도 다시 볼 수 없고, 빌드 기록(로그)에도 `***`로 가려져요.
- 다 넣었으면 `ios-signing` 폴더와 `.p8` 파일은 **USB나 비밀번호 관리자 등 안전한 곳에 백업**해 두세요. 저장소(깃) 안에는 절대 넣지 마세요.

### A-9. 빌드 실행

> ⚠️ 처음 한 번: GitHub은 **기본 브랜치(main)에 워크플로 파일이 있어야** "Run workflow" 버튼을 보여 줘요. 지금 SILVR 코드는 `ccr-59119389-f3n3qc` 브랜치(PR #1)에 있어요. PR을 main에 합치거나, Claude에게 "**배포**"라고 말씀해 주시면 워크플로 파일을 올리는 작업부터 해 드려요.

1. 저장소 → 위쪽 **Actions** 탭 → 왼쪽 목록에서 **iOS build**
2. 오른쪽 **Run workflow** 버튼
   - **Use workflow from**: 앱 코드가 있는 브랜치 선택
   - **Upload the signed build to App Store Connect / TestFlight**: 체크하면 업로드까지 해요
   - **CFBundleVersion (build number)**: 보통 비워 두세요(자동으로 실행 번호 1, 2, 3…이 들어가요)
3. 초록색 **Run workflow** → 목록에 노란 점(진행 중)이 생겨요. 20~30분 기다려요.
4. 초록 체크 ✅ = 성공 / 빨간 X ❌ = 실패 (클릭하면 어느 단계에서 멈췄는지 보여요)

**태그로 실행하는 방법(선택):** `ios-v1.0.0`처럼 `ios-v`로 시작하는 태그를 올리면 자동으로 돌고, 업로드까지 해요.

### A-10. 결과 받기

실행 기록을 클릭 → 맨 아래 **Artifacts**

| 이름 | 내용 | 쓰는 곳 |
|------|------|---------|
| `silvr-simulator-app` | 시뮬레이터용 앱(zip) | "코드가 iPhone용으로 컴파일된다"는 증거. Windows에서는 실행할 수 없어요 |
| `silvr-ipa` | 서명된 App Store용 `.ipa` | 보관용. 업로드는 워크플로가 이미 해요 |

- 보관 기간: 시뮬레이터 앱 14일, .ipa 30일
- ⚠️ 저장소가 **공개(Public)** 인 동안에는 GitHub에 로그인한 누구나 실행 기록과 Artifacts를 내려받을 수 있어요(비밀값은 안 보여요). 출시 전 .ipa가 공개되는 게 싫으면 저장소를 비공개로 바꾸세요 — 대신 C의 비용을 확인하세요.

### A-11. TestFlight에서 확인

1. 업로드 후 5~30분 정도 지나면 Apple이 처리를 마치고 메일이 와요
2. App Store Connect → 앱 → **TestFlight** 탭에 빌드가 보여요
3. **내부 테스트** → 테스터(팀원, 최대 100명) 추가 → 테스터 iPhone에 **TestFlight 앱** 설치 → 초대 메일로 설치
4. 외부 테스터(팀 밖 사람)는 Apple의 베타 심사를 한 번 거쳐야 해요
5. 심사 제출: App Store Connect → 앱 → 버전 1.0.0 → **빌드** 칸에서 이 빌드 선택 → 심사에 제출

### A-12. 버전·빌드 번호 규칙

- **버전(1.0.0)**: 프로젝트 파일에 들어 있어요. 1.0.1 등으로 올릴 때는 Claude에게 요청하세요.
- **빌드 번호**: 같은 버전 안에서 **업로드할 때마다 더 큰 숫자**여야 해요. 기본값은 GitHub 실행 번호예요. Mac에서 따로 올린 적이 있어 번호가 겹치면, Run workflow 때 더 큰 숫자를 직접 적으세요.

### A-13. 자주 나는 오류

| 메시지(로그) | 원인 | 해결 |
|--------------|------|------|
| `Signed build skipped. Missing secrets: ...` | 비밀값이 빠짐 | 적힌 이름의 비밀값을 등록 |
| `MAC verification failed` / `security import` 실패 | .p12 비밀번호가 틀렸거나 A-4 옵션 없이 만듦 | A-4 3)을 옵션 포함해서 다시 |
| `Profile is for '...' but the app is '...'` | 프로필의 앱 ID나 팀 ID가 다름 | A-3·A-5 다시 확인 |
| `Development/Ad Hoc profile` | 프로필 종류가 틀림 | A-5에서 **App Store Connect** 종류로 다시 |
| `No signing certificate "Apple Distribution" found` | 프로필에 다른 인증서가 묶여 있음 | A-5에서 A-4 인증서를 선택해 프로필 다시 만들기 |
| `bundle version must be higher` / 중복 빌드 | 빌드 번호가 이미 쓰임 | Run workflow 때 더 큰 빌드 번호 입력 |
| `No suitable application records were found` | App Store Connect에 앱이 아직 없음 | `08_APP_STORE_CONNECT.md` 1번대로 앱 만들기 |
| `Xcode_26.6.app is not installed` | GitHub이 Mac 이미지를 바꿈 | 로그에 나온 Xcode 목록 중 26.x로 `XCODE_APP` 값 수정(Claude에게 요청) |

### A-14. 1년마다 할 일

배포 인증서와 프로필은 **1년** 뒤 만료돼요. 만료되면 A-4·A-5를 다시 하고 비밀값 3개(`IOS_DIST_CERT_P12_BASE64`, `IOS_DIST_CERT_PASSWORD`, `IOS_PROVISIONING_PROFILE_BASE64`)를 새 값으로 바꾸세요(같은 이름으로 **Update**). 이미 스토어에 나간 앱은 인증서가 만료돼도 계속 동작해요.

---

## B. Mac을 빌리는 경우 (Xcode로 직접)

지인 Mac이나 맥 클라우드 대여(MacinCloud 등, 시간 단위 요금 — 가격은 대여 업체에서 확인)로 할 수 있어요.

**필요한 것:** macOS 26(Tahoe) 이상 권장, **Xcode 26 이상**(Capacitor 8 필수 조건이고, Apple도 2026년 4월부터 iOS 26 SDK로 만든 빌드만 받아요), Node.js 22 이상, Apple Developer 계정 로그인

### B-1. 코드 받아서 iOS 프로젝트 준비

터미널(Terminal) 앱에서:

```bash
git clone https://github.com/cole09140-source/agent-office.git
cd agent-office
git checkout ccr-59119389-f3n3qc     # 앱 코드가 main에 합쳐졌으면 이 줄은 건너뛰기
cd apps/silvr
npm ci
npm run cap:ios                      # 웹 빌드 → iOS로 복사 → Xcode가 열려요
```

Xcode가 안 열리면 Finder에서 `apps/silvr/ios/App/App.xcodeproj`를 더블클릭하세요. (이 프로젝트는 Swift Package Manager 방식이라 **`.xcworkspace`가 없어요. `.xcodeproj`를 여는 게 맞아요.**)
처음 열면 Xcode가 패키지(Capacitor)를 내려받느라 1~3분 걸려요(왼쪽 아래 진행 표시).

### B-2. 서명 설정

1. Xcode 메뉴 **Xcode → Settings → Accounts** → **+** → Apple ID로 로그인(Apple Developer 팀이 보여야 해요)
2. 왼쪽 파일 목록 맨 위 파란 **App** 아이콘 클릭 → 가운데 **TARGETS**의 **App** 선택
3. **Signing & Capabilities** 탭
   - ☑ **Automatically manage signing**
   - **Team**: ATIUM GROUP Co., Ltd. (조직 팀) 선택
   - **Bundle Identifier**: `app.silvr.camera` 인지 확인(바꾸지 마세요)
4. **General** 탭 → **Identity**의 **Build** 숫자를 이전 업로드보다 크게(처음이면 1 그대로)

### B-3. Archive → 업로드

1. Xcode 위쪽 기기 선택 칸 → **Any iOS Device (arm64)**
2. 메뉴 **Product → Archive** (몇 분 걸려요)
3. 끝나면 **Organizer** 창이 열려요 → 방금 만든 Archive 선택 → **Distribute App**
4. **App Store Connect** → **Distribute** (또는 Upload) → 나머지는 기본값으로 다음
5. 업로드가 끝나면 A-11처럼 TestFlight에서 확인

### B-4. 실기기에서 바로 확인하고 싶을 때

iPhone을 USB로 연결 → 기기 선택 칸에서 그 iPhone 선택 → **▶(Run)**. 처음이면 iPhone **설정 → 개인정보 보호 및 보안 → 개발자 모드**를 켜야 해요.
확인할 것: 카메라 권한 창 문구, 셔터·현상, 사진 앱 저장, 공유, 가로로 들고 찍은 사진 회전.

---

## C. 비용

### C-1. GitHub Actions (2026-11-01 GitHub 공식 문서 기준 — 바뀔 수 있으니 실행 전 확인)

| 저장소 | macOS 빌드 비용 |
|--------|------------------|
| **공개(Public)** — 지금 상태 | **무료**. 표준 러너는 공개 저장소에서 무료이고 무료 사용량도 줄지 않아요 |
| **비공개(Private)** | 분당 **US$0.062** (Linux US$0.006의 약 **10배**). 계정에 매달 포함된 무료 금액에서 먼저 빠져요 |

비공개일 때 매달 포함 금액(달러로 주어져요):

| GitHub 요금제 | 매달 포함 금액 | macOS로 환산 |
|---------------|----------------|---------------|
| Free | US$12 | 약 190분 |
| Pro / Team | US$18 | 약 290분 |

- 이 워크플로 1회 예상 시간: 시뮬레이터만 10~15분, 서명·업로드까지 20~30분(예상치 — 첫 실행 뒤 실제 시간을 확인하세요)
- 비공개 + Free 요금제면 한 달에 **약 6~9번** 무료로 돌릴 수 있어요. 넘으면 결제 수단·지출 한도(Budget)에 따라 과금되거나 멈춰요.
- 비용 줄이는 법: 이 워크플로는 일반 push에는 절대 안 돌고, 버튼을 누르거나 `ios-v` 태그를 올릴 때만 돌아요. **필요할 때만 실행**하면 돼요. 실패하면 로그를 Claude에게 먼저 보여 주고 고친 뒤 다시 돌리세요(실패한 실행도 분 단위로 계산돼요).
- 확인 주소: https://docs.github.com/en/billing/reference/actions-runner-pricing , https://docs.github.com/en/billing/concepts/product-billing/github-actions

### C-2. Apple Developer Program

- **연 US$99** (조직 등록. 한국에서는 원화 금액이 표시될 수 있어요 — 결제 화면에서 확인)
- 1년마다 갱신. 갱신을 안 하면 앱이 스토어에서 내려가요.
- TestFlight·App Store Connect·인증서는 이 회비에 포함돼 추가 비용이 없어요.

---

## D. Windows에서 미리 확인한 결과 (2026-11-01)

- `npx cap sync ios` — Windows에서 오류 없이 끝남(웹 파일 복사, 플러그인 3개 `@capacitor/app`·`filesystem`·`share` 연결, `Package.swift` 변경 없음)
- `package-lock.json`에 Mac용 빌드 부품(rollup·esbuild darwin-arm64)이 들어 있어 Mac 러너에서 `npm ci`가 가능
- 프로젝트 파일은 Capacitor 8 공식 템플릿과 같은 구조(번들 ID·iPhone 전용·개인정보 매니페스트·권한 문구만 추가)
- 실제 컴파일은 Mac에서만 확인돼요 → **A-9에서 첫 실행(비밀값 없이도 됨)이 컴파일 확인**이에요
