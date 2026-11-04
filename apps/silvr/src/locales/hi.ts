/**
 * Film Camela — Hindi (hi). Lazy-loaded when this language is chosen or detected.
 *
 * TRANSLATOR CONTRACT — read docs/10_LOCALIZATION_GUIDE.md first (§2.9 for this language, §3 names,
 * §4 placeholders, §5 plurals, §6 glossary, §8 length, §9 locale-specific content, §12 checklist).
 *
 * 1. Edit only this file. For each line below: remove the leading "// ", put your text between the
 *    quotes, keep the trailing "// ko: … · en: …" comment or delete it. A key you leave commented out
 *    falls back to English at runtime. Never paste English in as a translation.
 * 2. Keys come from ko.ts (the source). Do not add, rename or remove keys; do not edit ko.ts or en.ts.
 * 3. Copy every {placeholder} exactly (same name, same braces). You may move it; never translate,
 *    rename, duplicate or drop it. {shots}/{left} are ready-made phrases ("12 shots"): don't add a noun.
 *    Lines marked "[+ counts: n, m]" also receive the raw counts n (shots taken) and m (shots left),
 *    which you may use ONLY as plural selectors for agreement (see ko.ts pluralCounts).
 * 4. Plurals (ICU syntax):  {n, plural, <selector> {<text>} … other {<text>}}
 *      selectors: zero one two few many other, and exact values =0 =1 =2 (checked first)
 *      "other" is required; "#" prints the number (locale-formatted); {n} works too; a form may omit the number.
 *      Two counts = two blocks: '{rolls, plural, one {# roll} other {# rolls}}, {photos, plural, …}'
 *    Categories one / other. "one" covers 0 AND 1.
 *     '{n, plural, one {# फ़ोटो} other {# फ़ोटो}}'  (write one + other even when they look alike)
 * 5. Never translate, transliterate or inflect: Film Camela, camera names (Pro 35, Snap 27…), film names
 *    (Sunny 200, Expired '98…), ISO, EV, f/8, 1/125, 35mm, 6×6, 2.39:1, 65:24, PRO, CSV, .zip, HTTPS,
 *    Safari, Chrome. Dates, times, sizes and durations arrive formatted in {time} {date} {t} {wait} {used}.
 * 6. Typography: plain Unicode text only; no HTML, no line breaks, no bidi control characters, no "!" hype.
 * 7. Check your file:  STRICT_I18N=1 npx vitest run tests/locales.test.ts   (lists missing keys, bad
 *    placeholders, plural syntax errors) and  npx tsc --noEmit .
 *
 * cameraText.era and the tab labels are pre-filled from the guide's tables (§3.3, §8.3); review them.
 */
import type { LocaleCameraText, LocaleMessages, LocaleStockText } from './types';

export const messages: LocaleMessages = {
  'app.tagline': 'हर ओरिजिनल सँभालकर रखने वाला फ़िल्म कैमरा', // ko: 원본이 그대로 남는 필름 카메라 · en: The film camera that keeps every original
  'tab.camera': 'कैमरा', // from guide §8.3 · en: Camera
  'tab.lab': 'लैब', // from guide §8.3 · en: Lab
  'tab.gallery': 'एल्बम', // from guide §8.3 · en: Album
  'tab.analog': 'एनालॉग', // from guide §8.3 · en: Analog
  'tab.settings': 'मेरा पेज',
  'common.cancel': 'रद्द करें', // ko: 취소 · en: Cancel
  'common.close': 'बंद करें', // ko: 닫기 · en: Close
  'common.save': 'सेव करें', // ko: 저장 · en: Save
  'common.delete': 'डिलीट करें', // ko: 삭제 · en: Delete
  'common.done': 'हो गया', // ko: 완료 · en: Done
  'common.retry': 'फिर कोशिश करें', // ko: 다시 시도 · en: Retry
  'common.back': 'वापस', // ko: 뒤로 · en: Back
  'common.next': 'आगे', // ko: 다음 · en: Next
  'common.start': 'शुरू करें', // ko: 시작하기 · en: Get started
  'common.on': 'चालू', // ko: 켜짐 · en: On
  'common.off': 'बंद', // ko: 꺼짐 · en: Off
  'common.pro': 'PRO', // ko: PRO · en: PRO
  'common.loading': 'लोड हो रहा है…', // ko: 불러오는 중… · en: Loading…
  'common.error': 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।', // ko: 잠시 문제가 생겼어요. 다시 시도해 주세요. · en: Something went wrong. Please try again.
  'toast.close': 'सूचना बंद करें', // ko: 알림 닫기 · en: Dismiss
  'lab.developedMany': '{n, plural, one {# रोल डेवलप हो गया} other {# रोल डेवलप हो गए}}', // ko: 롤 {n}개 현상이 끝났어요 · en: {n} rolls developed
  'cam.loadCard': 'मेमोरी कार्ड डालें', // ko: 메모리 카드 넣기 · en: Insert card
  'cam.loadPack': 'फ़िल्म पैक डालें', // ko: 필름 팩 넣기 · en: Load film pack
  'cam.useCamera': 'इस कैमरे से खींचें', // ko: 이 카메라로 찍기 · en: Use this camera
  'cam.allCameras': 'सभी देखें', // ko: 모두 보기 · en: All cameras
  'cam.allCamerasTitle': 'सभी कैमरे', // ko: 카메라 모두 보기 · en: All cameras
  'cam.group.film': 'फ़िल्म कैमरे', // ko: 필름 카메라 · en: Film cameras
  'cam.group.instant': 'इंस्टेंट कैमरे', // ko: 즉석 카메라 · en: Instant cameras
  'cam.group.digital': 'डिजिटल', // ko: 디지털 · en: Digital
  'cam.group.toy': 'टॉय और ख़ास कैमरे', // ko: 토이·특수 카메라 · en: Toy & special
  'cam.group.phone': 'फ़ोन कैमरे', // ko: 휴대폰 카메라 · en: Phone cameras
  'a11y.stockKeys': '← → कीज़ से फ़िल्में देखें, Enter से चुनें', // ko: ← → 키로 필름을 살펴보고 Enter로 골라요 · en: Arrow keys browse films; Enter selects
  'gal.importHint': 'आपकी तस्वीरें इसी फ़िल्म से डेवलप होंगी। डार्करूम में इसे कभी भी बदल सकते हैं।', // ko: 고른 필름으로 현상해요. 다크룸에서 언제든 바꿀 수 있어요. · en: Your photos develop with this film. You can change it in the darkroom any time.
  'onb.restore': 'पुराने फ़ोन से आए हैं? बैकअप रीस्टोर करें', // ko: 이전 폰에서 옮겨 오셨나요? 백업 불러오기 · en: Coming from another phone? Restore a backup
  'onb.1.title': 'फ़िल्म की तरह, एक-एक तस्वीर', // ko: 필름처럼, 한 장씩 · en: Shoot like film
  'onb.1.body': 'कैमरा चुनिए, रोल डालिए। गिनी-चुनी तस्वीरें हैं, तो हर एक दिल से खींचिए।', // ko: 카메라를 고르고 롤을 넣어 보세요. 남은 장수를 세어 가며, 셔터 한 번에 마음을 담아요. · en: Pick a camera, load a roll, and make every frame count.
  'onb.2.title': 'लैब का मीठा इंतज़ार', // ko: 현상소에서 기다리는 설렘 · en: Let the lab take its time
  'onb.2.body': 'पूरे हो चुके रोल लैब भेजिए और चुनिए कितना इंतज़ार करना है: तुरंत, 1 घंटा, सुबह 9 बजे या 3 दिन।', // ko: 다 찍은 롤은 현상소로 보내요. 즉시, 1시간, 아침 9시, 3일 중에서 기다림의 길이를 골라 보세요. · en: Send finished rolls to the lab and choose your wait: Instant, 1 hour, next 9 AM, or 3 days.
  'onb.3.title': 'जब चाहें, फिर से डेवलप', // ko: 다크룸에서 언제든 다시 현상 · en: Re-develop in the darkroom
  'onb.3.body': 'आपकी ओरिजिनल तस्वीर हमेशा जस की तस रहती है। फ़िल्म, ब्राइटनेस, पुराना लुक या ग्लो — डार्करूम में जितनी बार चाहें, बदलकर देखिए।', // ko: 찍은 원본은 언제나 그대로 남아요. 필름, 밝기, 오래된 필름 느낌, 빛 번짐까지 몇 번이고 다시 골라 보세요. · en: Your original is always kept. Try another film, brightness, aged-film look, or glow, as often as you like.
  'onb.privacy': '{n, plural, one {रोज़ # तस्वीर मुफ़्त} other {रोज़ # तस्वीरें मुफ़्त}} · कोई अकाउंट नहीं। सारी तस्वीरें सिर्फ़ इसी डिवाइस पर रहती हैं।',
  'cam.loadFilm': 'रोल डालें', // ko: 필름 넣기 · en: Load film
  'cam.chooseFilm': 'फ़िल्म चुनें', // ko: 필름을 고르세요 · en: Choose your film
  'cam.exposures': '{n} फ़ोटो', // ko: {n}장 · en: {n} exp
  'cam.load': 'यह फ़िल्म डालें', // ko: 이 필름 넣기 · en: Load this film
  'cam.left': '{n} बाकी', // ko: {n}장 남음 · en: {n} left
  'cam.rewind': 'लैब भेजें', // ko: 현상소로 보내기 · en: Send to lab
  'cam.rollFull': 'रोल पूरा हो गया', // ko: 롤을 끝까지 다 찍었어요 · en: Roll finished
  'cam.sendToLab': 'लैब भेजें', // ko: 현상소로 보내기 · en: Send to lab
  'cam.flash': 'फ़्लैश', // ko: 플래시 · en: Flash
  'cam.timer': 'टाइमर', // ko: 타이머 · en: Timer
  'cam.grid': 'ग्रिड', // ko: 격자 · en: Grid
  'cam.date': 'तारीख़', // ko: 날짜 · en: Date
  'cam.flip': 'कैमरा बदलें', // ko: 카메라 전환 · en: Switch camera
  'cam.zoom': 'ज़ूम', // ko: 줌 · en: Zoom
  'cam.aspect': 'फ़ॉर्मैट', // ko: 비율 · en: Format
  'cam.shutter': 'फ़ोटो लें', // ko: 촬영 · en: Take photo
  'cam.noCamera.title': 'कैमरा उपलब्ध नहीं है', // ko: 카메라를 사용할 수 없어요 · en: Camera unavailable
  'cam.noCamera.body': 'ब्राउज़र या डिवाइस की सेटिंग्ज़ में कैमरे की अनुमति दें। तब तक आप डिवाइस की तस्वीरें इंपोर्ट करके भी डेवलप कर सकते हैं।', // ko: 브라우저나 기기 설정에서 카메라 권한을 허용해 주세요. 그동안 기기에 있는 사진을 불러와 현상할 수도 있어요. · en: Allow camera access in your browser or device settings. In the meantime, you can import photos and develop them.
  'cam.noCamera.import': 'फ़ोटो इंपोर्ट करके डेवलप करें', // ko: 사진 불러와 현상하기 · en: Import & develop photos
  'cam.starting': 'कैमरा तैयार हो रहा है…', // ko: 카메라 준비 중… · en: Starting camera…
  'cam.saved': 'फ़्रेम {n}', // ko: {n}번째 컷 · en: Frame {n}
  'cam.rewindConfirm': 'आपने {shots} {n, plural, one {खींच ली है} other {खींच ली हैं}}। बाकी {left} खाली छोड़कर रोल लैब भेजें?', // ko: {shots} 찍었어요. 남은 {left}은 비워 둔 채 현상소로 보낼까요? · en: You’ve taken {shots}. Send this roll to the lab? The remaining {left} will stay blank. [+ counts: n, m]
  'cam.emptyRewind': 'अभी तक कोई तस्वीर नहीं खींची गई है। अभी निकालेंगे, तो यह रोल हटा दिया जाएगा।', // ko: 아직 찍은 사진이 없어요. 지금 필름을 빼면 이 롤은 사라져요. · en: No shots yet. If you unload now, this roll is discarded.
  'cam.unload': 'रोल निकालें', // ko: 필름 빼기 · en: Unload film
  'cam.rollSize': 'रोल साइज़', // ko: 롤 장수 · en: Roll size
  'cam.rollInfo': 'रोल की जानकारी', // ko: 롤 정보 · en: roll info
  'cam.sec': '{n} सेकंड', // ko: {n}초 · en: {n}s
  'cam.err.insecure': 'कैमरा सिर्फ़ सुरक्षित (HTTPS) कनेक्शन पर काम करता है। https वाला पता खोलें।', // ko: 카메라는 보안 연결(HTTPS)에서만 쓸 수 있어요. https 주소로 열어 주세요. · en: The camera only works over a secure (HTTPS) connection. Open the https address.
  'cam.err.unsupported': 'यह ब्राउज़र कैमरा सपोर्ट नहीं करता। Safari या Chrome का नया वर्ज़न आज़माएँ।', // ko: 이 브라우저는 카메라를 지원하지 않아요. 최신 Safari나 Chrome에서 열어 주세요. · en: This browser doesn't support the camera. Try the latest Safari or Chrome.
  'cam.err.busy': 'कैमरा किसी और ऐप में चल रहा है। उस ऐप को बंद करके फिर कोशिश करें। तब तक आप डिवाइस की तस्वीरें इंपोर्ट करके डेवलप कर सकते हैं।', // ko: 다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해 주세요. 그동안 기기의 사진을 불러와 현상할 수 있어요. · en: Another app is using the camera. Close it and try again. In the meantime, you can import photos and develop them.
  'cam.err.notfound': 'इस डिवाइस पर कोई कैमरा नहीं मिला। इसके बजाय आप डिवाइस की तस्वीरें इंपोर्ट करके डेवलप कर सकते हैं।', // ko: 이 기기에서 카메라를 찾지 못했어요. 대신 기기의 사진을 불러와 현상할 수 있어요. · en: No camera was found on this device. You can import photos and develop them instead.
  'cam.quadProgress': 'लेंस {n}/4', // ko: 렌즈 {n}/4 · en: Lens {n}/4
  'common.skip': 'छोड़ें', // ko: 건너뛰기 · en: Skip
  'view.savedToast': 'फ़ोटो सेव हो गई', // ko: 이미지를 저장했어요 · en: Image saved
  'view.prev': 'पिछली फ़ोटो', // ko: 이전 사진 · en: Previous photo
  'view.next': 'अगली फ़ोटो', // ko: 다음 사진 · en: Next photo
  'view.photoN': 'फ़ोटो {n}', // ko: {n}번째 사진 · en: Photo {n}
  'dr.applyRollConfirm': 'ये सेटिंग्ज़ रोल की सभी तस्वीरों पर लगाएँ?', // ko: 이 설정을 롤의 모든 사진에 적용할까요? · en: Apply these settings to every photo in the roll?
  'dr.original': 'ओरिजिनल', // ko: 원본 · en: Original
  'dr.showOriginal': 'ओरिजिनल देखें', // ko: 원본 보기 · en: Show original
  'dr.years': '{n, plural, one {# साल} other {# साल}}', // ko: {n}년 · en: {n, plural, one {# year} other {# years}}
  'an.log.deleteFrame': 'फ़्रेम {n} का लॉग डिलीट करें', // ko: {n}번 컷 기록 삭제 · en: Delete frame {n} log
  'lab.rushFor': 'अभी डेवलप करें · {stock}', // ko: 지금 바로 현상 · {stock} · en: Develop now · {stock}
  'speed.default': 'डिफ़ॉल्ट', // ko: 기본 · en: default
  'palette.moss': 'काई', // ko: 이끼 · en: Moss
  'palette.mono': 'मोनो', // ko: 흑백 · en: Mono
  'palette.sepia': 'सीपिया', // ko: 세피아 · en: Sepia
  'palette.ice': 'बर्फ़', // ko: 얼음 · en: Ice
  'palette.berry': 'बेरी', // ko: 베리 · en: Berry
  'cam.chooseCamera': 'कैमरा चुनें', // ko: 카메라를 고르세요 · en: Choose your camera
  'cam.film': 'फ़िल्म', // ko: 필름 · en: Film
  'cam.fixedFilm': 'बिल्ट-इन फ़िल्म', // ko: 전용 필름 · en: Built-in film
  'cam.pin': '{name} पिन करें', // ko: {name} 고정 · en: Pin {name}
  'cam.pinHint': 'सबसे आगे पिन करें', // ko: 맨 앞에 고정 · en: Pin to the front
  'cam.pinned': 'पिन किया गया', // ko: 고정됨 · en: Pinned
  'cam.pinnedSay': '{name} पिन हो गया · अब सबसे आगे दिखेगा', // ko: {name} 고정했어요 · 맨 앞에 보여요 · en: {name} pinned to the front
  'cam.unpinnedSay': '{name} अनपिन हो गया', // ko: {name} 고정을 풀었어요 · en: {name} unpinned
  'cam.pinnedToast': '{name} पिन हो गया · सबसे आगे आ गया', // ko: {name} 고정 · 맨 앞으로 옮겼어요 · en: {name} pinned · moved to the front
  'cam.pinShow': 'देखें', // ko: 보기 · en: Show
  'cam.otherWindow': 'दूसरी विंडो में पहले ही खींची जा चुकी है', // ko: 다른 창에서 이미 찍었어요 · en: Already taken in another window
  'cam.pressesDropped': '{n, plural, one {# क्लिक रद्द हो गया} other {# क्लिक रद्द हो गए}}', // ko: {n}번 누른 건 취소됐어요 · en: {n, plural, one {# press was} other {# presses were}} cancelled
  'cam.quickStart': 'झटपट शुरुआत', // ko: 빠른 시작 · en: Quick start
  'cam.quick.film': 'फ़िल्म कैमरा', // ko: 일반 필름 · en: Film camera
  'cam.quick.instant': 'इंस्टेंट फ़ोटो', // ko: 즉석 사진 · en: Instant photo
  'cam.quick.disposable': 'डिस्पोज़ेबल', // ko: 일회용 · en: Disposable
  'cam.pack': '{n} फ़ोटो वाला पैक', // ko: {n}장 팩 · en: {n}-shot pack
  'cam.card': '{n} फ़ोटो वाला कार्ड', // ko: {n}장 메모리 · en: {n}-shot card
  'cam.halves': '{n} हाफ़-फ़्रेम', // ko: 하프 {n}장 · en: {n} half-frames
  'cam.flashCharge': 'फ़्लैश चार्ज करने के लिए टैप करें', // ko: 탭해서 플래시 충전 · en: Tap to charge the flash
  'cam.flashCharging': 'चार्ज हो रहा है…', // ko: 충전 중… · en: Charging…
  'cam.flashReady': 'फ़्लैश तैयार है', // ko: 플래시 준비됨 · en: Flash ready
  'cam.ev': 'एक्सपोज़र', // ko: 노출 · en: Exposure
  'cam.palette': 'पैलेट', // ko: 팔레트 · en: Palette
  'cam.halfNext': 'अगली फ़ोटो दाएँ आधे हिस्से में आएगी', // ko: 다음 장은 오른쪽 칸에 찍혀요 · en: Next shot fills the right half
  'cam.double1': 'पहला एक्सपोज़र हो गया · अब दूसरा सीन ढूँढिए', // ko: 첫 번째 노출 완료 · 겹쳐 담을 장면을 찾아보세요 · en: First exposure done · now find the second scene
  'cam.quadHint': 'एक बार दबाएँ, चारों लेंस बारी-बारी से खींचेंगे', // ko: 한 번 누르면 렌즈 4개가 차례로 찍어요 · en: One press, four lenses in sequence
  'cam.inCamera': 'कैमरे में', // ko: 카메라 안 · en: In camera
  'cam.lastShot': 'आख़िरी फ़ोटो', // ko: 마지막 사진 · en: Last shot
  'cam.packDone': 'पैक ख़त्म हो गया। आपकी तस्वीरें एल्बम में इंतज़ार कर रही हैं।', // ko: 팩을 다 썼어요. 사진은 앨범에서 기다리고 있어요. · en: Pack finished. Your photos are waiting in the album.
  'cam.nShots': '{n, plural, one {# फ़ोटो} other {# फ़ोटो}}', // ko: {n}장 · en: {n, plural, one {# shot} other {# shots}}
  'cam.nHalves': '{n, plural, one {# हाफ़ फ़ोटो} other {# हाफ़ फ़ोटो}} ({f, plural, one {# फ़्रेम} other {# फ़्रेम}})', // ko: {n}컷({f}프레임) · en: {n, plural, one {# half} other {# halves}} ({f, plural, one {# frame} other {# frames}})
  'cam.nHalfShots': '{n, plural, one {# हाफ़ फ़ोटो} other {# हाफ़ फ़ोटो}}', // ko: {n}컷 · en: {n, plural, one {# half} other {# halves}}
  'cam.develop': 'लैब भेजें', // ko: 현상소로 · en: Send to lab
  'cam.finishPack': 'पैक निकालें', // ko: 팩 꺼내기 · en: Finish pack
  'cam.finishCard': 'कार्ड निकालें', // ko: 카드 정리 · en: Finish card
  'cam.rewindSub': 'रोल रिवाइंड होकर लैब जाएगा। डेवलप होने के बाद तस्वीरें एल्बम में दिखेंगी।', // ko: 필름을 감아 현상소로 보내요. 현상이 끝나면 앨범에서 볼 수 있어요. · en: The roll goes to the lab. Once developed, the photos appear in your album.
  'cam.finishSubViewable': 'आपकी तस्वीरें पहले से एल्बम में हैं। इसे निकालकर आप नया डाल सकते हैं।', // ko: 사진은 이미 앨범에 있어요. 정리하면 새로 넣을 수 있어요. · en: Your photos are already in the album. Finish to start a fresh one.
  'cam.finishPackConfirm': 'आपने {shots} {n, plural, one {खींच ली है} other {खींच ली हैं}}। बाकी {left} इस्तेमाल किए बिना पैक निकाल दें?', // ko: {shots} 찍었어요. 팩에 남은 {left}은 쓰지 않고 꺼낼까요? · en: {shots} taken. Finish the pack? The remaining {left} will go unused. [+ counts: n, m]
  'cam.finishCardConfirm': 'आपने {shots} {n, plural, one {खींच ली है} other {खींच ली हैं}}। बाकी {left} खाली छोड़कर कार्ड निकाल दें? आपकी तस्वीरें एल्बम में ही रहेंगी।', // ko: {shots} 찍었어요. 카드에 남은 {left}은 비워 두고 정리할까요? 사진은 앨범에 그대로 있어요. · en: {shots} taken. Finish the card? The remaining {left} will stay blank; your photos stay in the album. [+ counts: n, m]
  'cam.switchBody': 'दूसरा कैमरा चुनें', // ko: 다른 카메라로 바꾸기 · en: Switch camera body
  'cam.switchSub': 'पहले यह रोल लैब जाएगा, फिर आप नया कैमरा चुनेंगे।', // ko: 지금 롤을 먼저 현상소로 보낸 뒤 새 카메라를 골라요. · en: This roll goes to the lab first, then you pick a new camera.
  'cam.switchSubViewable': 'तस्वीरें एल्बम में ही रहेंगी, फिर आप नया कैमरा चुनेंगे।', // ko: 지금 사진은 앨범에 두고 새 카메라를 골라요. · en: Your photos stay in the album, then you pick a new camera.
  'cam.switchSubEmpty': 'अभी कोई फ़ोटो नहीं खींची गई है, इसलिए आप तुरंत बदल सकते हैं।', // ko: 아직 찍은 사진이 없어서 바로 바꿀 수 있어요. · en: Nothing shot yet, so you can switch right away.
  'cam.switchConfirm': 'कैमरा बदलने के लिए पहले यह रोल ({shots}) लैब भेजना होगा। खींची गई सभी फ़ोटो डेवलप होंगी।', // ko: 카메라를 바꾸려면 지금 롤({shots})을 먼저 현상소로 보내야 해요. 남은 칸은 비워 둔 채 현상해요. · en: To switch cameras, this roll ({shots}) goes to the lab first. Unused frames stay blank. [+ counts: n]
  'cam.switchConfirmPack': 'कैमरा बदलने के लिए पहले यह पैक ({shots}) निकालना होगा। तस्वीरें एल्बम में ही रहेंगी।', // ko: 카메라를 바꾸려면 지금 팩({shots})을 먼저 꺼내요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this pack ({shots}) comes out first. Your photos stay in the album. [+ counts: n]
  'cam.switchConfirmCard': 'कैमरा बदलने के लिए पहले यह कार्ड ({shots}) निकालना होगा। तस्वीरें एल्बम में ही रहेंगी।', // ko: 카메라를 바꾸려면 지금 카드({shots})를 먼저 정리해요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this card ({shots}) is finished first. Your photos stay in the album. [+ counts: n]
  'cam.switchOkFilm': 'लैब भेजकर बदलें', // ko: 현상소로 보내고 바꾸기 · en: Send to lab & switch
  'cam.switchOkDone': 'निकालकर बदलें', // ko: 정리하고 바꾸기 · en: Finish & switch
  'cam.switchedLab': 'रोल लैब भेज दिया गया। अब अगला कैमरा चुनिए।', // ko: 롤을 현상소에 보냈어요. 이제 새 카메라를 골라 보세요. · en: Roll sent to the lab. Pick your next camera.
  'cam.switchedAlbum': 'तस्वीरें एल्बम में आ गईं। अब अगला कैमरा चुनिए।', // ko: 사진을 앨범에 넣었어요. 이제 새 카메라를 골라 보세요. · en: Photos are in your album. Pick your next camera.
  'cam.more': 'और विकल्प', // ko: 더보기 · en: More
  'cam.flashOnSay': 'फ़्लैश चालू', // ko: 플래시 켬 · en: Flash on
  'cam.flashOffSay': 'फ़्लैश बंद', // ko: 플래시 끔 · en: Flash off
  'cam.flashOnScreen': 'फ़्लैश चालू · फ़्रंट कैमरे में स्क्रीन सफ़ेद चमकेगी', // ko: 플래시 켬 · 전면 카메라는 화면이 하얗게 빛나요 · en: Flash on · the front camera lights up the screen instead
  'cam.flipToFront': 'फ़्रंट कैमरे पर जाएँ', // ko: 전면 카메라로 전환 · en: Flip to front camera
  'cam.flipToBack': 'बैक कैमरे पर जाएँ', // ko: 후면 카메라로 전환 · en: Flip to back camera
  'gal.emptyHintCamera': 'कैमरे में {shots} इंतज़ार कर {n, plural, one {रही है} other {रही हैं}}। रोल लैब भेजिए, डेवलप होने के बाद {n, plural, one {तस्वीर यहाँ दिखेगी} other {तस्वीरें यहाँ दिखेंगी}}।', // ko: 카메라 안에 사진 {shots}이 기다리고 있어요. 현상소로 보내면 현상을 마친 뒤 여기에 나타나요. · en: You have {shots} in the camera. Send them to the lab and they show up here once developed. [+ counts: n]
  'gal.developNow': 'लैब भेजें', // ko: 현상소로 보내기 · en: Send to lab
  'gal.inCameraBanner': 'कैमरे में {shots} · लैब भेजें', // ko: 카메라 안 {shots} · 현상소로 보내기 · en: {shots} in the camera · Send to lab [+ counts: n]
  'lab.emptyCamera': 'कैमरे में {shots} {n, plural, one {है} other {हैं}}। रोल लैब भेजिए, डेवलपिंग यहीं शुरू होगी।', // ko: 카메라 안에 사진 {shots}이 있어요. 현상소로 보내면 여기서 현상이 시작돼요. · en: You have {shots} in the camera. Send the roll to the lab and it develops here. [+ counts: n]
  'speed.title': 'तस्वीरें कब देखना चाहेंगे?', // ko: 언제 받아볼까요? · en: When do you want your prints?
  'speed.instant': 'तुरंत', // ko: 즉시 · en: Instant
  'speed.why': 'जब आप भूलने लगें, तभी तस्वीरें आ जाएँ — यही तो फ़िल्म का मज़ा है। अभी देखना है? “तुरंत” चुनें।', // ko: 잊을 즈음 도착하는 설렘, 그게 필름의 재미예요. 바로 보려면 ‘즉시’. · en: Forget the roll, then find it again. That’s film. Instant shows them now.
  'speed.at.now': 'अभी एल्बम में', // ko: 지금 바로 앨범에 도착 · en: In your album right away
  'speed.at.today': 'आज {time}', // ko: 오늘 {time} 도착 · en: Arrives today at {time}
  'speed.at.tomorrow': 'कल {time}', // ko: 내일 {time} 도착 · en: Arrives tomorrow at {time}
  'speed.at.date': '{date} को', // ko: {date} 도착 · en: Arrives {date}
  'speed.instant.d': 'बिना किसी इंतज़ार के', // ko: 기다림 없이, 지금 바로 · en: No waiting. See them now
  'speed.1h': '1 घंटा', // ko: 1시간 · en: 1 hour
  'speed.1h.d': 'एक चाय का वक़्त', // ko: 커피 한 잔의 기다림 · en: Time for a coffee
  'speed.morning': 'सुबह 9 बजे', // ko: 아침 9시 · en: Next 9 AM
  'speed.morning.d': 'उठते ही तस्वीरें तैयार', // ko: 자고 일어나면 와 있어요 · en: Wake up to your photos
  'speed.3d': '3 दिन', // ko: 3일 · en: 3 days
  'speed.3d.d': 'फ़िल्म वाला सुकून', // ko: 진짜 필름처럼, 느긋하게 · en: Slow, like real film
  'lab.title': 'फ़िल्म लैब', // ko: 현상소 · en: Film Lab
  'lab.empty': 'लैब अभी शांत है।', // ko: 지금은 현상소가 조용해요. · en: The lab is quiet right now.
  'lab.emptyHint': 'लैब भेजे गए रोल यहीं इंतज़ार करते हैं।', // ko: 현상소로 보낸 롤은 여기서 기다려요. · en: Rolls you send to the lab wait here.
  'lab.emptyWhat': 'लैब भेजे गए रोल डेवलप होने तक यहीं रहते हैं।', // ko: 현상소로 보낸 롤이 현상될 때까지 머무는 곳이에요. · en: Rolls you send to the lab rest here while they develop.
  'lab.emptyHow': 'रोल आपके चुने हुए समय पर आते हैं। “तुरंत” चुनने पर सीधे एल्बम में।', // ko: 고른 시간에 맞춰 도착해요. ‘즉시’라면 바로 앨범으로. · en: They arrive on the schedule you choose. Instant skips the wait.
  'lab.intro': 'डेवलप होते ही रोल एल्बम में चले जाते हैं।', // ko: 현상을 마친 롤은 앨범으로 옮겨져요. · en: Developed rolls move to your album.
  'lab.introRush': 'इंतज़ार मुश्किल लगे, तो “अभी डेवलप करें” पर टैप कीजिए।', // ko: 기다리기 어렵다면 ‘지금 바로 현상’을 눌러 보세요. · en: Can’t wait? Tap Develop now.
  'lab.readyIn': '{t} बाकी', // ko: {t} 남음 · en: Ready in {t}
  'lab.ready': 'डेवलप हो गया', // ko: 현상 완료 · en: Developed
  'lab.rush': 'अभी डेवलप करें', // ko: 지금 바로 현상 · en: Develop now
  'lab.rushConfirm': 'इंतज़ार छोड़िए और तस्वीरें अभी एल्बम में देखिए।', // ko: 기다림을 건너뛰고 바로 앨범에서 볼 수 있어요. · en: Skip the wait and see the photos in the album right away.
  'lab.developedToast': 'आपका {stock} रोल डेवलप हो गया', // ko: {stock} 롤 현상이 끝났어요 · en: Your {stock} roll is developed
  'lab.open': 'फ़ोटो देखें', // ko: 사진 보기 · en: View photos
  'gal.title': 'एल्बम', // ko: 앨범 · en: Album
  'gal.empty': 'अभी तक कोई तस्वीर डेवलप नहीं हुई है।', // ko: 아직 현상된 사진이 없어요. · en: No developed photos yet.
  'gal.emptyHint': 'आपका पहला रोल कैमरे से शुरू होता है।', // ko: 첫 롤은 카메라에서 시작돼요. · en: Your first roll starts in the camera.
  'gal.emptyHintLab': '{n, plural, one {लैब में # रोल डेवलप हो रहा है।} other {लैब में # रोल डेवलप हो रहे हैं।}}', // ko: 현상소에서 {n}롤이 현상 중이에요. · en: {n, plural, one {# roll is} other {# rolls are}} developing in the lab.
  'gal.openLab': 'लैब देखें', // ko: 현상소 보기 · en: Open the lab
  'gal.import': 'फ़ोटो इंपोर्ट करें', // ko: 사진 불러오기 · en: Import photos
  'gal.restore': 'बैकअप रीस्टोर करें', // ko: 이전 폰 백업 불러오기 · en: Restore a backup
  'gal.importing': 'डेवलप हो रहा है… {n}/{total}', // ko: 현상 중… {n}/{total} · en: Developing… {n}/{total}
  'gal.imported': 'इंपोर्ट की गई फ़ोटो', // ko: 불러온 사진 · en: Imported
  'gal.new': 'नया', // ko: 새 롤 · en: NEW
  'gal.frames': '{n, plural, one {# फ़्रेम} other {# फ़्रेम}}', // ko: {n}장 · en: {n, plural, one {# frame} other {# frames}}
  'gal.contact': 'कॉन्टैक्ट शीट', // ko: 밀착 인화 · en: Contact sheet
  'gal.deleteRoll': 'रोल डिलीट करें', // ko: 롤 삭제 · en: Delete roll
  'gal.deleteRollConfirm': '{n, plural, one {इस रोल की # फ़ोटो डिलीट हो जाएगी।} other {इस रोल की सभी # फ़ोटो डिलीट हो जाएँगी।}} डिलीट करने के बाद कुछ सेकंड तक आप इसे वापस ले सकते हैं।', // ko: 이 롤의 사진 {n}장이 모두 삭제돼요. 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: All {n, plural, one {# photo} other {# photos}} in this roll will be deleted. You can undo it for a few seconds afterwards.
  'gal.developing': 'डेवलपिंग', // ko: 현상 중 · en: Developing
  'view.share': 'शेयर करें', // ko: 공유 · en: Share
  'view.saveImage': 'सेव करें', // ko: 저장 · en: Save
  'view.darkroom': 'डार्करूम', // ko: 다크룸 · en: Darkroom
  'view.info': 'जानकारी', // ko: 정보 · en: Info
  'view.deleteConfirm': 'यह फ़ोटो डिलीट करें? साथ में इसकी ओरिजिनल फ़ोटो भी डिलीट हो जाएगी।', // ko: 이 사진을 삭제할까요? 원본도 함께 삭제돼요. · en: Delete this photo? The original is deleted too.
  'view.developing': 'डेवलप हो रहा है…', // ko: 현상 중… · en: Developing…
  'view.taken': 'खींची गई', // ko: 촬영 · en: Taken
  'view.film': 'फ़िल्म', // ko: 필름 · en: Film
  'view.frame': 'फ़्रेम', // ko: 컷 · en: Frame
  'view.size': 'साइज़', // ko: 크기 · en: Size
  'dr.title': 'डार्करूम', // ko: 다크룸 · en: Darkroom
  'dr.film': 'फ़िल्म', // ko: 필름 · en: Film
  'dr.push': 'पुश / पुल', // ko: 증감현상 (대비·입자) · en: Push / pull (contrast & grain)
  'dr.push.hint': '+ कंट्रास्ट और ग्रेन / − ज़्यादा सॉफ़्ट', // ko: + 대비·입자↑ / − 부드럽게 · en: + contrast & grain / − softer
  'dr.stops': '{v} {n, plural, one {स्टॉप} other {स्टॉप}}', // ko: {v} 스톱 · en: {v} {n, plural, one {stop} other {stops}} [+ counts: n]
  'dr.normal': 'नॉर्मल', // ko: 노멀 · en: Normal
  'dr.redevelop': 'फिर से डेवलप करें', // ko: 다시 현상 · en: Re-develop
  'dr.expired': 'पुरानी फ़िल्म का लुक', // ko: 오래된 필름 느낌 (만료) · en: Aged film look (expired)
  'dr.grain': 'ग्रेन', // ko: 입자 · en: Grain
  'dr.halation': 'ग्लो (हेलेशन)', // ko: 빛 번짐 (할레이션) · en: Glow (halation)
  'dr.leak': 'लाइट लीक', // ko: 빛샘 · en: Light leak
  'dr.leak.reroll': 'दूसरा लीक', // ko: 다른 빛샘 · en: Another leak
  'dr.flash': 'फ़्लैश लुक', // ko: 플래시 룩 · en: Flash look
  'dr.date': 'तारीख़ की छाप', // ko: 날짜 각인 · en: Date stamp
  'dr.border': 'बॉर्डर', // ko: 테두리 · en: Border
  'dr.border.none': 'कोई नहीं', // ko: 없음 · en: None
  'dr.border.film35': '35mm', // ko: 35mm · en: 35mm
  'dr.border.instant': 'इंस्टेंट', // ko: 인스턴트 · en: Instant
  'dr.border.print': 'प्रिंट', // ko: 인화지 · en: Print
  'dr.border.slide': 'स्लाइड', // ko: 슬라이드 · en: Slide
  'dr.border.gate': 'सिने', // ko: 시네 · en: Cine
  'dr.border.sprocket': 'स्प्रॉकेट', // ko: 스프로킷 · en: Sprocket
  'dr.compare': 'दबाए रखें', // ko: 길게 눌러 원본 보기 · en: Hold to see the original
  'dr.reset': 'रीसेट करें', // ko: 초기화 · en: Reset
  'dr.saved': 'फिर से डेवलप हो गया', // ko: 다시 현상했어요 · en: Re-developed
  'dr.applyRoll': 'रोल पर लगाएँ', // ko: 롤 전체에 적용 · en: Apply to roll
  'dr.rotate': 'घुमाएँ', // ko: 회전 · en: Rotate
  'dr.ev': 'एक्सपोज़र', // ko: 노출 보정 · en: Exposure
  'dr.palette': 'पैलेट', // ko: 팔레트 · en: Palette
  'dr.camera': 'कैमरा', // ko: 카메라 · en: Camera
  'hint.ios': 'Film Camela को होम स्क्रीन पर जोड़ने से आपकी तस्वीरें ज़्यादा सुरक्षित रहती हैं। (“शेयर करें” → “होम स्क्रीन पर जोड़ें”)', // ko: 홈 화면에 추가하면 사진을 더 안전하게 지킬 수 있어요. (공유 → 홈 화면에 추가) · en: Add Film Camela to your Home Screen to keep photos safe (Share → Add to Home Screen).
  'dr.applyRollDone': 'पूरे रोल पर लगा दिया गया', // ko: 롤 전체에 적용했어요 · en: Applied to the whole roll
  'dr.applyRollUndone': 'रोल की पिछली सेटिंग्ज़ वापस आ गईं', // ko: 롤 전체 적용을 되돌렸어요 · en: Roll settings restored
  'dr.discardConfirm': 'बदलाव छोड़ दें?', // ko: 변경 사항을 버릴까요? · en: Discard changes?
  'dr.discard': 'छोड़ दें', // ko: 버리기 · en: Discard
  'dr.saveNew': 'कॉपी सेव करें', // ko: 새 사진으로 저장 · en: Save as new photo
  'dr.savedNew': 'कॉपी सेव हो गई (#{n})', // ko: 새 사진으로 저장했어요 ({n}번) · en: Saved as a new photo (#{n})
  'dr.tone': 'डिजिटल लुक', // ko: 디지털 룩 · en: Digital look
  'dr.look': 'लुक', // ko: 룩 · en: Look
  'dr.tone.none': 'डिफ़ॉल्ट', // ko: 기본 · en: Default
  'dr.tone.cool': 'कूल', // ko: 쿨 · en: Cool
  'dr.tone.warm': 'वॉर्म', // ko: 웜 · en: Warm
  'dr.tone.washed': 'फीका', // ko: 바랜 · en: Washed
  'dr.tone.night': 'नाइट', // ko: 야간 · en: Night
  'view.noDate': 'तारीख़ की जानकारी नहीं', // ko: 날짜 정보 없음 · en: No date info
  'roll.select': 'चुनें', // ko: 선택 · en: Select
  'roll.selectHint': 'चुनने के लिए फ़ोटो पर टैप करें', // ko: 사진을 눌러 선택하세요 · en: Tap photos to select them
  'roll.selectedN': '{n, plural, one {# चुनी गई} other {# चुनी गईं}}', // ko: {n}장 선택됨 · en: {n} selected
  'roll.shareN': '{n} शेयर करें', // ko: 공유 {n}장 · en: Share {n}
  'roll.saveN': '{n} सेव करें', // ko: 저장 {n}장 · en: Save {n}
  'roll.selectPhoto': 'फ़ोटो {n} चुनें', // ko: 사진 {n} 선택 · en: Select photo {n}
  'roll.ready': '{n, plural, one {# फ़ोटो तैयार है} other {# फ़ोटो तैयार हैं}}', // ko: 사진 {n}장이 준비됐어요 · en: {n, plural, one {# photo} other {# photos}} ready
  'an.title': 'एनालॉग', // ko: 아날로그 · en: Analog
  'an.subtitle': 'आपके असली फ़िल्म कैमरे के लिए टूल्स', // ko: 실제 필름 카메라를 위한 도구 · en: Tools for your real film camera
  'an.meter': 'Sunny 16 एक्सपोज़र कैलकुलेटर', // ko: Sunny 16 노출 계산기 · en: Sunny 16 exposure calculator
  'an.iso': 'ISO', // ko: ISO · en: ISO
  'an.light': 'रोशनी', // ko: 빛 · en: Light
  'an.aperture': 'अपर्चर', // ko: 조리개 · en: Aperture
  'an.shutter': 'शटर स्पीड', // ko: 셔터 속도 · en: Shutter speed
  'an.comp': 'एक्सपोज़र कंपनसेशन', // ko: 노출 보정 · en: Compensation
  'an.tripod': 'ट्राइपॉड इस्तेमाल करें', // ko: 삼각대를 권장해요 · en: Use a tripod
  'an.outOfRange': 'यह शटर की रेंज से बाहर है। दूसरा अपर्चर या ISO आज़माएँ।', // ko: 셔터 범위를 벗어났어요. 조리개나 ISO를 바꿔보세요. · en: Outside the shutter range. Try another aperture or ISO.
  'an.light.snow': 'धूप में बर्फ़ / रेत', // ko: 맑은 날 눈밭·해변 · en: Snow / sand, sunny
  'an.light.sunny': 'धूप (साफ़ परछाइयाँ)', // ko: 맑음 (선명한 그림자) · en: Sunny (sharp shadows)
  'an.light.slightOvercast': 'हल्के बादल', // ko: 약간 흐림 · en: Slightly overcast
  'an.light.overcast': 'बादल', // ko: 흐림 · en: Overcast
  'an.light.heavyOvercast': 'घने बादल', // ko: 매우 흐림 · en: Heavy overcast
  'an.light.shade': 'छाँव', // ko: 그늘 · en: Open shade
  'an.light.sunset': 'सूरज ढलने से ठीक पहले', // ko: 일몰 직전 · en: Just before sunset
  'an.light.indoorBright': 'इनडोर (तेज़ रोशनी)', // ko: 밝은 실내 · en: Bright interior
  'an.light.indoor': 'इनडोर', // ko: 실내 · en: Interior
  'an.light.night': 'रात की सड़क', // ko: 밤거리 · en: Night street
  'an.log': 'फ़िल्म शूटिंग लॉग', // ko: 필름 촬영 노트 · en: Film shooting log
  'an.log.empty': 'अभी तक कोई रोल लॉग नहीं किया गया है।', // ko: 아직 기록 중인 롤이 없어요. · en: No logged rolls yet.
  'an.log.new': 'नया रोल लॉग करें', // ko: 새 롤 기록 · en: Log a new roll
  'an.log.camera': 'कैमरा', // ko: 카메라 · en: Camera
  'an.log.film': 'फ़िल्म', // ko: 필름 · en: Film
  'an.log.exposures': 'कुल फ़ोटो', // ko: 장수 · en: Exposures
  'an.log.note': 'नोट', // ko: 메모 · en: Note
  'an.log.addFrame': 'फ़्रेम लॉग करें', // ko: 컷 기록 · en: Log frame
  'an.log.lens': 'लेंस', // ko: 렌즈 · en: Lens
  'an.log.export': 'CSV एक्सपोर्ट करें', // ko: CSV 내보내기 · en: Export CSV
  'an.log.deleteRoll': 'लॉग डिलीट करें', // ko: 기록 삭제 · en: Delete log
  'an.log.deleteConfirm': 'इस रोल का लॉग डिलीट करें?', // ko: 이 롤 기록을 삭제할까요? · en: Delete this roll log?
  'an.log.useMeter': 'कैलकुलेटर की वैल्यू लें', // ko: 계산기 값 사용 · en: Use calculator values
  'an.log.frames': '{n}/{m} फ़्रेम', // ko: {n}/{m}장 · en: {n}/{m} frames
  'an.log.location': 'लोकेशन भी सेव करें', // ko: 위치 함께 저장 · en: Save location
  'an.active': 'अभी चल रहा रोल', // ko: 지금 기록 중인 롤 · en: Roll in progress
  'an.active.go': 'फ़्रेम लॉग करें', // ko: 컷 기록하기 · en: Log a frame
  'an.log.repeat': 'वही सेटिंग्ज़ +1', // ko: 같은 설정으로 +1컷 · en: Same settings +1
  'an.log.otherSettings': 'नई सेटिंग्ज़', // ko: 다른 설정 · en: New settings
  'an.log.frameN': 'फ़्रेम {n} लॉग करें', // ko: {n}번 컷 기록 · en: Log frame {n}
  'an.log.editFrame': 'फ़्रेम {n} बदलें', // ko: {n}번 컷 고치기 · en: Edit frame {n}
  'an.log.saveFrame': 'यह फ़्रेम लॉग करें', // ko: 이 컷 기록 · en: Log this frame
  'an.log.saveEdit': 'बदलाव सेव करें', // ko: 고친 내용 저장 · en: Save changes
  'an.log.manual': 'ख़ुद लिखें', // ko: 직접 입력 · en: Type it in
  'an.log.pickStops': 'डायल से चुनें', // ko: 눈금에서 고르기 · en: Pick from the dial
  'an.log.logged': 'फ़्रेम {n} लॉग हो गया', // ko: {n}번 컷을 기록했어요 · en: Frame {n} logged
  'an.log.deleted': 'फ़्रेम {n} का लॉग हटा दिया गया', // ko: {n}번 컷 기록을 지웠어요 · en: Frame {n} log deleted
  'an.log.undo': 'वापस लें', // ko: 되돌리기 · en: Undo
  'an.log.undoFailed': 'वापस नहीं ले सके: इस बीच यह फ़्रेम नंबर लॉग हो चुका है', // ko: 그 사이 같은 번호가 기록돼서 되돌리지 못했어요 · en: Couldn't undo: that frame number is taken now
  'an.log.full': 'इस रोल के सभी फ़्रेम लॉग हो गए', // ko: 이 롤의 컷을 모두 기록했어요 · en: Every frame on this roll is logged
  'an.log.firstHint': 'हर फ़्रेम खींचते ही उसे यहाँ लॉग कीजिए। किसी भी लाइन पर टैप करके उसे कभी भी बदल सकते हैं।', // ko: 한 컷 찍을 때마다 여기에 남겨 두세요. 줄을 누르면 언제든 고칠 수 있어요. · en: Log each frame here as you shoot. Tap a row any time to edit it.
  'set.title': 'सेटिंग्ज़', // ko: 설정 · en: Settings
  'set.lang': 'भाषा', // ko: 언어 · en: Language
  'set.lang.auto': 'सिस्टम', // ko: 시스템 · en: System
  'set.sound': 'शटर की आवाज़', // ko: 셔터 소리 · en: Shutter sound
  'set.haptics': 'वाइब्रेशन', // ko: 진동 · en: Haptics
  'set.dateStamp': 'फ़ोटो पर तारीख़ लगाएँ', // ko: 사진에 날짜 넣기 · en: Add the date to photos
  'set.dateFormat': 'तारीख़ का फ़ॉर्मैट', // ko: 날짜 형식 · en: Date format
  'set.grid': 'ग्रिड दिखाएँ', // ko: 격자 표시 · en: Show grid
  'set.mirror': 'फ़्रंट कैमरे की फ़ोटो मिरर करें', // ko: 전면 카메라 좌우 반전 저장 · en: Mirror front camera photos
  'set.rollSize': 'डिफ़ॉल्ट रोल साइज़', // ko: 기본 롤 장수 · en: Default roll size
  'set.speed': 'डिफ़ॉल्ट लैब स्पीड', // ko: 기본 현상 속도 · en: Default lab speed
  'set.speed.hint': 'फ़िल्म रोल लैब भेजते समय यह स्पीड “डिफ़ॉल्ट” के रूप में दिखेगी। इंस्टेंट और डिजिटल कैमरों की तस्वीरें लैब नहीं जातीं, सीधे एल्बम में पहुँचती हैं।', // ko: 필름 롤을 현상소로 보낼 때 ‘기본’으로 표시돼요. 인스턴트·디카 사진은 현상소 없이 바로 앨범에 들어가요. · en: Marked as default when you send a film roll to the lab. Instant and digital cameras skip the lab: their photos go straight to the album.
  'set.storage': 'स्टोरेज', // ko: 저장 공간 · en: Storage
  'set.storage.used': '{used} इस्तेमाल में', // ko: {used} 사용 중 · en: {used} used
  'set.storage.persist': 'तस्वीरें अपने-आप मिटने से बचाएँ', // ko: 사진 지워지지 않게 보호 · en: Keep photos from being cleared
  'set.storage.persistHint': 'यह ब्राउज़र से अनुरोध करता है कि डिवाइस में जगह कम होने पर भी वह इस ऐप की तस्वीरें अपने-आप न मिटाए।', // ko: 기기 저장 공간이 부족해져도 브라우저가 이 앱의 사진을 자동으로 지우지 않도록 요청해요. · en: Asks the browser not to clear this app’s photos automatically when the device runs low on space.
  'set.storage.persistAsk': 'चालू करें', // ko: 보호 켜기 · en: Turn on
  'set.storage.persisted': 'सुरक्षित', // ko: 보호됨 · en: Protected
  'set.storage.refusedShort': 'अनुमति नहीं', // ko: 허락 안 됨 · en: Not allowed
  'set.storage.refused': 'इस ब्राउज़र ने अनुमति नहीं दी। Film Camela को होम स्क्रीन पर जोड़ने से तस्वीरें ज़्यादा समय तक रहती हैं। साथ में बैकअप भी रखें।', // ko: 이 브라우저가 보호를 허락하지 않았어요. 홈 화면에 추가하면 더 오래 보관돼요. 백업도 함께 해 두세요. · en: This browser declined. Adding Film Camela to your Home Screen keeps photos longer. Keep a backup too.
  'set.install': 'होम स्क्रीन पर ऐप इंस्टॉल करें', // ko: 홈 화면에 앱 설치 · en: Install app to home screen
  'set.privacy': 'प्राइवेसी पॉलिसी', // ko: 개인정보 처리방침 · en: Privacy policy
  'set.terms': 'इस्तेमाल की शर्तें', // ko: 이용약관 · en: Terms of use
  'set.support': 'सहायता और संपर्क', // ko: 고객지원 · 문의 · en: Support & contact
  'set.licenses': 'ओपन-सोर्स लाइसेंस', // ko: 오픈소스 라이선스 · en: Open-source licenses
  'set.backup': 'बैकअप', // ko: 백업 · en: Backup
  'set.backup.hint': 'आपकी तस्वीरें और लॉग सिर्फ़ इसी डिवाइस पर रहते हैं। फ़ोन बदलने या ब्राउज़र डेटा मिटाने से पहले बैकअप फ़ाइल (.zip) किसी सुरक्षित जगह सेव कर लें।', // ko: 사진과 기록은 이 기기에만 머물러요. 폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업 파일(.zip)로 챙겨 두세요. · en: Your photos and logs live only on this device. Before you switch phones or clear browser data, save a backup file (.zip) somewhere safe.
  'set.backup.export': 'बैकअप सेव करें (.zip)', // ko: 백업 파일 저장 (.zip) · en: Save backup file (.zip)
  'set.backup.saveAgain': 'एक और कॉपी सेव करें', // ko: 한 번 더 저장 · en: Save another copy
  'set.backup.send': 'ख़ुद को भेजें (मैसेज, ईमेल, Drive)', // ko: 카카오톡·드라이브로 보내기 · en: Send to KakaoTalk or Drive
  'set.backup.savedWeb': 'डाउनलोड फ़ोल्डर में सेव हो गई · {name}', // ko: 다운로드 폴더에 저장했어요 · {name} · en: Saved to your Downloads folder · {name}
  'set.backup.savedShared': 'शेयर शीट में चुनी गई जगह (फ़ाइल्स, Drive…) पर सेव हो गई · {name}', // ko: 공유 창에서 고른 곳(파일·드라이브 등)에 저장했어요 · {name} · en: Saved where you picked in the share sheet (Files, Drive…) · {name}
  'set.backup.restoreHint': 'नए फ़ोन पर ले जाने के लिए यह फ़ाइल ख़ुद को भेजें (मैसेज, ईमेल या Drive), फिर नए फ़ोन पर Film Camela की सेटिंग्ज़ में “बैकअप से रीस्टोर करें” दबाकर इसे खोलें।', // ko: 새 폰으로 옮기려면 이 파일을 카카오톡 ‘나와의 채팅’이나 드라이브로 보낸 뒤, 새 폰의 Film Camela 설정에서 ‘백업에서 복원’을 눌러 열어요. · en: To move to a new phone, send this file to yourself (KakaoTalk, Drive or email), then open it there with Restore from backup in Film Camela Settings.
  'set.credit': '© 2026 ATIUM GROUP Co., Ltd.', // ko: © 2026 아티움그룹 주식회사 (ATIUM GROUP Co., Ltd.) · en: © 2026 ATIUM GROUP Co., Ltd.
  'set.backup.import': 'बैकअप से रीस्टोर करें', // ko: 백업에서 복원 · en: Restore from backup
  'set.backup.working': 'बैकअप हो रहा है… {done}/{total}', // ko: 백업 중… {done}/{total} · en: Backing up… {done}/{total}
  'set.backup.restoring': 'रीस्टोर हो रहा है…', // ko: 복원 중… · en: Restoring…
  'set.backup.done': 'बैकअप तैयार · {rolls, plural, one {# रोल} other {# रोल}}, {photos, plural, one {# फ़ोटो} other {# फ़ोटो}}', // ko: 백업 준비 완료 · 롤 {rolls}개, 사진 {photos}장 · en: Backup ready · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}}
  'set.backup.save': 'तैयार · सेव करें', // ko: 준비 완료 · 저장하기 · en: Ready · Save it
  'set.backup.saved': 'बैकअप फ़ाइल सेव हो गई', // ko: 백업 파일을 저장했어요 · en: Backup file saved
  'set.backup.saveFailed': 'सेव नहीं हो सका, फिर से टैप करें', // ko: 저장하지 못했어요. 다시 눌러 주세요 · en: Couldn't save it. Tap again
  'set.backup.tooLarge': 'बैकअप 4 GB से बड़ा है, एक फ़ाइल में नहीं आ सकता। कुछ पुराने रोल हटाकर फिर कोशिश करें।', // ko: 4GB가 넘어 파일 하나에 담을 수 없어요. 오래된 롤을 정리한 뒤 다시 시도해 주세요 · en: Over 4 GB, too large for one file. Clear out some old rolls and try again
  'set.backup.newer': 'यह बैकअप ऐप के नए वर्ज़न में बना है। कृपया ऐप अपडेट करें।', // ko: 더 새로운 버전의 앱에서 만든 백업이에요. 앱을 업데이트해 주세요 · en: This backup is from a newer version of the app. Please update
  'set.backup.partial': 'रीस्टोर बीच में रुक गया: {rolls, plural, one {# रोल ही रीस्टोर हो पाया} other {# रोल ही रीस्टोर हो पाए}}। स्टोरेज में जगह बनाकर फिर से रीस्टोर करें, वहीं से आगे चलेगा।', // ko: 롤 {rolls}개까지 복원하고 멈췄어요. 저장 공간을 확보한 뒤 다시 복원하면 이어서 진행돼요 · en: Stopped after restoring {rolls, plural, one {# roll} other {# rolls}}. Free up storage and restore again to continue
  'set.backup.empty': 'अभी बैकअप के लिए कुछ नहीं है', // ko: 아직 백업할 사진이나 기록이 없어요 · en: Nothing to back up yet
  'set.backup.restored': 'रीस्टोर हो गया · जोड़े गए: {rolls, plural, one {# रोल} other {# रोल}}, {photos, plural, one {# फ़ोटो} other {# फ़ोटो}}', // ko: 복원 완료 · 롤 {rolls}개, 사진 {photos}장 추가 · en: Restored · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}} added
  'set.backup.skipped': '{n, plural, one {पहले से मौजूद # आइटम छोड़ दिया गया} other {पहले से मौजूद # आइटम छोड़ दिए गए}}', // ko: 이미 있는 항목 {n}개는 그대로 두었어요 · en: Skipped {n, plural, one {# item} other {# items}} you already have
  'set.backup.damaged': '{n, plural, one {# ख़राब आइटम छोड़ दिया गया} other {# ख़राब आइटम छोड़ दिए गए}}', // ko: 손상된 항목 {n}개는 건너뛰었어요 · en: Skipped {n} damaged {n, plural, one {item} other {items}}
  'set.backup.invalid': 'यह Film Camela की बैकअप फ़ाइल नहीं है, या फ़ाइल ख़राब है', // ko: Film Camela 백업 파일이 아니거나 손상된 파일이에요 · en: Not a Film Camela backup, or the file is damaged
  'set.backup.failed': 'बैकअप नहीं बन सका। स्टोरेज में खाली जगह देख लें।', // ko: 백업을 만들지 못했어요. 저장 공간을 확인해 주세요 · en: Couldn't create the backup. Check free storage
  'set.reset': 'सारा डेटा डिलीट करें', // ko: 모든 데이터 삭제 · en: Delete all data
  'set.resetConfirm': 'सभी रोल, तस्वीरें, लॉग और सेटिंग्ज़ डिलीट हो जाएँगी, और यह वापस नहीं हो सकेगा। पहले ऊपर “बैकअप सेव करें” से बैकअप ले लें। फिर भी डिलीट करें?', // ko: 모든 롤, 사진, 기록, 설정이 삭제되고 되돌릴 수 없어요. 먼저 위의 ‘백업 파일 저장’으로 백업해 두세요. 그래도 삭제할까요? · en: All rolls, photos, logs and settings will be deleted, and this cannot be undone. Save a backup file first (above). Delete anyway?
  'set.version': 'वर्ज़न', // ko: 버전 · en: Version
  'set.replayOnb': 'परिचय फिर से देखें', // ko: 소개 다시 보기 · en: Replay intro
  'share.title': 'Film Camela से खींची गई', // ko: Film Camela로 촬영 · en: Shot on Film Camela
  'err.storage': 'स्टोरेज भर गया है। कुछ तस्वीरें डिलीट करके फिर कोशिश करें।', // ko: 저장 공간이 부족해요. 사진 몇 장을 지우고 다시 시도해 주세요. · en: Storage is full. Delete a few photos and try again.
  'common.notFound': 'यह नहीं मिला। हो सकता है इसे डिलीट कर दिया गया हो।', // ko: 찾을 수 없어요. 삭제되었을 수 있어요. · en: Couldn't find this. It may have been deleted.
  'an.log.noLocation': 'लोकेशन नहीं मिल पाई, इसलिए बिना लोकेशन के सेव किया गया', // ko: 위치를 확인하지 못해 위치 없이 저장했어요 · en: Couldn’t get your location, so it was saved without one
  'err.storagePermission': 'स्टोरेज की अनुमति बंद है। सेटिंग्ज़ > ऐप > Film Camela > अनुमतियाँ में जाकर इसे चालू करें।', // ko: 저장 권한이 꺼져 있어요. 설정 > 앱 > Film Camela > 권한에서 저장공간을 허용해 주세요. · en: Storage permission is off. Allow it in Settings > Apps > Film Camela > Permissions.
  'err.noStorage': 'यह ब्राउज़र Film Camela को तस्वीरें सेव नहीं करने दे रहा। प्राइवेट ब्राउज़िंग बंद करें या साइट डेटा की अनुमति दें, फिर ऐप दोबारा खोलें।', // ko: 이 브라우저 설정에서는 사진을 저장할 수 없어요. 사생활 보호(시크릿) 모드를 끄거나 사이트 데이터 저장을 허용해 주세요. · en: This browser won't let Film Camela save photos. Turn off private browsing or allow site data, then reopen the app.
  'err.import': 'यह फ़ाइल इंपोर्ट नहीं हो सकी।', // ko: 이 파일은 불러올 수 없어요. · en: This file could not be imported.
  'update.ready': 'नया वर्ज़न तैयार है', // ko: 새 버전이 준비됐어요 · en: A new version is ready
  'update.reload': 'रीलोड करें', // ko: 새로고침 · en: Reload
  'offline.ready': 'अब ऑफ़लाइन भी इस्तेमाल कर सकते हैं', // ko: 오프라인에서도 사용할 수 있어요 · en: Ready to work offline
  'a11y.cameraTitle': 'कैमरा', // ko: 카메라 · en: Camera
  'a11y.rollLoaded': '{stock} डाला गया · {n, plural, one {# फ़ोटो} other {# फ़ोटो}}', // ko: {stock} · {n}장 넣었어요 · en: {stock} loaded · {n, plural, one {# shot} other {# shots}}
  'a11y.sentToLab': 'लैब भेज दिया गया · {wait} में तैयार', // ko: 현상소로 보냈어요 · {wait} 뒤 도착 · en: Sent to the lab · ready in {wait}
  'a11y.cameraKeys': '← → कीज़ से कैमरा चुनें, Tab से उसके पिन बटन पर जाएँ', // ko: ← → 키로 카메라를 고르고, Tab으로 고정 버튼으로 가요 · en: Use the arrow keys to choose a camera; Tab reaches its pin button
  'cam.timerSay': '{n} सेकंड में फ़ोटो खिंचेगी · रद्द करने के लिए शटर फिर दबाएँ', // ko: {n}초 뒤 촬영 · 셔터를 다시 누르면 취소 · en: Taking the photo in {n} seconds · press the shutter again to cancel
  'cam.timerCancelled': 'टाइमर रद्द हो गया', // ko: 타이머를 취소했어요 · en: Timer cancelled
  'cam.tapToCancel': 'रद्द करने के लिए टैप करें', // ko: 탭하면 취소 · en: Tap to cancel
  'cam.cancelTimer': 'टाइमर रद्द करें', // ko: 타이머 취소 · en: Cancel timer
  'cam.doubleHint': 'दो बार दबाएँ, एक ही फ़्रेम', // ko: 두 번 눌러 한 장에 겹쳐요 · en: Two presses, one frame
  'cam.double2': 'एक बार और दबाएँ, यह पहली फ़ोटो के ऊपर खिंचेगी', // ko: 한 번 더 누르면 첫 장면 위에 겹쳐 찍혀요 · en: Press again to expose over the first shot
  'cam.pressBusy': 'पिछली फ़ोटो अभी सेव हो रही है', // ko: 앞 사진을 저장하는 중이에요 · en: Still saving the previous shots
  'cam.pressFull': 'कोई फ़्रेम बाकी नहीं', // ko: 남은 컷이 없어요 · en: No frames left
  'cam.startingQueued': 'कैमरा तैयार होते ही फ़ोटो खिंच जाएगी', // ko: 카메라가 준비되면 바로 찍어요 · en: Taking the photo as soon as the camera is ready
  'cam.switchConfirmFilm2': 'कैमरा बदलने पर यह रोल लैब चला जाएगा। खींची गई {shots} डेवलप {n, plural, one {होगी} other {होंगी}}, और बाकी {left} इस्तेमाल नहीं {m, plural, one {होगी} other {होंगी}}।', // ko: 카메라를 바꾸면 지금 롤은 현상소로 가요. 찍은 {shots}은 현상하고, 남은 {left}은 쓰지 않아요. · en: Switching sends this roll to the lab. The {shots} you took {n, plural, one {gets} other {get}} developed; the {left} left {m, plural, one {stays} other {stay}} unused. [+ counts: n, m]
  'cam.switchConfirmPack2': 'कैमरा बदलने पर यह पैक निकल जाएगा। खींची गई {shots} एल्बम में {n, plural, one {जाएगी} other {जाएँगी}}, और बाकी {left} इस्तेमाल नहीं {m, plural, one {होगी} other {होंगी}}।', // ko: 카메라를 바꾸면 지금 팩을 꺼내요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching takes this pack out. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  'cam.switchConfirmCard2': 'कैमरा बदलने पर यह कार्ड निकल जाएगा। खींची गई {shots} एल्बम में {n, plural, one {जाएगी} other {जाएँगी}}, और बाकी {left} इस्तेमाल नहीं {m, plural, one {होगी} other {होंगी}}।', // ko: 카메라를 바꾸면 지금 카드를 정리해요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching finishes this card. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  'common.undo': 'वापस लें', // ko: 되돌리기 · en: Undo
  'view.deleteUndoConfirm': 'डिलीट करने के बाद कुछ सेकंड तक इसे वापस ले सकते हैं।', // ko: 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: You can undo it for a few seconds afterwards.
  'view.deleted': 'फ़ोटो डिलीट हो गई', // ko: 사진을 삭제했어요 · en: Photo deleted
  'view.restored': 'फ़ोटो वापस आ गई', // ko: 사진을 되돌렸어요 · en: Photo restored
  'view.deleteTitle': 'यह फ़ोटो डिलीट करें?', // ko: 사진을 삭제할까요? · en: Delete this photo?
  'view.savedWeb': 'डाउनलोड फ़ोल्डर में सेव हो गई', // ko: 다운로드 폴더에 저장했어요 · en: Saved to your Downloads folder
  'view.savedAndroid': 'गैलरी › Film Camela एल्बम में सेव हो गई', // ko: 갤러리 › Film Camela 앨범에 저장했어요 · en: Saved to Gallery › Film Camela album
  'gal.deleteRollTitle': 'यह रोल डिलीट करें?', // ko: 이 롤을 삭제할까요? · en: Delete this roll?
  'gal.rollDeleted': 'रोल डिलीट हो गया', // ko: 롤을 삭제했어요 · en: Roll deleted
  'gal.rollRestored': 'रोल वापस आ गया', // ko: 롤을 되돌렸어요 · en: Roll restored
  'gal.rollRestoreBlocked': 'वापस नहीं ला सकते: कैमरे में अभी दूसरा रोल है', // ko: 카메라에 다른 롤이 들어 있어서 되돌릴 수 없어요 · en: Can't restore it: another roll is in the camera now
  'gal.framesHalf': '{f, plural, one {# फ़्रेम} other {# फ़्रेम}} ({n, plural, one {# फ़ोटो} other {# फ़ोटो}})', // ko: {f}프레임 ({n}컷) · en: {f, plural, one {# frame} other {# frames}} ({n, plural, one {# shot} other {# shots}})
  'gal.help': 'मदद', // ko: 도움말 · en: Help
  'lab.rushTitle': 'अभी डेवलप करें?', // ko: 지금 바로 현상할까요? · en: Develop now?
  'view.pushNormal': 'नॉर्मल', // ko: 노멀 · en: Normal
  'view.expiredNone': 'नई फ़िल्म', // ko: 새 필름 · en: Fresh film
  'view.expiredYears': '{n, plural, one {# साल पुरानी फ़िल्म} other {# साल पुरानी फ़िल्म}}', // ko: {n}년 지난 필름 · en: Expired {n, plural, one {# year} other {# years}}
  'dur.days': '{n} दिन', // ko: {n}일 · en: {n}d
  'dur.hours': '{n, plural, one {# घंटा} other {# घंटे}}', // ko: {n}시간 · en: {n}h
  'dur.minutes': '{n} मिनट', // ko: {n}분 · en: {n}m
  'dur.seconds': '{n} सेकंड', // ko: {n}초 · en: {n}s
  'dur.pair': '{a} {b}', // ko: {a} {b} · en: {a} {b}
  'wait.days': '{n} दिन', // ko: {n}일 · en: {n} d
  'wait.hours': '{n} घंटे', // ko: {n}시간 · en: {n} h
  'wait.minutes': '{n} मिनट', // ko: {n}분 · en: {n} min

  // MY tab (shots, rewarded ads, Pro) and the paywall sheet. {n} = a count; {left} = how many are left;
  // {time} = local clock time; {date} = a date; {store} = "Google Play" / "App Store" (never translated).
  'quota.empty': 'आज की 10 मुफ़्त तस्वीरें इस्तेमाल हो गईं · ‘मेरा पेज’ में और पाएँ या Pro लें',
  'my.free': 'आज की मुफ़्त फ़ोटो',
  'my.free.say': 'आज की {n} मुफ़्त तस्वीरों में से {left} बाकी हैं',
  'my.unlimited': 'अनलिमिटेड',
  'my.earned.label': 'बोनस फ़ोटो',
  'my.earned.note': 'आधी रात के बाद भी ख़त्म नहीं होतीं',
  'my.resets': '{n, plural, one {{time} पर फिर से # मुफ़्त तस्वीर मिलेगी} other {{time} पर फिर से # मुफ़्त तस्वीरें मिलेंगी}}',
  'my.ad.watch': '{n, plural, one {विज्ञापन देखें · +# फ़ोटो} other {विज्ञापन देखें · +# फ़ोटो}}',
  'my.ad.left': 'आज {n} में से {left} बाकी',
  'my.ad.loading': 'विज्ञापन लोड हो रहा है…',
  'my.ad.none': 'आपने आज के सारे विज्ञापन देख लिए। आधी रात के बाद फिर मिलेंगे।',
  'my.ad.offline': 'विज्ञापन देखने के लिए इंटरनेट से कनेक्ट करें।',
  'my.ad.blocked': 'अभी विज्ञापन उपलब्ध नहीं हैं।',
  'my.ad.pro': 'Pro के साथ जितनी चाहें तस्वीरें लें। कोई विज्ञापन नहीं।',
  'my.ad.rewarded': '{n, plural, one {+# तस्वीर मिल गई। खींचते रहिए।} other {+# तस्वीरें मिल गईं। खींचते रहिए।}}',
  'my.ad.dismissed': '{n, plural, one {# तस्वीर पाने के लिए विज्ञापन पूरा देखें।} other {# तस्वीरें पाने के लिए विज्ञापन पूरा देखें।}}',
  'my.ad.failed': 'विज्ञापन लोड नहीं हुआ। थोड़ी देर बाद फिर कोशिश करें।',
  'my.pro.lead': 'अनलिमिटेड फ़ोटो · कोई विज्ञापन नहीं',
  'my.plans': 'Pro प्लान',
  'my.plan.week': '1 हफ़्ता',
  'my.plan.3month': '3 महीने',
  'my.plan.lifetime': 'लाइफ़टाइम',
  'my.plan.week.d': 'हर हफ़्ते अपने-आप रिन्यू',
  'my.plan.3month.d': 'हर 3 महीने में अपने-आप रिन्यू',
  'my.plan.lifetime.d': 'एक बार पेमेंट, हमेशा के लिए',
  'my.plan.best': 'सबसे किफ़ायती',
  'my.buy': 'Pro लें',
  'my.restore': 'ख़रीदारी रीस्टोर करें',
  'my.manage': 'सब्सक्रिप्शन मैनेज करें',
  'my.pro.on': 'Pro चालू है',
  'my.pro.lifetimeOn': 'लाइफ़टाइम · अनलिमिटेड फ़ोटो, कोई विज्ञापन नहीं',
  'my.pro.subOn': 'सब्सक्रिप्शन चालू · अनलिमिटेड फ़ोटो, कोई विज्ञापन नहीं',
  'my.pro.renews': '{date} को रिन्यू होगा',
  'my.pro.pending': 'पेमेंट का इंतज़ार है। मंज़ूरी मिलते ही Pro खुल जाएगा।',
  'my.pro.noStore': 'अभी स्टोर से कनेक्ट नहीं हो पा रहा। थोड़ी देर बाद फिर कोशिश करें।',
  'my.pro.legal': 'सब्सक्रिप्शन हर बार उतनी ही अवधि के लिए अपने-आप रिन्यू हो जाता है, जब तक आप अवधि ख़त्म होने से कम से कम 24 घंटे पहले उसे रद्द न करें। पेमेंट आपके {store} अकाउंट से लिया जाता है। आप {store} की सब्सक्रिप्शन सेटिंग्ज़ में इसे कभी भी रद्द कर सकते हैं। लाइफ़टाइम का पेमेंट सिर्फ़ एक बार होता है।',
  'my.buy.done': 'Pro चालू हो गया। जितनी चाहें तस्वीरें लें।',
  'my.buy.failed': 'ख़रीदारी पूरी नहीं हुई। फिर से कोशिश करें।',
  'my.restore.done': 'Pro फिर से चालू हो गया।',
  'my.restore.none': 'इस अकाउंट में रीस्टोर करने के लिए कोई ख़रीदारी नहीं मिली।',
  'my.restore.failed': 'रीस्टोर नहीं हो सका। थोड़ी देर बाद फिर कोशिश करें।',
  'my.app.title': 'ऐप में और तस्वीरें',
  'my.app.body': '{n, plural, one {ऐप में एक छोटा विज्ञापन देखकर # और तस्वीर पाएँ, या Pro लेकर अनलिमिटेड तस्वीरें लें।} other {ऐप में एक छोटा विज्ञापन देखकर # और तस्वीरें पाएँ, या Pro लेकर अनलिमिटेड तस्वीरें लें।}}',
  'my.app.play': 'इसे Google Play पर पाएँ',
  'my.adPrivacy': 'विज्ञापन प्राइवेसी विकल्प',
  'shots.left': 'आज {n} बाकी',
  'shots.leftSay': '{n, plural, one {आज # तस्वीर बाकी है} other {आज # तस्वीरें बाकी हैं}}',
  'pw.title': '{n, plural, one {आज की # मुफ़्त तस्वीर इस्तेमाल हो गई} other {आज की # मुफ़्त तस्वीरें इस्तेमाल हो गईं}}',
  'pw.lead': 'अगर रोशनी अब भी अच्छी है, तो थोड़ी और तस्वीरें खींचिए।',
  'pw.pro': 'Pro के साथ अनलिमिटेड फ़ोटो',
  'pw.later': 'कल फिर मिलते हैं',
};

export const cameraText: LocaleCameraText = {
  /** Camera body descriptions (expressive register, guide §1.1). */
  desc: {
    pro35: 'भरोसेमंद 35mm SLR। हर तरह की 35mm फ़िल्म, तीन फ़ॉर्मैट, ज़ूम, और एक्सपोज़र डायल भी।', // ko: 믿음직한 35mm SLR. 모든 35mm 필름과 3가지 비율, 줌, 노출 보정까지. · en: A dependable 35mm SLR. Every 35mm film, three formats, zoom, and an exposure dial.
    snap27: '27 फ़ोटो वाला डिस्पोज़ेबल। हल्का धुंधला प्लास्टिक लेंस, और हर फ़ोटो से पहले चार्ज होने वाला फ़्लैश।', // ko: 27장짜리 일회용 카메라. 살짝 뭉개지는 렌즈, 한 장마다 충전하는 플래시. · en: A 27-shot disposable. A soft plastic lens and a flash you charge before every shot.
    instasq: 'चौकोर इंस्टेंट कैमरा, 10 फ़ोटो वाले पैक। क्लिक करते ही प्रिंट बाहर आता है और धीरे-धीरे तस्वीर उभरती है।', // ko: 정사각 인스턴트, 10장 팩. 찍자마자 사진이 나오고, 천천히 상이 떠올라요. · en: A square instant camera with 10-shot packs. Each print slides out and slowly comes to life.
    half72: '35mm के हर फ़्रेम में दो तस्वीरें, अगल-बगल। एक रोल में 72 हाफ़-फ़्रेम, यानी दोगुने पल।', // ko: 35mm 한 컷에 두 장을 나란히 담는 하프프레임. 한 롤에 72장, 두 배의 순간. · en: Two shots side by side in every frame. 72 half-frames, twice the moments.
    zonelc: 'सुरंग जैसी विनेटिंग और गहरे रंग। गलियों में घूमने वाले दिनों के लिए कॉम्पैक्ट कैमरा।', // ko: 터널 같은 비네팅과 진한 색. 골목을 걷는 날을 위한 컴팩트. · en: Tunnel vignetting and saturated color. A compact made for wandering the streets.
    toy120: 'प्लास्टिक लेंस वाला मीडियम-फ़ॉर्मैट टॉय कैमरा। धुंधले किनारे, गहरी विनेटिंग और बार-बार लाइट लीक।', // ko: 플라스틱 렌즈의 중판 토이 카메라. 흐릿한 가장자리, 짙은 비네팅, 자주 스미는 빛샘. · en: A plastic-lens medium-format toy. Soft edges, deep vignetting, and frequent light leaks.
    quad4: 'चार लेंस, 0.2 सेकंड के अंतर पर एक के बाद एक। एक फ़्रेम में हरकत के चार पल।', // ko: 렌즈 4개가 0.2초 간격으로 차례차례. 한 장에 담기는 네 번의 움직임. · en: Four lenses fire 0.2 s apart. Four moments of motion in one frame.
    doublex: 'एक फ़्रेम, दो एक्सपोज़र। पहले सीन के ऊपर दूसरा सीन घुल जाता है।', // ko: 한 컷에 두 번의 노출. 첫 장면 위로 두 번째 장면이 포개져요. · en: Two exposures, one frame. A second scene settles over the first.
    panox: 'नज़र भर फैले 65:24 पैनोरमा। एक रोल में 21 फ़्रेम।', // ko: 65:24의 넓은 파노라마. 시야 가득, 한 롤에 21장. · en: Sweeping 65:24 panoramas. 21 frames per roll.
    fish180: '180° का गोल फ़िशआई। पूरी दुनिया, एक गोले में।', // ko: 180° 원형 어안. 세상을 동그랗게 담아요. · en: A 180° circular fisheye. The whole world in a circle.
    cine: '2.39:1 एनामॉर्फ़िक वाइडस्क्रीन। तेज़ रोशनी के आर-पार नीली फ़्लेयर की लकीरें।', // ko: 2.39:1 시네마스코프. 밝은 빛을 가로지르는 푸른 플레어. · en: 2.39:1 anamorphic widescreen. Blue streaks of flare across bright lights.
    ccd03: 'सीधे 2003 से आया डिजिकैम। 99 फ़ोटो वाला कार्ड, डिजिटल तारीख़ और तुरंत प्रीव्यू।', // ko: 2003년 그 시절의 디카. 99장 메모리, 디지털 날짜, 찍고 바로 확인. · en: A digicam straight from 2003. 99-shot card, digital date imprint, instant review.
    pixel: '128×112 का पॉकेट पिक्सेल कैमरा। चार रंगों के पैलेट में 30 फ़ोटो।', // ko: 128×112 픽셀의 포켓 카메라. 4색 팔레트에 담는 30장. · en: A 128×112 pocket pixel camera. 30 shots in four-color palettes.
    range: 'शांत रेंजफ़ाइंडर। साफ़ लेंस, ब्राइट फ़्रेम लाइन्स, और डिफ़ॉल्ट रूप से ब्लैक ऐंड व्हाइट।', // ko: 조용한 레인지파인더. 선명한 렌즈, 밝은 프레임 라인, 기본은 흑백. · en: A quiet rangefinder. Crisp lens, bright frame lines, black and white by default.
    aqua27: 'वॉटरप्रूफ़ कवर में 27 फ़ोटो का डिस्पोज़ेबल। नीले-हरे टोन, नर्म लेंस और हर फ़ोटो से पहले चार्ज होने वाला फ़्लैश।', // ko: 방수 하우징을 입은 27장 일회용. 물빛 청록 톤, 부드러운 렌즈, 한 장마다 충전하는 플래시. · en: A 27-shot disposable in a waterproof housing. Blue-green water tones, a soft lens, a flash you charge every shot.
    instaw: 'वाइड फ़ॉर्मैट इंस्टेंट कैमरा, 10 फ़ोटो वाले पैक। चौड़ा प्रिंट बाहर आता है और धीरे-धीरे तस्वीर उभरती है।', // ko: 가로로 넓은 와이드 인스턴트, 10장 팩. 넓게 나온 사진에 천천히 상이 떠올라요. · en: A wide-format instant camera with 10-shot packs. Landscape prints slide out and slowly come to life.
    twin66: 'ऊपर से झाँककर देखने वाला ट्विन-लेंस रिफ़्लेक्स। 12 चौकोर 6×6 फ़्रेम, व्यूफ़ाइंडर में दाएँ-बाएँ उलटी दुनिया।', // ko: 고개 숙여 내려다보는 이안 리플렉스. 6×6 정사각 12장, 파인더 속 세상은 좌우가 뒤바뀌어요. · en: A twin-lens reflex you look down into. 12 square 6×6 frames through a mirror-reversed finder.
    super8: '8mm होम मूवी से निकला एक फ़्रेम। गोल किनारों वाला गेट, गर्म रंग, मोटा ग्रेन।', // ko: 8mm 홈무비에서 꺼낸 한 프레임. 둥근 게이트, 따뜻한 색, 굵은 입자. · en: A single frame from an 8mm home movie. Rounded gate, warm color, heavy grain.
    slide35: 'स्लाइड फ़िल्म के लिए बना कॉम्पैक्ट कैमरा। चटक रंग, सफ़ेद स्लाइड माउंट में लौटकर आते हैं।', // ko: 슬라이드 필름 전용 컴팩트. 쨍한 색을 하얀 마운트에 담아 돌려줘요. · en: A compact made for slide film. Vivid color, returned in white slide mounts.
    party: 'पार्टी कॉम्पैक्ट, जिसका बड़ा फ़्लैश पहले से चालू रहता है। सामने से पड़ता तेज़ फ़्लैश और तारीख़ की छाप।', // ko: 큼직한 플래시가 기본으로 켜지는 파티용 컴팩트. 정면으로 터지는 강한 플래시와 날짜 각인. · en: A party compact whose big flash is on by default. Hard, direct flash and a date imprint.
    kidcam: '0.3 MP का बच्चों का कैमरा। 640 px, एकदम चटक रंग, डिजिटल तारीख़ और तुरंत प्रीव्यू।', // ko: 0.3메가 어린이 디카. 640픽셀, 넘치는 채도, 디지털 날짜, 찍고 바로 확인. · en: A 0.3 MP kids’ camera. 640 px, colors turned all the way up, digital date, instant review.
    sprocket: 'स्प्रॉकेट होल्स तक फैला पैनोरमा। हर फ़ोटो के ऊपर-नीचे फ़िल्म के छेद दिखते हैं।', // ko: 필름 구멍까지 담기는 파노라마. 사진 위아래로 퍼포레이션이 그대로 남아요. · en: A panorama that runs right over the sprocket holes, so the perforations frame every shot.
    floppy98: 'फ़्लॉपी डिस्क पर सेव करने वाला 1998 का डिजिकैम। हर डिस्क में 640 px की 20 फ़ोटो, ठंडे और धुंधले रंग।', // ko: 플로피 디스크에 저장하는 1998년 디카. 디스크 한 장에 640픽셀 사진 20장, 차갑고 뭉개진 색. · en: A 1998 digicam that saves to a floppy disk. 20 shots of 640 px per disk, cool smeared color.
    slim06: 'जेब में आने वाला 7 MP का अल्ट्रा-स्लिम कैमरा। चटक रंग, पहले से चालू फ़्लैश और डिजिटल तारीख़।', // ko: 주머니에 쏙 들어가는 700만 화소 초슬림 디카. 쨍한 색, 기본으로 켜지는 플래시, 디지털 날짜. · en: A 7 MP ultra-slim for your pocket. Punchy color, flash on by default, digital date.
    bridge09: '20× सुपरज़ूम। दूर की चीज़ें पास लाएँ, 4:3, 3:2 या 1:1 में।', // ko: 20배 줌의 하이줌 디카. 먼 곳도 당겨 찍고, 4:3·3:2·1:1 세 가지 비율로. · en: A 20× superzoom. Pull in what’s far away, in 4:3, 3:2 or 1:1.
    zoom90: '90 के दशक का ज़ूम कॉम्पैक्ट। 2× ज़ूम, मोटर वाइंड और नारंगी तारीख़।', // ko: 90년대 자동 줌 카메라. 2배 줌, 모터 감기, 주황색 날짜 각인. · en: A 90s auto zoom compact. 2× zoom, motor wind, orange date imprint.
    mf645: '6×4.5 मीडियम फ़ॉर्मैट। हर रोल में 15 फ़्रेम, बेहद शार्प लेंस और चौड़ी टोनल रेंज।', // ko: 6×4.5 중형 필름. 롤 하나에 15장, 아주 선명한 렌즈와 넓은 계조. · en: 6×4.5 medium format. 15 frames a roll, a very sharp lens and a long tonal range.
    pinhole: 'लेंस की जगह एक पिनहोल वाला लकड़ी का डिब्बा। हर तरफ़ नरमी और गहरे, अँधेरे कोने।', // ko: 렌즈 대신 바늘구멍 하나로 찍는 나무 상자. 전체가 부드럽고 가장자리는 깊게 어두워요. · en: A wooden box with a pinhole instead of a lens. Soft all over, with deep, dark corners.
    flip03: '2004 के Motorola RAZR V3 का 0.3 MP कैमरा। 640 px, फीके रंग और धुंधली डिटेल।', // ko: 2004년 모토로라 RAZR V3의 30만 화소 카메라. 640픽셀, 바랜 색, 뭉개진 디테일. · en: The 0.3 MP camera of the 2004 Motorola RAZR V3. 640 px, faded color, smeared detail.
    touch07: 'पहले iPhone (2007) का 2 MP कैमरा। फ़िक्स्ड फ़ोकस, गर्म टोन और सफ़ेद पड़ा आसमान।', // ko: 2007년 첫 아이폰의 200만 화소 카메라. 고정 초점, 따뜻한 톤, 하얗게 날아간 하늘. · en: The 2 MP camera of the first iPhone (2007). Fixed focus, warm tones, blown-out skies.
    curve07: '2007 के BlackBerry Curve का 2 MP कैमरा। ठंडा व्हाइट बैलेंस, ज़्यादा शार्पनिंग और खुरदरा नॉइज़।', // ko: 2007년 블랙베리 커브의 200만 화소 카메라. 차가운 화이트밸런스, 강한 샤픈, 자글자글한 노이즈. · en: The 2 MP camera of the 2007 BlackBerry Curve. Cool white balance, heavy sharpening, gritty noise.
    filter10: 'iPhone 4 और 2010 के फ़ोटो ऐप फ़िल्टर। चौकोर फ़ोटो, हल्का काला, पीली हाइलाइट और सफ़ेद बॉर्डर।', // ko: 2010년 아이폰 4와 사진 앱 필터 감성. 정사각 사진, 들뜬 검정, 노란 하이라이트, 하얀 테두리. · en: The iPhone 4 and the 2010 photo-app filters. Square shots, lifted blacks, yellow highlights, a white border.
  },
  /** Type word in the era line "1979 · SLR" (guide §3.3). The year and " · " are added by the app. */
  era: {
    SLR: 'SLR',
    Disposable: 'डिस्पोज़ेबल',
    Instant: 'इंस्टेंट',
    'Half-frame': 'हाफ़-फ़्रेम',
    Compact: 'कॉम्पैक्ट',
    '120 toy': '120 टॉय',
    '4-lens': '4-लेंस',
    'Multi-ex': 'मल्टी-एक्सपोज़र',
    Panoramic: 'पैनोरमिक',
    Fisheye: 'फ़िशआई',
    Anamorphic: 'एनामॉर्फ़िक',
    Digicam: 'डिजिकैम',
    '2-bit': '2-बिट',
    Rangefinder: 'रेंजफ़ाइंडर',
    Waterproof: 'वॉटरप्रूफ़',
    Wide: 'वाइड',
    TLR: 'TLR',
    'Home movie': 'होम मूवी',
    Slide: 'स्लाइड',
    'Big flash': 'बिग फ़्लैश',
    'Kids digicam': 'बच्चों का डिजिकैम',
    Sprocket: 'स्प्रॉकेट',
    'Floppy digicam': 'फ़्लॉपी डिजिकैम',
    'Ultra-slim': 'अल्ट्रा-स्लिम',
    Superzoom: 'सुपरज़ूम',
    'Zoom compact': 'ज़ूम कॉम्पैक्ट',
    'Medium format': 'मीडियम फ़ॉर्मैट',
    Pinhole: 'पिनहोल',
    'Flip phone': 'फ़्लिप फ़ोन',
    Smartphone: 'स्मार्टफ़ोन',
    'Filter app': 'फ़िल्टर ऐप',
    'QWERTY phone': 'QWERTY फ़ोन',
  },
};

/** Film stock / sensor descriptions (expressive register). Film names stay in Latin letters. */
export const stockText: LocaleStockText = {
  sunny200: 'धूप भरे गर्म पीले रंग। सफ़र और रोज़मर्रा के लिए क्लासिक फ़िल्म।', // ko: 햇살을 머금은 따뜻한 노랑. 여행과 일상 스냅의 정석. · en: Warm yellows full of sunshine. The classic film for travel and everyday snapshots.
  muse400: 'कोमल स्किन टोन और पेस्टल हाइलाइट्स। पोर्ट्रेट के लिए बनी फ़िल्म।', // ko: 부드러운 피부톤, 파스텔빛 하이라이트. 사람을 담기 좋은 인물용 필름. · en: Gentle skin tones and pastel highlights. Made for portraits.
  mint400: 'परछाइयों में हल्की हरी झलक। फ़्रेम में शहर की हवा।', // ko: 그늘에 살짝 도는 초록빛. 도시와 거리의 공기. · en: A hint of green in the shadows. City air in a frame.
  snap800: 'वही डिस्पोज़ेबल वाला पुराना एहसास। फ़्लैश, गहरी विनेटिंग और अनजाने में आए लाइट लीक।', // ko: 일회용 카메라, 그때 그 느낌. 플래시, 진한 비네팅, 우연이 만든 빛샘. · en: Straight out of a disposable. Flash, deep vignetting, and leaks by happy accident.
  mono400: 'गहरा काला और खुरदुरा ग्रेन। जो जैसा है, वैसा ही दिखाती ब्लैक ऐंड व्हाइट।', // ko: 깊은 검정과 거친 입자의 흑백. 있는 그대로를 담는 다큐멘터리의 결. · en: Deep blacks and gritty grain. Black and white that tells it straight.
  insta600: 'हल्के फीके रंग और सफ़ेद बॉर्डर। हाथ में थमे इंस्टेंट प्रिंट की गर्माहट।', // ko: 살짝 바랜 색과 하얀 테두리. 손에 쥐는 즉석 사진의 온기. · en: Softly faded color in a white frame. The warmth of an instant print.
  neon800t: 'टंगस्टन सिनेमा फ़िल्म। नियॉन लाइट्स के आसपास फैलता लाल ग्लो।', // ko: 텅스텐 시네마 필름. 네온 불빛 둘레로 번지는 붉은 할레이션. · en: Tungsten cinema film. Red halation blooms around neon lights.
  velvet50: 'चटक रंग और गहरा कंट्रास्ट। लैंडस्केप के लिए बनी स्लाइड फ़िल्म।', // ko: 쨍한 채도와 높은 대비의 슬라이드 필름. 풍경을 위한 필름. · en: Rich saturation and bold contrast. A slide film for landscapes.
  chrome100: 'साफ़, ठंडे स्लाइड टोन। काँच-सा निखरा आसमान।', // ko: 맑고 차가운 슬라이드 톤. 투명하게 갠 하늘. · en: Clean, cool slide tones. Skies as clear as glass.
  silver100: 'महीन ग्रेन और टोन की लंबी रेंज। रोशनी की बारीकियों वाली ब्लैक ऐंड व्हाइट।', // ko: 고운 입자와 넓은 계조. 빛의 결이 섬세한 흑백. · en: Fine grain and a long tonal range. Black and white in quiet, subtle shades.
  dream160: 'कम कंट्रास्ट और हवा जैसे हल्के पेस्टल।', // ko: 낮은 대비, 공기처럼 가벼운 파스텔. · en: Low contrast and pastels as light as air.
  expired98: '1998 में एक्सपायर हो चुकी फ़िल्म। मैजेंटा धुंध, धूल, और हर फ़्रेम में एक सरप्राइज़।', // ko: 1998년에 만료된 필름. 마젠타 포그와 먼지, 결과는 현상해 봐야 알아요. · en: Expired in 1998. Magenta fog, dust, and a surprise in every frame.
  xpro200: 'नेगेटिव (C-41) की तरह क्रॉस-प्रोसेस की गई स्लाइड फ़िल्म। तीखा कंट्रास्ट, लाइम जैसी हाइलाइट्स, टील परछाइयाँ।', // ko: 슬라이드 필름을 네거티브(C-41)로 교차현상. 강한 대비, 연둣빛 하이라이트, 청록빛 그림자. · en: Slide film cross-processed as negative (C-41). Hard contrast, lime highlights, teal shadows.
  instamini: 'चमकीली, ताज़ा मिनी इंस्टेंट फ़िल्म — साफ़ सफ़ेद और हल्की ठंडक।', // ko: 밝고 산뜻한 미니 인스턴트. 깨끗한 화이트와 살짝 차가운 톤. · en: Bright, crisp mini instant film with clean whites and a cool touch.
  ccd: '2000 के दशक की शुरुआत के डिजिकैम का CCD। उड़ी हुई हाइलाइट्स, हल्की नीली झलक, बैंगनी किनारे।', // ko: 2000년대 초 디카의 CCD. 날아가는 하이라이트, 푸르스름한 톤, 보랏빛 번짐. · en: The CCD of an early-2000s digicam. Clipped highlights, a blue cast, purple fringing.
  pixel: '128 पिक्सेल, 2-बिट सेंसर। सिर्फ़ चार रंग और डिदरिंग।', // ko: 128픽셀 2비트 센서. 단 4가지 색과 디더링. · en: A 128-pixel, 2-bit sensor. Just four colors and dithering.
  aqua400: 'पानी के अंदर की डिस्पोज़ेबल फ़िल्म। लाल रंग नीली-हरी धुंध में घुल जाते हैं, ग्रेन नर्म रहता है।', // ko: 물속 일회용 필름. 붉은빛이 바래 사라진 청록 톤, 뿌연 입자. · en: Underwater disposable film. Reds fade into a blue-green haze, with soft grain.
  instawide: 'वाइड इंस्टेंट फ़िल्म। नैचुरल रंग और हल्की गर्म हाइलाइट्स।', // ko: 와이드 인스턴트 필름. 자연스러운 색에 살짝 따뜻한 하이라이트. · en: Wide instant film. Natural color with gently warm highlights.
  reel40: 'होम मूवी रिवर्सल फ़िल्म। गर्म, गहरे रंग, मोटा ग्रेन और धूल भरा गेट।', // ko: 홈무비 리버설 필름. 따뜻하고 진한 색, 굵은 입자, 먼지 앉은 게이트. · en: Home-movie reversal film. Warm, saturated color, big grain, and a dusty gate.
  toycmos: '0.3 MP का टॉय सेंसर: टॉफ़ी जैसे रंग, उड़ी हुई हाइलाइट्स और धब्बेदार कलर नॉइज़।', // ko: 0.3메가 장난감 센서. 사탕 같은 색, 날아간 하이라이트, 얼룩덜룩한 색 노이즈. · en: A 0.3 MP toy sensor: candy colors, blown highlights, blotchy color noise.
  vga98: '90 के दशक के आख़िर के फ़्लॉपी डिजिकैम का सेंसर: कम टोनल रेंज, ठंडा टिंट और धुंधला JPEG।', // ko: 90년대 말 플로피 디카의 센서. 좁은 계조, 차가운 톤, 뭉개진 JPEG. · en: A late-90s floppy-disk sensor. Short tonal range, a cool cast, soft JPEG blur.
  ccd7: '2000 के दशक के मध्य का 7 MP CCD: चटक रंग, गर्म स्किन टोन, ज़्यादा शार्पनिंग और जल्दी उड़ने वाली हाइलाइट्स।', // ko: 2000년대 중반 700만 화소 CCD. 쨍한 색, 따뜻한 피부, 과한 샤프닝, 확 날아가는 하이라이트. · en: A mid-2000s 7 MP CCD. Punchy color, warm skin, crunchy sharpening, hard-clipped highlights.
  vgaphone: 'शुरुआती कैमरा फ़ोन का सेंसर: फीके रंग, पीला-हरा टिंट और नॉइज़ भरी छायाएँ।', // ko: 초기 폰카 센서. 바랜 색, 누르스름한 초록빛, 자글자글한 그림자. · en: An early camera-phone sensor. Washed out, a green-yellow cast, noisy shadows.
  phone2mp: 'पहली पीढ़ी के स्मार्टफ़ोन का सेंसर: गर्म व्हाइट बैलेंस, सफ़ेद पड़ा आसमान और नरम डिटेल।', // ko: 1세대 스마트폰 센서. 따뜻한 화이트밸런스, 날아간 하늘, 부드러운 디테일. · en: A first-generation smartphone sensor. Warm white balance, blown skies, soft detail.
  bbcurve: 'QWERTY फ़ोन का सेंसर: नीला टोन, ज़रूरत से ज़्यादा शार्प किनारे और छायाओं में मोटा नॉइज़।', // ko: 쿼티폰 센서. 푸르스름한 톤, 과한 샤픈, 거친 그림자 노이즈. · en: A QWERTY-phone sensor. Bluish tones, over-sharpened edges, coarse shadow noise.
  app10: '2010 के दशक की शुरुआत का फ़ोटो ऐप फ़िल्टर: मैट काले, पीली हाइलाइट्स और गहरा विनेट।', // ko: 2010년대 초 사진 앱 필터. 들뜬 검정, 노란 하이라이트, 진한 비네팅. · en: An early-2010s photo-app filter. Matte blacks, yellow highlights, a heavy vignette.
};
