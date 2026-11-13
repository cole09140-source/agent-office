/**
 * Film Camela — Arabic (Modern Standard) (ar). Lazy-loaded when this language is chosen or detected.
 *
 * TRANSLATOR CONTRACT — read docs/10_LOCALIZATION_GUIDE.md first (§2.10, §7 for this language, §3 names,
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
 *    All six categories: zero (0) · one (1) · two (2) · few (3–10) · many (11–99) · other (100, 101…).
 *     '{n, plural, zero {لا صور} one {صورة واحدة} two {صورتان} few {# صور} many {# صورة} other {# صورة}}'
 *     one/two forms usually carry no number; that is allowed. The UI is right-to-left and uses Western digits;
 *     the app isolates {stock}/{name}/{time}… and signed numbers itself: never type bidi control characters.
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
  'app.tagline': 'كاميرا فيلم تحفظ صورك الأصلية كما هي', // ko: 원본이 그대로 남는 필름 카메라 · en: The film camera that keeps every original
  'tab.camera': 'الكاميرا', // from guide §8.3 · en: Camera
  'tab.models': 'الطرازات',
  'models.sub': '{n} كاميرا · اضغط على واحدة لتلتقط بها',
  'models.inUse': 'قيد الاستخدام',
  'tab.lab': 'المعمل', // from guide §8.3 · en: Lab
  'tab.gallery': 'الألبوم', // from guide §8.3 · en: Album
  'tab.analog': 'تناظري', // from guide §8.3 · en: Analog
  'tab.settings': 'صفحتي',
  'common.cancel': 'إلغاء', // ko: 취소 · en: Cancel
  'common.close': 'إغلاق', // ko: 닫기 · en: Close
  'common.save': 'حفظ', // ko: 저장 · en: Save
  'common.delete': 'حذف', // ko: 삭제 · en: Delete
  'common.done': 'تم', // ko: 완료 · en: Done
  'common.retry': 'إعادة المحاولة', // ko: 다시 시도 · en: Retry
  'common.back': 'رجوع', // ko: 뒤로 · en: Back
  'common.next': 'التالي', // ko: 다음 · en: Next
  'common.start': 'البدء', // ko: 시작하기 · en: Get started
  'common.on': 'تشغيل', // ko: 켜짐 · en: On
  'common.off': 'إيقاف', // ko: 꺼짐 · en: Off
  'common.pro': 'PRO', // ko: PRO · en: PRO
  'common.loading': 'جارٍ التحميل…', // ko: 불러오는 중… · en: Loading…
  'common.error': 'حدثت مشكلة. يُرجى المحاولة مرة أخرى.', // ko: 잠시 문제가 생겼어요. 다시 시도해 주세요. · en: Something went wrong. Please try again.
  'toast.close': 'إغلاق التنبيه', // ko: 알림 닫기 · en: Dismiss
  'lab.developedMany': '{n, plural, zero {لا أفلام محمّضة} one {اكتمل تحميض فيلم واحد} two {اكتمل تحميض فيلمين} few {اكتمل تحميض # أفلام} many {اكتمل تحميض # فيلمًا} other {اكتمل تحميض # فيلم}}', // ko: 롤 {n}개 현상이 끝났어요 · en: {n} rolls developed
  'cam.loadCard': 'إدخال بطاقة ذاكرة', // ko: 메모리 카드 넣기 · en: Insert card
  'cam.loadPack': 'إدخال عبوة فيلم', // ko: 필름 팩 넣기 · en: Load film pack
  'cam.useCamera': 'التصوير بهذه الكاميرا', // ko: 이 카메라로 찍기 · en: Use this camera
  'cam.allCameras': 'عرض الكل', // ko: 모두 보기 · en: All cameras
  'cam.allCamerasTitle': 'كل الكاميرات', // ko: 카메라 모두 보기 · en: All cameras
  'cam.group.film': 'كاميرات فيلم', // ko: 필름 카메라 · en: Film cameras
  'cam.group.instant': 'كاميرات فورية', // ko: 즉석 카메라 · en: Instant cameras
  'cam.group.digital': 'كاميرات رقمية', // ko: 디지털 · en: Digital
  'cam.group.toy': 'كاميرات لعبة وخاصة', // ko: 토이·특수 카메라 · en: Toy & special
  'cam.group.phone': 'كاميرات الهواتف', // ko: 휴대폰 카메라 · en: Phone cameras
  'a11y.stockKeys': 'تصفّح الأفلام بمفتاحي الأسهم، واختر بمفتاح Enter', // ko: ← → 키로 필름을 살펴보고 Enter로 골라요 · en: Arrow keys browse films; Enter selects
  'gal.importHint': 'تُحمَّض صورك بالفيلم الذي اخترته، ويمكنك تغييره في الغرفة المظلمة متى شئت.', // ko: 고른 필름으로 현상해요. 다크룸에서 언제든 바꿀 수 있어요. · en: Your photos develop with this film. You can change it in the darkroom any time.
  'onb.restore': 'هل انتقلت من هاتف آخر؟ استعادة نسخة احتياطية', // ko: 이전 폰에서 옮겨 오셨나요? 백업 불러오기 · en: Coming from another phone? Restore a backup
  'onb.1.title': 'كالفيلم، لقطة تلو الأخرى', // ko: 필름처럼, 한 장씩 · en: Shoot like film
  'onb.1.body': 'اختر كاميرا والتقط فورًا. تصل كل صورة إلى ألبومك لحظة التقاطها.',
  'onb.2.title': 'اسحب لتغيير الكاميرا',
  'onb.2.body': 'اسحب صف الكاميرات أسفل منظار الرؤية. التقط بالكاميرا التي تتوقف في المنتصف، فلكل كاميرا ألوانها الخاصة.',
  'onb.3.title': 'أعد التحميض في الغرفة المظلمة متى شئت', // ko: 다크룸에서 언제든 다시 현상 · en: Re-develop in the darkroom
  'onb.3.body': 'صورتك الأصلية محفوظة دائمًا. جرّب فيلمًا آخر، أو سطوعًا مختلفًا، أو مظهر الفيلم القديم، أو الوهج، كلما أردت.', // ko: 찍은 원본은 언제나 그대로 남아요. 필름, 밝기, 오래된 필름 느낌, 빛 번짐까지 몇 번이고 다시 골라 보세요. · en: Your original is always kept. Try another film, brightness, aged-film look, or glow, as often as you like.
  'onb.privacy': '{n, plural, zero {لا لقطات مجانية يوميًا} one {لقطة مجانية واحدة يوميًا} two {لقطتان مجانيتان يوميًا} few {# لقطات مجانية يوميًا} many {# لقطة مجانية يوميًا} other {# لقطة مجانية يوميًا}}. بلا حساب. تبقى كل صورك على هذا الجهاز فقط.',
  'cam.loadFilm': 'إدخال فيلم', // ko: 필름 넣기 · en: Load film
  'cam.chooseFilm': 'اختر فيلمك', // ko: 필름을 고르세요 · en: Choose your film
  'cam.exposures': '{n, plural, zero {0 لقطة} one {لقطة واحدة} two {لقطتان} few {# لقطات} many {# لقطة} other {# لقطة}}', // ko: {n}장 · en: {n} exp
  'cam.load': 'إدخال هذا الفيلم', // ko: 이 필름 넣기 · en: Load this film
  'cam.left': 'المتبقي {n}', // ko: {n}장 남음 · en: {n} left
  'cam.rewind': 'إرسال للتحميض', // ko: 현상소로 보내기 · en: Send to lab
  'cam.rollFull': 'صوّرت الفيلم حتى آخر لقطة', // ko: 롤을 끝까지 다 찍었어요 · en: Roll finished
  'cam.sendToLab': 'إرسال للتحميض', // ko: 현상소로 보내기 · en: Send to lab
  'cam.flash': 'الفلاش', // ko: 플래시 · en: Flash
  'cam.timer': 'المؤقت', // ko: 타이머 · en: Timer
  'cam.grid': 'الشبكة', // ko: 격자 · en: Grid
  'cam.date': 'التاريخ', // ko: 날짜 · en: Date
  'cam.flip': 'تبديل الكاميرا', // ko: 카메라 전환 · en: Switch camera
  'cam.zoom': 'التكبير', // ko: 줌 · en: Zoom
  'cam.aspect': 'النسبة', // ko: 비율 · en: Format
  'cam.shutter': 'التقاط صورة', // ko: 촬영 · en: Take photo
  'cam.noCamera.title': 'الكاميرا غير متاحة', // ko: 카메라를 사용할 수 없어요 · en: Camera unavailable
  'cam.noCamera.body': 'اسمح بالوصول إلى الكاميرا من إعدادات المتصفح أو الجهاز. وحتى ذلك الحين، يمكنك استيراد صور من جهازك وتحميضها.', // ko: 브라우저나 기기 설정에서 카메라 권한을 허용해 주세요. 그동안 기기에 있는 사진을 불러와 현상할 수도 있어요. · en: Allow camera access in your browser or device settings. In the meantime, you can import photos and develop them.
  'cam.noCamera.import': 'استيراد الصور',
  'cam.starting': 'جارٍ تشغيل الكاميرا…', // ko: 카메라 준비 중… · en: Starting camera…
  'cam.saved': 'اللقطة {n}', // ko: {n}번째 컷 · en: Frame {n}
  'cam.rewindConfirm': '{n, plural, zero {لم تلتقط أي صورة بعد} one {التقطت {shots}} two {التقطت لقطتين} few {التقطت {shots}} many {التقطت {shots}} other {التقطت {shots}}}. {m, plural, zero {هل تريد إرسال الفيلم للتحميض؟} one {هل تريد إرسال الفيلم للتحميض مع ترك اللقطة المتبقية فارغة؟} two {هل تريد إرسال الفيلم للتحميض مع ترك اللقطتين المتبقيتين فارغتين؟} few {هل تريد إرسال الفيلم للتحميض مع ترك اللقطات المتبقية ({left}) فارغة؟} many {هل تريد إرسال الفيلم للتحميض مع ترك اللقطات المتبقية ({left}) فارغة؟} other {هل تريد إرسال الفيلم للتحميض مع ترك اللقطات المتبقية ({left}) فارغة؟}}', // ko: {shots} 찍었어요. 남은 {left}은 비워 둔 채 현상소로 보낼까요? · en: You’ve taken {shots}. Send this roll to the lab? The remaining {left} will stay blank. [+ counts: n, m]
  'cam.emptyRewind': 'لا توجد لقطات بعد. إذا أخرجت الفيلم الآن، فستخسره.', // ko: 아직 찍은 사진이 없어요. 지금 필름을 빼면 이 롤은 사라져요. · en: No shots yet. If you unload now, this roll is discarded.
  'cam.unload': 'إخراج الفيلم', // ko: 필름 빼기 · en: Unload film
  'cam.rollSize': 'عدد اللقطات', // ko: 롤 장수 · en: Roll size
  'cam.rollInfo': 'معلومات الفيلم', // ko: 롤 정보 · en: roll info
  'cam.sec': '{n} ث', // ko: {n}초 · en: {n}s
  'cam.err.insecure': 'لا تعمل الكاميرا إلا عبر اتصال آمن (HTTPS). افتح عنوان https.', // ko: 카메라는 보안 연결(HTTPS)에서만 쓸 수 있어요. https 주소로 열어 주세요. · en: The camera only works over a secure (HTTPS) connection. Open the https address.
  'cam.err.unsupported': 'هذا المتصفح لا يدعم الكاميرا. جرّب أحدث إصدار من Safari أو Chrome.', // ko: 이 브라우저는 카메라를 지원하지 않아요. 최신 Safari나 Chrome에서 열어 주세요. · en: This browser doesn't support the camera. Try the latest Safari or Chrome.
  'cam.err.busy': 'تطبيق آخر يستخدم الكاميرا. أغلقه ثم حاول مرة أخرى. وحتى ذلك الحين، يمكنك استيراد صور من جهازك وتحميضها.', // ko: 다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해 주세요. 그동안 기기의 사진을 불러와 현상할 수 있어요. · en: Another app is using the camera. Close it and try again. In the meantime, you can import photos and develop them.
  'cam.err.notfound': 'لم يُعثر على كاميرا في هذا الجهاز. يمكنك بدلًا من ذلك استيراد صور وتحميضها.', // ko: 이 기기에서 카메라를 찾지 못했어요. 대신 기기의 사진을 불러와 현상할 수 있어요. · en: No camera was found on this device. You can import photos and develop them instead.
  'cam.quadProgress': 'العدسة {n}/4', // ko: 렌즈 {n}/4 · en: Lens {n}/4
  'common.skip': 'تخطي', // ko: 건너뛰기 · en: Skip
  'view.savedToast': 'تم حفظ الصورة', // ko: 이미지를 저장했어요 · en: Image saved
  'view.prev': 'الصورة السابقة', // ko: 이전 사진 · en: Previous photo
  'view.next': 'الصورة التالية', // ko: 다음 사진 · en: Next photo
  'view.photoN': 'الصورة {n}', // ko: {n}번째 사진 · en: Photo {n}
  'dr.applyRollConfirm': 'هل تريد تطبيق هذه الإعدادات على كل صور الفيلم؟', // ko: 이 설정을 롤의 모든 사진에 적용할까요? · en: Apply these settings to every photo in the roll?
  'dr.original': 'الأصل', // ko: 원본 · en: Original
  'dr.showOriginal': 'عرض الأصل', // ko: 원본 보기 · en: Show original
  'dr.years': '{n, plural, zero {0 سنة} one {سنة واحدة} two {سنتان} few {# سنوات} many {# سنة} other {# سنة}}', // ko: {n}년 · en: {n, plural, one {# year} other {# years}}
  'an.log.deleteFrame': 'حذف سجل اللقطة {n}', // ko: {n}번 컷 기록 삭제 · en: Delete frame {n} log
  'lab.rushFor': 'التحميض الآن · {stock}', // ko: 지금 바로 현상 · {stock} · en: Develop now · {stock}
  'speed.default': 'الافتراضي', // ko: 기본 · en: default
  'palette.moss': 'طحلبي', // ko: 이끼 · en: Moss
  'palette.mono': 'رمادي', // ko: 흑백 · en: Mono
  'palette.sepia': 'سيبيا', // ko: 세피아 · en: Sepia
  'palette.ice': 'جليدي', // ko: 얼음 · en: Ice
  'palette.berry': 'توتي', // ko: 베리 · en: Berry
  'cam.chooseCamera': 'اختر كاميرتك', // ko: 카메라를 고르세요 · en: Choose your camera
  'cam.film': 'الفيلم', // ko: 필름 · en: Film
  'cam.fixedFilm': 'فيلم مدمج', // ko: 전용 필름 · en: Built-in film
  'cam.pin': 'تثبيت كاميرا {name}', // ko: {name} 고정 · en: Pin {name}
  'cam.pinHint': 'تثبيت في المقدمة', // ko: 맨 앞에 고정 · en: Pin to the front
  'cam.pinned': 'مثبّتة', // ko: 고정됨 · en: Pinned
  'cam.pinnedSay': 'تم تثبيت كاميرا {name} · تظهر الآن في المقدمة', // ko: {name} 고정했어요 · 맨 앞에 보여요 · en: {name} pinned to the front
  'cam.unpinnedSay': 'تم إلغاء تثبيت كاميرا {name}', // ko: {name} 고정을 풀었어요 · en: {name} unpinned
  'cam.pinnedToast': 'تم تثبيت كاميرا {name} · نُقلت إلى المقدمة', // ko: {name} 고정 · 맨 앞으로 옮겼어요 · en: {name} pinned · moved to the front
  'cam.pinShow': 'عرض', // ko: 보기 · en: Show
  'cam.otherWindow': 'التُقطت بالفعل في نافذة أخرى', // ko: 다른 창에서 이미 찍었어요 · en: Already taken in another window
  'cam.pressesDropped': '{n, plural, zero {لم تُلغَ أي ضغطة} one {أُلغيت ضغطة واحدة} two {أُلغيت ضغطتان} few {أُلغيت # ضغطات} many {أُلغيت # ضغطة} other {أُلغيت # ضغطة}}', // ko: {n}번 누른 건 취소됐어요 · en: {n, plural, one {# press was} other {# presses were}} cancelled
  'cam.quickStart': 'بداية سريعة', // ko: 빠른 시작 · en: Quick start
  'cam.quick.film': 'كاميرا فيلم', // ko: 일반 필름 · en: Film camera
  'cam.quick.instant': 'صورة فورية', // ko: 즉석 사진 · en: Instant photo
  'cam.quick.disposable': 'أحادية الاستخدام', // ko: 일회용 · en: Disposable
  'cam.pack': '{n, plural, zero {عبوة فارغة} one {عبوة من لقطة واحدة} two {عبوة من لقطتين} few {عبوة من # لقطات} many {عبوة من # لقطة} other {عبوة من # لقطة}}', // ko: {n}장 팩 · en: {n}-shot pack
  'cam.card': '{n, plural, zero {بطاقة فارغة} one {بطاقة من لقطة واحدة} two {بطاقة من لقطتين} few {بطاقة من # لقطات} many {بطاقة من # لقطة} other {بطاقة من # لقطة}}', // ko: {n}장 메모리 · en: {n}-shot card
  'cam.halves': '{n, plural, zero {0 نصف إطار} one {نصف إطار واحد} two {نصفا إطار} few {# أنصاف إطار} many {# نصف إطار} other {# نصف إطار}}', // ko: 하프 {n}장 · en: {n} half-frames
  'cam.flashCharge': 'اضغط لشحن الفلاش', // ko: 탭해서 플래시 충전 · en: Tap to charge the flash
  'cam.flashCharging': 'جارٍ الشحن…', // ko: 충전 중… · en: Charging…
  'cam.flashReady': 'الفلاش جاهز', // ko: 플래시 준비됨 · en: Flash ready
  'cam.ev': 'التعريض', // ko: 노출 · en: Exposure
  'cam.palette': 'الألوان', // ko: 팔레트 · en: Palette
  'cam.halfNext': 'اللقطة التالية تملأ النصف الأيمن', // ko: 다음 장은 오른쪽 칸에 찍혀요 · en: Next shot fills the right half
  'cam.double1': 'اكتمل التعريض الأول · ابحث الآن عن المشهد الثاني', // ko: 첫 번째 노출 완료 · 겹쳐 담을 장면을 찾아보세요 · en: First exposure done · now find the second scene
  'cam.quadHint': 'ضغطة واحدة، وأربع عدسات تلتقط بالتتابع', // ko: 한 번 누르면 렌즈 4개가 차례로 찍어요 · en: One press, four lenses in sequence
  'cam.inCamera': 'قيد التصوير',
  'cam.lastShot': 'آخر لقطة', // ko: 마지막 사진 · en: Last shot
  'cam.packDone': 'انتهت العبوة. صورك تنتظرك في الألبوم.', // ko: 팩을 다 썼어요. 사진은 앨범에서 기다리고 있어요. · en: Pack finished. Your photos are waiting in the album.
  'cam.nShots': '{n, plural, zero {0 لقطة} one {لقطة واحدة} two {لقطتان} few {# لقطات} many {# لقطة} other {# لقطة}}', // ko: {n}장 · en: {n, plural, one {# shot} other {# shots}}
  'cam.nHalves': '{n, plural, zero {0 نصف إطار} one {نصف إطار واحد} two {نصفا إطار} few {# أنصاف إطار} many {# نصف إطار} other {# نصف إطار}} ({f, plural, zero {0 إطار} one {إطار واحد} two {إطاران} few {# إطارات} many {# إطارًا} other {# إطار}})', // ko: {n}컷({f}프레임) · en: {n, plural, one {# half} other {# halves}} ({f, plural, one {# frame} other {# frames}})
  'cam.nHalfShots': '{n, plural, zero {0 نصف إطار} one {نصف إطار واحد} two {نصفا إطار} few {# أنصاف إطار} many {# نصف إطار} other {# نصف إطار}}', // ko: {n}컷 · en: {n, plural, one {# half} other {# halves}}
  'cam.develop': 'إلى المعمل', // ko: 현상소로 · en: Send to lab
  'cam.finishPack': 'إخراج العبوة', // ko: 팩 꺼내기 · en: Finish pack
  'cam.finishCard': 'إنهاء البطاقة', // ko: 카드 정리 · en: Finish card
  'cam.rewindSub': 'يُلَفّ الفيلم ويُرسل إلى المعمل، وبعد التحميض تجد الصور في ألبومك.', // ko: 필름을 감아 현상소로 보내요. 현상이 끝나면 앨범에서 볼 수 있어요. · en: The roll goes to the lab. Once developed, the photos appear in your album.
  'cam.finishSubViewable': 'صورك في الألبوم بالفعل، وبعد الإنهاء يمكنك البدء من جديد.', // ko: 사진은 이미 앨범에 있어요. 정리하면 새로 넣을 수 있어요. · en: Your photos are already in the album. Finish to start a fresh one.
  'cam.finishPackConfirm': '{n, plural, zero {لم تلتقط أي صورة بعد} one {التقطت {shots}} two {التقطت لقطتين} few {التقطت {shots}} many {التقطت {shots}} other {التقطت {shots}}}. {m, plural, zero {هل تريد إخراج العبوة؟} one {هل تريد إخراج العبوة دون استخدام اللقطة المتبقية؟} two {هل تريد إخراج العبوة دون استخدام اللقطتين المتبقيتين؟} few {هل تريد إخراج العبوة دون استخدام اللقطات المتبقية ({left})؟} many {هل تريد إخراج العبوة دون استخدام اللقطات المتبقية ({left})؟} other {هل تريد إخراج العبوة دون استخدام اللقطات المتبقية ({left})؟}}', // ko: {shots} 찍었어요. 팩에 남은 {left}은 쓰지 않고 꺼낼까요? · en: {shots} taken. Finish the pack? The remaining {left} will go unused. [+ counts: n, m]
  'cam.finishCardConfirm': '{n, plural, zero {لم تلتقط أي صورة بعد} one {التقطت {shots}} two {التقطت لقطتين} few {التقطت {shots}} many {التقطت {shots}} other {التقطت {shots}}}. {m, plural, zero {هل تريد إنهاء البطاقة؟} one {هل تريد إنهاء البطاقة مع ترك اللقطة المتبقية فارغة؟} two {هل تريد إنهاء البطاقة مع ترك اللقطتين المتبقيتين فارغتين؟} few {هل تريد إنهاء البطاقة مع ترك اللقطات المتبقية ({left}) فارغة؟} many {هل تريد إنهاء البطاقة مع ترك اللقطات المتبقية ({left}) فارغة؟} other {هل تريد إنهاء البطاقة مع ترك اللقطات المتبقية ({left}) فارغة؟}} تبقى صورك في الألبوم كما هي.', // ko: {shots} 찍었어요. 카드에 남은 {left}은 비워 두고 정리할까요? 사진은 앨범에 그대로 있어요. · en: {shots} taken. Finish the card? The remaining {left} will stay blank; your photos stay in the album. [+ counts: n, m]
  'cam.switchBody': 'التبديل إلى كاميرا أخرى', // ko: 다른 카메라로 바꾸기 · en: Switch camera body
  'cam.switchSub': 'يُرسل هذا الفيلم إلى المعمل أولًا، ثم تختار كاميرا جديدة.', // ko: 지금 롤을 먼저 현상소로 보낸 뒤 새 카메라를 골라요. · en: This roll goes to the lab first, then you pick a new camera.
  'cam.switchSubViewable': 'تبقى صورك في الألبوم، ثم تختار كاميرا جديدة.', // ko: 지금 사진은 앨범에 두고 새 카메라를 골라요. · en: Your photos stay in the album, then you pick a new camera.
  'cam.switchSubEmpty': 'لا توجد لقطات بعد، لذا يمكنك التبديل فورًا.', // ko: 아직 찍은 사진이 없어서 바로 바꿀 수 있어요. · en: Nothing shot yet, so you can switch right away.
  'cam.switchConfirm': 'لتبديل الكاميرا، يُرسل هذا الفيلم ({shots}) إلى المعمل أولًا، وستُحمَّض كل اللقطات التي التقطتها.', // ko: 카메라를 바꾸려면 지금 롤({shots})을 먼저 현상소로 보내야 해요. 찍은 사진은 모두 현상돼요. · en: To switch cameras, this roll ({shots}) goes to the lab first. Every shot will be developed. [+ counts: n]
  'cam.switchConfirmPack': 'لتبديل الكاميرا، تُخرَج هذه العبوة ({shots}) أولًا. تبقى صورك في الألبوم كما هي.', // ko: 카메라를 바꾸려면 지금 팩({shots})을 먼저 꺼내요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this pack ({shots}) comes out first. Your photos stay in the album. [+ counts: n]
  'cam.switchConfirmCard': 'لتبديل الكاميرا، تُنهى هذه البطاقة ({shots}) أولًا. تبقى صورك في الألبوم كما هي.', // ko: 카메라를 바꾸려면 지금 카드({shots})를 먼저 정리해요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this card ({shots}) is finished first. Your photos stay in the album. [+ counts: n]
  'cam.switchOkFilm': 'إرسال للتحميض وتبديل', // ko: 현상소로 보내고 바꾸기 · en: Send to lab & switch
  'cam.switchOkDone': 'إنهاء وتبديل', // ko: 정리하고 바꾸기 · en: Finish & switch
  'cam.switchedLab': 'أُرسل الفيلم إلى المعمل. اختر الآن كاميرا جديدة.', // ko: 롤을 현상소에 보냈어요. 이제 새 카메라를 골라 보세요. · en: Roll sent to the lab. Pick your next camera.
  'cam.switchedAlbum': 'أصبحت صورك في الألبوم. اختر الآن كاميرا جديدة.', // ko: 사진을 앨범에 넣었어요. 이제 새 카메라를 골라 보세요. · en: Photos are in your album. Pick your next camera.
  'cam.more': 'المزيد', // ko: 더보기 · en: More
  'cam.flashOnSay': 'الفلاش يعمل', // ko: 플래시 켬 · en: Flash on
  'cam.flashOffSay': 'الفلاش مطفأ', // ko: 플래시 끔 · en: Flash off
  'cam.flashOnScreen': 'الفلاش يعمل · مع الكاميرا الأمامية تضيء الشاشة بدلًا منه', // ko: 플래시 켬 · 전면 카메라는 화면이 하얗게 빛나요 · en: Flash on · the front camera lights up the screen instead
  'cam.flipToFront': 'التبديل إلى الكاميرا الأمامية', // ko: 전면 카메라로 전환 · en: Flip to front camera
  'cam.flipToBack': 'التبديل إلى الكاميرا الخلفية', // ko: 후면 카메라로 전환 · en: Flip to back camera
  'gal.emptyHintCamera': 'في الكاميرا {shots} بانتظارك. أرسل الفيلم للتحميض، وستظهر الصور هنا بعد تحميضها.', // ko: 카메라 안에 사진 {shots}이 기다리고 있어요. 현상소로 보내면 현상을 마친 뒤 여기에 나타나요. · en: You have {shots} in the camera. Send them to the lab and they show up here once developed. [+ counts: n]
  'gal.developNow': 'إرسال للتحميض', // ko: 현상소로 보내기 · en: Send to lab
  'gal.inCameraBanner': 'في الكاميرا {shots} · إرسال للتحميض', // ko: 카메라 안 {shots} · 현상소로 보내기 · en: {shots} in the camera · Send to lab [+ counts: n]
  'lab.emptyCamera': 'في الكاميرا {shots}. أرسل الفيلم إلى المعمل ليبدأ تحميضه هنا.', // ko: 카메라 안에 사진 {shots}이 있어요. 현상소로 보내면 여기서 현상이 시작돼요. · en: You have {shots} in the camera. Send the roll to the lab and it develops here. [+ counts: n]
  'speed.title': 'متى تريد استلام صورك؟', // ko: 언제 받아볼까요? · en: When do you want your prints?
  'speed.instant': 'فورًا', // ko: 즉시 · en: Instant
  'speed.why': 'أن تصلك الصور حين تكاد تنساها، تلك متعة الفيلم. ولرؤيتها الآن، اختر «فورًا».', // ko: 잊을 즈음 도착하는 설렘, 그게 필름의 재미예요. 바로 보려면 ‘즉시’. · en: Forget the roll, then find it again. That’s film. Instant shows them now.
  'speed.at.now': 'في ألبومك الآن', // ko: 지금 바로 앨범에 도착 · en: In your album right away
  'speed.at.today': 'تصل اليوم {time}', // ko: 오늘 {time} 도착 · en: Arrives today at {time}
  'speed.at.tomorrow': 'تصل غدًا {time}', // ko: 내일 {time} 도착 · en: Arrives tomorrow at {time}
  'speed.at.date': 'تصل في {date}', // ko: {date} 도착 · en: Arrives {date}
  'speed.instant.d': 'بلا انتظار، شاهدها الآن', // ko: 기다림 없이, 지금 바로 · en: No waiting. See them now
  'speed.1h': 'ساعة', // ko: 1시간 · en: 1 hour
  'speed.1h.d': 'وقت لفنجان قهوة', // ko: 커피 한 잔의 기다림 · en: Time for a coffee
  'speed.morning': '9 صباحًا', // ko: 아침 9시 · en: Next 9 AM
  'speed.morning.d': 'تستيقظ فتجد صورك بانتظارك', // ko: 자고 일어나면 와 있어요 · en: Wake up to your photos
  'speed.3d': '3 أيام', // ko: 3일 · en: 3 days
  'speed.3d.d': 'على مهل، كفيلم حقيقي', // ko: 진짜 필름처럼, 느긋하게 · en: Slow, like real film
  'lab.title': 'معمل التحميض', // ko: 현상소 · en: Film Lab
  'lab.empty': 'المعمل هادئ الآن.', // ko: 지금은 현상소가 조용해요. · en: The lab is quiet right now.
  'lab.emptyHint': 'تنتظر هنا الأفلام التي ترسلها إلى المعمل.', // ko: 현상소로 보낸 롤은 여기서 기다려요. · en: Rolls you send to the lab wait here.
  'lab.emptyWhat': 'هنا تبقى الأفلام التي ترسلها إلى المعمل حتى يكتمل تحميضها.', // ko: 현상소로 보낸 롤이 현상될 때까지 머무는 곳이에요. · en: Rolls you send to the lab rest here while they develop.
  'lab.emptyHow': 'تصل في الموعد الذي تختاره، ومع «فورًا» تذهب إلى الألبوم مباشرة.', // ko: 고른 시간에 맞춰 도착해요. ‘즉시’라면 바로 앨범으로. · en: They arrive on the schedule you choose. Instant skips the wait.
  'lab.intro': 'تنتقل الأفلام إلى الألبوم بعد اكتمال تحميضها.', // ko: 현상을 마친 롤은 앨범으로 옮겨져요. · en: Developed rolls move to your album.
  'lab.introRush': 'لا تطيق الانتظار؟ اضغط «التحميض الآن».', // ko: 기다리기 어렵다면 ‘지금 바로 현상’을 눌러 보세요. · en: Can’t wait? Tap Develop now.
  'lab.readyIn': 'جاهز بعد {t}', // ko: {t} 남음 · en: Ready in {t}
  'lab.ready': 'تم التحميض', // ko: 현상 완료 · en: Developed
  'lab.rush': 'التحميض الآن', // ko: 지금 바로 현상 · en: Develop now
  'lab.rushConfirm': 'يمكنك تخطي الانتظار ورؤية الصور في الألبوم فورًا.', // ko: 기다림을 건너뛰고 바로 앨범에서 볼 수 있어요. · en: Skip the wait and see the photos in the album right away.
  'lab.developedToast': 'اكتمل تحميض {stock}', // ko: {stock} 롤 현상이 끝났어요 · en: Your {stock} roll is developed
  'lab.open': 'عرض الصور', // ko: 사진 보기 · en: View photos
  'gal.title': 'الألبوم', // ko: 앨범 · en: Album
  'gal.empty': 'لا توجد صور بعد.',
  'gal.emptyHint': 'التقط صورة بالكاميرا وستظهر هنا فورًا.',
  'gal.folders': 'المجلدات',
  'gal.allPhotos': 'كل الصور',
  'gal.groups': 'جلسات التصوير',
  'gal.shoot': 'التقط صورة',
  'gal.emptyHintLab': '{n, plural, zero {لا أفلام قيد التحميض في المعمل.} one {فيلم واحد قيد التحميض في المعمل.} two {فيلمان قيد التحميض في المعمل.} few {# أفلام قيد التحميض في المعمل.} many {# فيلمًا قيد التحميض في المعمل.} other {# فيلم قيد التحميض في المعمل.}}', // ko: 현상소에서 {n}롤이 현상 중이에요. · en: {n, plural, one {# roll is} other {# rolls are}} developing in the lab.
  'gal.openLab': 'فتح المعمل', // ko: 현상소 보기 · en: Open the lab
  'gal.import': 'استيراد الصور', // ko: 사진 불러오기 · en: Import photos
  'gal.restore': 'استعادة نسخة احتياطية', // ko: 이전 폰 백업 불러오기 · en: Restore a backup
  'gal.importing': 'جارٍ الاستيراد… {n}/{total}',
  'gal.imported': 'صور مستوردة', // ko: 불러온 사진 · en: Imported
  'gal.new': 'جديد', // ko: 새 롤 · en: NEW
  'gal.frames': '{n, plural, zero {0 لقطة} one {لقطة واحدة} two {لقطتان} few {# لقطات} many {# لقطة} other {# لقطة}}', // ko: {n}장 · en: {n, plural, one {# frame} other {# frames}}
  'gal.contact': 'ورقة التلامس', // ko: 밀착 인화 · en: Contact sheet
  'gal.deleteRoll': 'حذف الفيلم', // ko: 롤 삭제 · en: Delete roll
  'gal.deleteRollConfirm': '{n, plural, zero {سيُحذف هذا الفيلم.} one {ستُحذف الصورة الوحيدة في هذا الفيلم.} two {ستُحذف صورتا هذا الفيلم.} few {ستُحذف كل صور هذا الفيلم (# صور).} many {ستُحذف كل صور هذا الفيلم (# صورة).} other {ستُحذف كل صور هذا الفيلم (# صورة).}} ويمكنك التراجع خلال ثوانٍ بعد الحذف.', // ko: 이 롤의 사진 {n}장이 모두 삭제돼요. 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: All {n, plural, one {# photo} other {# photos}} in this roll will be deleted. You can undo it for a few seconds afterwards.
  'gal.developing': 'قيد التحميض', // ko: 현상 중 · en: Developing
  'view.share': 'مشاركة', // ko: 공유 · en: Share
  'view.saveImage': 'حفظ', // ko: 저장 · en: Save
  'view.darkroom': 'الغرفة المظلمة', // ko: 다크룸 · en: Darkroom
  'view.info': 'معلومات', // ko: 정보 · en: Info
  'view.deleteConfirm': 'هل تريد حذف هذه الصورة؟ سيُحذف الأصل أيضًا.', // ko: 이 사진을 삭제할까요? 원본도 함께 삭제돼요. · en: Delete this photo? The original is deleted too.
  'view.developing': 'جارٍ التحميض…', // ko: 현상 중… · en: Developing…
  'view.taken': 'وقت الالتقاط', // ko: 촬영 · en: Taken
  'view.film': 'الفيلم', // ko: 필름 · en: Film
  'view.frame': 'اللقطة', // ko: 컷 · en: Frame
  'view.size': 'الحجم', // ko: 크기 · en: Size
  'dr.title': 'الغرفة المظلمة', // ko: 다크룸 · en: Darkroom
  'dr.film': 'الفيلم', // ko: 필름 · en: Film
  'dr.push': 'دفع/سحب (التباين والحبيبات)', // ko: 증감현상 (대비·입자) · en: Push / pull (contrast & grain)
  'dr.push.hint': '− أنعم / + تباين وحبيبات أكثر', // ko: + 대비·입자↑ / − 부드럽게 · en: + contrast & grain / − softer
  'dr.stops': '{v} {n, plural, zero {درجة} one {درجة} two {درجة} few {درجات} many {درجة} other {درجة}}', // ko: {v} 스톱 · en: {v} {n, plural, one {stop} other {stops}} [+ counts: n]
  'dr.normal': 'عادي', // ko: 노멀 · en: Normal
  'dr.redevelop': 'إعادة التحميض', // ko: 다시 현상 · en: Re-develop
  'dr.expired': 'مظهر الفيلم القديم', // ko: 오래된 필름 느낌 (만료) · en: Aged film look (expired)
  'dr.grain': 'الحبيبات', // ko: 입자 · en: Grain
  'dr.halation': 'الوهج (هالة الضوء)', // ko: 빛 번짐 (할레이션) · en: Glow (halation)
  'dr.leak': 'تسرّب الضوء', // ko: 빛샘 · en: Light leak
  'dr.leak.reroll': 'تسرّب آخر', // ko: 다른 빛샘 · en: Another leak
  'dr.flash': 'تأثير الفلاش', // ko: 플래시 룩 · en: Flash look
  'dr.date': 'ختم التاريخ', // ko: 날짜 각인 · en: Date stamp
  'dr.border': 'الحافة', // ko: 테두리 · en: Border
  'dr.border.none': 'بلا حافة', // ko: 없음 · en: None
  'dr.border.film35': '35mm', // ko: 35mm · en: 35mm
  'dr.border.instant': 'فورية', // ko: 인스턴트 · en: Instant
  'dr.border.print': 'مطبوعة', // ko: 인화지 · en: Print
  'dr.border.slide': 'شريحة', // ko: 슬라이드 · en: Slide
  'dr.border.gate': 'سينمائية', // ko: 시네 · en: Cine
  'dr.border.sprocket': 'ثقوب الفيلم', // ko: 스프로킷 · en: Sprocket
  'dr.compare': 'اضغط مطولًا لعرض الأصل', // ko: 길게 눌러 원본 보기 · en: Hold to see the original
  'dr.reset': 'إعادة تعيين', // ko: 초기화 · en: Reset
  'dr.saved': 'تمت إعادة التحميض', // ko: 다시 현상했어요 · en: Re-developed
  'dr.applyRoll': 'تطبيق على الفيلم', // ko: 롤 전체에 적용 · en: Apply to roll
  'dr.rotate': 'تدوير', // ko: 회전 · en: Rotate
  'dr.ev': 'تعويض التعريض', // ko: 노출 보정 · en: Exposure
  'dr.palette': 'الألوان', // ko: 팔레트 · en: Palette
  'dr.camera': 'الكاميرا', // ko: 카메라 · en: Camera
  'hint.ios': 'أضف Film Camela إلى الشاشة الرئيسية لتبقى صورك في أمان أكبر («مشاركة» ثم «إضافة إلى الشاشة الرئيسية»).', // ko: 홈 화면에 추가하면 사진을 더 안전하게 지킬 수 있어요. (공유 → 홈 화면에 추가) · en: Add Film Camela to your Home Screen to keep photos safe (Share → Add to Home Screen).
  'dr.applyRollDone': 'تم التطبيق على الفيلم كله', // ko: 롤 전체에 적용했어요 · en: Applied to the whole roll
  'dr.applyRollUndone': 'استُعيدت إعدادات الفيلم', // ko: 롤 전체 적용을 되돌렸어요 · en: Roll settings restored
  'dr.discardConfirm': 'هل تريد تجاهل التغييرات؟', // ko: 변경 사항을 버릴까요? · en: Discard changes?
  'dr.discard': 'تجاهل', // ko: 버리기 · en: Discard
  'dr.saveNew': 'حفظ كصورة جديدة', // ko: 새 사진으로 저장 · en: Save as new photo
  'dr.savedNew': 'حُفظت كصورة جديدة (رقم {n})', // ko: 새 사진으로 저장했어요 ({n}번) · en: Saved as a new photo (#{n})
  'dr.tone': 'مظهر رقمي', // ko: 디지털 룩 · en: Digital look
  'dr.look': 'المظهر', // ko: 룩 · en: Look
  'dr.tone.none': 'افتراضي', // ko: 기본 · en: Default
  'dr.tone.cool': 'بارد', // ko: 쿨 · en: Cool
  'dr.tone.warm': 'دافئ', // ko: 웜 · en: Warm
  'dr.tone.washed': 'باهت', // ko: 바랜 · en: Washed
  'dr.tone.night': 'ليلي', // ko: 야간 · en: Night
  'view.noDate': 'لا يوجد تاريخ', // ko: 날짜 정보 없음 · en: No date info
  'roll.select': 'تحديد', // ko: 선택 · en: Select
  'roll.selectHint': 'اضغط على الصور لتحديدها', // ko: 사진을 눌러 선택하세요 · en: Tap photos to select them
  'roll.selectedN': '{n, plural, zero {لم تُحدَّد أي صورة} one {تم تحديد صورة واحدة} two {تم تحديد صورتين} few {تم تحديد # صور} many {تم تحديد # صورة} other {تم تحديد # صورة}}', // ko: {n}장 선택됨 · en: {n} selected
  'roll.shareN': '{n, plural, zero {مشاركة} one {مشاركة صورة} two {مشاركة صورتين} few {مشاركة # صور} many {مشاركة # صورة} other {مشاركة # صورة}}', // ko: 공유 {n}장 · en: Share {n}
  'roll.saveN': '{n, plural, zero {حفظ} one {حفظ صورة} two {حفظ صورتين} few {حفظ # صور} many {حفظ # صورة} other {حفظ # صورة}}', // ko: 저장 {n}장 · en: Save {n}
  'roll.selectPhoto': 'تحديد الصورة {n}', // ko: 사진 {n} 선택 · en: Select photo {n}
  'roll.ready': '{n, plural, zero {لا صور جاهزة} one {صورة واحدة جاهزة} two {صورتان جاهزتان} few {# صور جاهزة} many {# صورة جاهزة} other {# صورة جاهزة}}', // ko: 사진 {n}장이 준비됐어요 · en: {n, plural, one {# photo} other {# photos}} ready
  'an.title': 'تناظري', // ko: 아날로그 · en: Analog
  'an.subtitle': 'أدوات لكاميرا الفيلم الحقيقية', // ko: 실제 필름 카메라를 위한 도구 · en: Tools for your real film camera
  'an.meter': 'حاسبة التعريض بقاعدة Sunny 16', // ko: Sunny 16 노출 계산기 · en: Sunny 16 exposure calculator
  'an.iso': 'ISO', // ko: ISO · en: ISO
  'an.light': 'الضوء', // ko: 빛 · en: Light
  'an.aperture': 'فتحة العدسة', // ko: 조리개 · en: Aperture
  'an.shutter': 'سرعة الغالق', // ko: 셔터 속도 · en: Shutter speed
  'an.comp': 'تعويض التعريض', // ko: 노출 보정 · en: Compensation
  'an.tripod': 'يُنصح باستخدام حامل ثلاثي', // ko: 삼각대를 권장해요 · en: Use a tripod
  'an.outOfRange': 'خارج نطاق الغالق. جرّب تغيير فتحة العدسة أو ISO.', // ko: 셔터 범위를 벗어났어요. 조리개나 ISO를 바꿔보세요. · en: Outside the shutter range. Try another aperture or ISO.
  'an.light.snow': 'ثلج أو رمال تحت الشمس', // ko: 맑은 날 눈밭·해변 · en: Snow / sand, sunny
  'an.light.sunny': 'مشمس (ظلال حادة)', // ko: 맑음 (선명한 그림자) · en: Sunny (sharp shadows)
  'an.light.slightOvercast': 'غائم جزئيًا', // ko: 약간 흐림 · en: Slightly overcast
  'an.light.overcast': 'غائم', // ko: 흐림 · en: Overcast
  'an.light.heavyOvercast': 'غائم كليًا', // ko: 매우 흐림 · en: Heavy overcast
  'an.light.shade': 'في الظل', // ko: 그늘 · en: Open shade
  'an.light.sunset': 'قبيل الغروب', // ko: 일몰 직전 · en: Just before sunset
  'an.light.indoorBright': 'إضاءة داخلية ساطعة', // ko: 밝은 실내 · en: Bright interior
  'an.light.indoor': 'إضاءة داخلية', // ko: 실내 · en: Interior
  'an.light.night': 'شارع ليلًا', // ko: 밤거리 · en: Night street
  'an.log': 'سجل تصوير الفيلم', // ko: 필름 촬영 노트 · en: Film shooting log
  'an.log.empty': 'لا توجد أفلام قيد التسجيل بعد.', // ko: 아직 기록 중인 롤이 없어요. · en: No logged rolls yet.
  'an.log.new': 'تسجيل فيلم جديد', // ko: 새 롤 기록 · en: Log a new roll
  'an.log.camera': 'الكاميرا', // ko: 카메라 · en: Camera
  'an.log.film': 'الفيلم', // ko: 필름 · en: Film
  'an.log.exposures': 'عدد اللقطات', // ko: 장수 · en: Exposures
  'an.log.note': 'ملاحظة', // ko: 메모 · en: Note
  'an.log.addFrame': 'تسجيل لقطة', // ko: 컷 기록 · en: Log frame
  'an.log.lens': 'العدسة', // ko: 렌즈 · en: Lens
  'an.log.export': 'تصدير CSV', // ko: CSV 내보내기 · en: Export CSV
  'an.log.deleteRoll': 'حذف السجل', // ko: 기록 삭제 · en: Delete log
  'an.log.deleteConfirm': 'هل تريد حذف سجل هذا الفيلم؟', // ko: 이 롤 기록을 삭제할까요? · en: Delete this roll log?
  'an.log.useMeter': 'استخدام قيم الحاسبة', // ko: 계산기 값 사용 · en: Use calculator values
  'an.log.frames': 'اللقطات {n}/{m}', // ko: {n}/{m}장 · en: {n}/{m} frames
  'an.log.location': 'حفظ الموقع أيضًا', // ko: 위치 함께 저장 · en: Save location
  'an.active': 'فيلم قيد التسجيل', // ko: 지금 기록 중인 롤 · en: Roll in progress
  'an.active.go': 'تسجيل لقطة', // ko: 컷 기록하기 · en: Log a frame
  'an.log.repeat': 'لقطة أخرى بالإعدادات نفسها', // ko: 같은 설정으로 +1컷 · en: Same settings +1
  'an.log.otherSettings': 'إعدادات أخرى', // ko: 다른 설정 · en: New settings
  'an.log.frameN': 'تسجيل اللقطة {n}', // ko: {n}번 컷 기록 · en: Log frame {n}
  'an.log.editFrame': 'تعديل اللقطة {n}', // ko: {n}번 컷 고치기 · en: Edit frame {n}
  'an.log.saveFrame': 'تسجيل هذه اللقطة', // ko: 이 컷 기록 · en: Log this frame
  'an.log.saveEdit': 'حفظ التعديلات', // ko: 고친 내용 저장 · en: Save changes
  'an.log.manual': 'إدخال يدوي', // ko: 직접 입력 · en: Type it in
  'an.log.pickStops': 'اختيار من القرص', // ko: 눈금에서 고르기 · en: Pick from the dial
  'an.log.logged': 'سُجّلت اللقطة {n}', // ko: {n}번 컷을 기록했어요 · en: Frame {n} logged
  'an.log.deleted': 'حُذف سجل اللقطة {n}', // ko: {n}번 컷 기록을 지웠어요 · en: Frame {n} log deleted
  'an.log.undo': 'تراجع', // ko: 되돌리기 · en: Undo
  'an.log.undoFailed': 'تعذّر التراجع: سُجّلت لقطة بالرقم نفسه في هذه الأثناء', // ko: 그 사이 같은 번호가 기록돼서 되돌리지 못했어요 · en: Couldn't undo: that frame number is taken now
  'an.log.full': 'سُجّلت كل لقطات هذا الفيلم', // ko: 이 롤의 컷을 모두 기록했어요 · en: Every frame on this roll is logged
  'an.log.firstHint': 'سجّل هنا كل لقطة تلتقطها. ويمكنك الضغط على أي سطر في أي وقت لتعديله.', // ko: 한 컷 찍을 때마다 여기에 남겨 두세요. 줄을 누르면 언제든 고칠 수 있어요. · en: Log each frame here as you shoot. Tap a row any time to edit it.
  'set.title': 'الإعدادات', // ko: 설정 · en: Settings
  'set.lang': 'اللغة', // ko: 언어 · en: Language
  'set.lang.auto': 'النظام', // ko: 시스템 · en: System
  'set.sound': 'صوت الغالق', // ko: 셔터 소리 · en: Shutter sound
  'set.haptics': 'الاهتزاز', // ko: 진동 · en: Haptics
  'set.dateStamp': 'إضافة التاريخ إلى الصور', // ko: 사진에 날짜 넣기 · en: Add the date to photos
  'set.dateFormat': 'تنسيق التاريخ', // ko: 날짜 형식 · en: Date format
  'set.grid': 'إظهار الشبكة', // ko: 격자 표시 · en: Show grid
  'set.mirror': 'عكس صور الكاميرا الأمامية', // ko: 전면 카메라 좌우 반전 저장 · en: Mirror front camera photos
  'set.rollSize': 'عدد اللقطات الافتراضي', // ko: 기본 롤 장수 · en: Default roll size
  'set.speed': 'سرعة التحميض الافتراضية', // ko: 기본 현상 속도 · en: Default lab speed
  'set.speed.hint': 'تظهر بعلامة «الافتراضي» عند إرسال فيلم للتحميض. أما الكاميرات الفورية والرقمية فتتخطى المعمل، وتذهب صورها إلى الألبوم مباشرة.', // ko: 필름 롤을 현상소로 보낼 때 ‘기본’으로 표시돼요. 인스턴트·디카 사진은 현상소 없이 바로 앨범에 들어가요. · en: Marked as default when you send a film roll to the lab. Instant and digital cameras skip the lab: their photos go straight to the album.
  'set.storage': 'مساحة التخزين', // ko: 저장 공간 · en: Storage
  'set.storage.used': 'تم استخدام {used}', // ko: {used} 사용 중 · en: {used} used
  'set.storage.persist': 'حماية الصور من الحذف', // ko: 사진 지워지지 않게 보호 · en: Keep photos from being cleared
  'set.storage.persistHint': 'يطلب من المتصفح ألا يحذف صور هذا التطبيق تلقائيًا عندما تقل مساحة التخزين في الجهاز.', // ko: 기기 저장 공간이 부족해져도 브라우저가 이 앱의 사진을 자동으로 지우지 않도록 요청해요. · en: Asks the browser not to clear this app’s photos automatically when the device runs low on space.
  'set.storage.persistAsk': 'تشغيل', // ko: 보호 켜기 · en: Turn on
  'set.storage.persisted': 'محمية', // ko: 보호됨 · en: Protected
  'set.storage.refusedShort': 'غير مسموح', // ko: 허락 안 됨 · en: Not allowed
  'set.storage.refused': 'رفض هذا المتصفح الحماية. أضف Film Camela إلى الشاشة الرئيسية لتبقى الصور مدة أطول، واحتفظ بنسخة احتياطية أيضًا.', // ko: 이 브라우저가 보호를 허락하지 않았어요. 홈 화면에 추가하면 더 오래 보관돼요. 백업도 함께 해 두세요. · en: This browser declined. Adding Film Camela to your Home Screen keeps photos longer. Keep a backup too.
  'set.install': 'تثبيت التطبيق على الشاشة الرئيسية', // ko: 홈 화면에 앱 설치 · en: Install app to home screen
  'set.privacy': 'سياسة الخصوصية', // ko: 개인정보 처리방침 · en: Privacy policy
  'set.terms': 'شروط الاستخدام', // ko: 이용약관 · en: Terms of use
  'set.support': 'الدعم والتواصل', // ko: 고객지원 · 문의 · en: Support & contact
  'set.licenses': 'تراخيص المصادر المفتوحة', // ko: 오픈소스 라이선스 · en: Open-source licenses
  'set.backup': 'النسخ الاحتياطي', // ko: 백업 · en: Backup
  'set.backup.hint': 'تبقى صورك وسجلاتك على هذا الجهاز فقط. قبل تغيير هاتفك أو مسح بيانات المتصفح، احفظ ملف نسخة احتياطية (.zip) في مكان آمن.', // ko: 사진과 기록은 이 기기에만 머물러요. 폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업 파일(.zip)로 챙겨 두세요. · en: Your photos and logs live only on this device. Before you switch phones or clear browser data, save a backup file (.zip) somewhere safe.
  'set.backup.export': 'حفظ نسخة احتياطية (.zip)', // ko: 백업 파일 저장 (.zip) · en: Save backup file (.zip)
  'set.backup.saveAgain': 'حفظ نسخة أخرى', // ko: 한 번 더 저장 · en: Save another copy
  'set.backup.send': 'إرسال الملف إلى نفسك', // ko: 카카오톡·드라이브로 보내기 · en: Send to KakaoTalk or Drive
  'set.backup.savedWeb': 'حُفظ في مجلد التنزيلات · {name}', // ko: 다운로드 폴더에 저장했어요 · {name} · en: Saved to your Downloads folder · {name}
  'set.backup.savedShared': 'حُفظ في المكان الذي اخترته من نافذة المشاركة (الملفات، Drive…) · {name}', // ko: 공유 창에서 고른 곳(파일·드라이브 등)에 저장했어요 · {name} · en: Saved where you picked in the share sheet (Files, Drive…) · {name}
  'set.backup.restoreHint': 'للانتقال إلى هاتف جديد، أرسل هذا الملف إلى نفسك (عبر الرسائل أو البريد أو التخزين السحابي)، ثم افتحه على الهاتف الجديد من «الاستعادة من نسخة احتياطية» في إعدادات Film Camela.', // ko: 새 폰으로 옮기려면 이 파일을 카카오톡 ‘나와의 채팅’이나 드라이브로 보낸 뒤, 새 폰의 Film Camela 설정에서 ‘백업에서 복원’을 눌러 열어요. · en: To move to a new phone, send this file to yourself (KakaoTalk, Drive or email), then open it there with Restore from backup in Film Camela Settings.
  'set.credit': '© 2026 ATIUM GROUP Co., Ltd.', // ko: © 2026 아티움그룹 주식회사 (ATIUM GROUP Co., Ltd.) · en: © 2026 ATIUM GROUP Co., Ltd.
  'set.backup.import': 'الاستعادة من نسخة احتياطية', // ko: 백업에서 복원 · en: Restore from backup
  'set.backup.working': 'جارٍ النسخ الاحتياطي… {done}/{total}', // ko: 백업 중… {done}/{total} · en: Backing up… {done}/{total}
  'set.backup.restoring': 'جارٍ الاستعادة…', // ko: 복원 중… · en: Restoring…
  'set.backup.done': 'النسخة الاحتياطية جاهزة · {rolls, plural, zero {0 فيلم} one {فيلم واحد} two {فيلمان} few {# أفلام} many {# فيلمًا} other {# فيلم}}، {photos, plural, zero {0 صورة} one {صورة واحدة} two {صورتان} few {# صور} many {# صورة} other {# صورة}}', // ko: 백업 준비 완료 · 롤 {rolls}개, 사진 {photos}장 · en: Backup ready · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}}
  'set.backup.save': 'جاهزة · احفظها', // ko: 준비 완료 · 저장하기 · en: Ready · Save it
  'set.backup.saved': 'تم حفظ ملف النسخة الاحتياطية', // ko: 백업 파일을 저장했어요 · en: Backup file saved
  'set.backup.saveFailed': 'تعذّر الحفظ. اضغط مرة أخرى', // ko: 저장하지 못했어요. 다시 눌러 주세요 · en: Couldn't save it. Tap again
  'set.backup.tooLarge': 'يتجاوز الحجم 4 GB، فلا يتسع له ملف واحد. احذف بعض الأفلام القديمة ثم حاول مرة أخرى', // ko: 4GB가 넘어 파일 하나에 담을 수 없어요. 오래된 롤을 정리한 뒤 다시 시도해 주세요 · en: Over 4 GB, too large for one file. Clear out some old rolls and try again
  'set.backup.newer': 'هذه النسخة الاحتياطية من إصدار أحدث من التطبيق. يُرجى تحديث التطبيق', // ko: 더 새로운 버전의 앱에서 만든 백업이에요. 앱을 업데이트해 주세요 · en: This backup is from a newer version of the app. Please update
  'set.backup.partial': '{rolls, plural, zero {توقفت الاستعادة قبل استعادة أي فيلم} one {توقفت الاستعادة بعد استعادة فيلم واحد} two {توقفت الاستعادة بعد استعادة فيلمين} few {توقفت الاستعادة بعد استعادة # أفلام} many {توقفت الاستعادة بعد استعادة # فيلمًا} other {توقفت الاستعادة بعد استعادة # فيلم}}. حرّر بعض المساحة، ثم ابدأ الاستعادة مجددًا لإكمالها', // ko: 롤 {rolls}개까지 복원하고 멈췄어요. 저장 공간을 확보한 뒤 다시 복원하면 이어서 진행돼요 · en: Stopped after restoring {rolls, plural, one {# roll} other {# rolls}}. Free up storage and restore again to continue
  'set.backup.empty': 'لا يوجد ما يُنسخ احتياطيًا بعد', // ko: 아직 백업할 사진이나 기록이 없어요 · en: Nothing to back up yet
  'set.backup.restored': 'اكتملت الاستعادة · تمت إضافة {rolls, plural, zero {0 فيلم} one {فيلم واحد} two {فيلمين} few {# أفلام} many {# فيلمًا} other {# فيلم}} و{photos, plural, zero {0 صورة} one {صورة واحدة} two {صورتين} few {# صور} many {# صورة} other {# صورة}}', // ko: 복원 완료 · 롤 {rolls}개, 사진 {photos}장 추가 · en: Restored · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}} added
  'set.backup.skipped': '{n, plural, zero {لم يُتخطَّ أي عنصر} one {تم تخطي عنصر واحد موجود مسبقًا} two {تم تخطي عنصرين موجودين مسبقًا} few {تم تخطي # عناصر موجودة مسبقًا} many {تم تخطي # عنصرًا موجودًا مسبقًا} other {تم تخطي # عنصر موجود مسبقًا}}', // ko: 이미 있는 항목 {n}개는 그대로 두었어요 · en: Skipped {n, plural, one {# item} other {# items}} you already have
  'set.backup.damaged': '{n, plural, zero {لا توجد عناصر تالفة} one {تم تخطي عنصر واحد تالف} two {تم تخطي عنصرين تالفين} few {تم تخطي # عناصر تالفة} many {تم تخطي # عنصرًا تالفًا} other {تم تخطي # عنصر تالف}}', // ko: 손상된 항목 {n}개는 건너뛰었어요 · en: Skipped {n} damaged {n, plural, one {item} other {items}}
  'set.backup.invalid': 'هذا ليس ملف نسخة احتياطية من Film Camela، أو أن الملف تالف', // ko: Film Camela 백업 파일이 아니거나 손상된 파일이에요 · en: Not a Film Camela backup, or the file is damaged
  'set.backup.failed': 'تعذّر إنشاء النسخة الاحتياطية. تحقّق من المساحة المتاحة', // ko: 백업을 만들지 못했어요. 저장 공간을 확인해 주세요 · en: Couldn't create the backup. Check free storage
  'set.reset': 'حذف كل البيانات', // ko: 모든 데이터 삭제 · en: Delete all data
  'set.resetConfirm': 'ستُحذف كل الأفلام والصور والسجلات والإعدادات، ولا يمكن التراجع عن ذلك. احفظ أولًا نسخة احتياطية من «حفظ نسخة احتياطية» أعلاه. هل تريد الحذف رغم ذلك؟', // ko: 모든 롤, 사진, 기록, 설정이 삭제되고 되돌릴 수 없어요. 먼저 위의 ‘백업 파일 저장’으로 백업해 두세요. 그래도 삭제할까요? · en: All rolls, photos, logs and settings will be deleted, and this cannot be undone. Save a backup file first (above). Delete anyway?
  'set.version': 'الإصدار', // ko: 버전 · en: Version
  'set.replayOnb': 'إعادة عرض المقدمة', // ko: 소개 다시 보기 · en: Replay intro
  'share.title': 'صُوّرت بتطبيق Film Camela', // ko: Film Camela로 촬영 · en: Shot on Film Camela
  'err.storage': 'مساحة التخزين ممتلئة. احذف بعض الصور ثم حاول مرة أخرى.', // ko: 저장 공간이 부족해요. 사진 몇 장을 지우고 다시 시도해 주세요. · en: Storage is full. Delete a few photos and try again.
  'common.notFound': 'تعذّر العثور على هذا العنصر. ربما حُذف.', // ko: 찾을 수 없어요. 삭제되었을 수 있어요. · en: Couldn't find this. It may have been deleted.
  'an.log.noLocation': 'تعذّر تحديد موقعك، فحُفظت اللقطة بدون موقع', // ko: 위치를 확인하지 못해 위치 없이 저장했어요 · en: Couldn’t get your location, so it was saved without one
  'err.storagePermission': 'إذن التخزين غير مفعّل. افتح الإعدادات ثم التطبيقات ثم Film Camela ثم الأذونات، واسمح بالتخزين.', // ko: 저장 권한이 꺼져 있어요. 설정 > 앱 > Film Camela > 권한에서 저장공간을 허용해 주세요. · en: Storage permission is off. Allow it in Settings > Apps > Film Camela > Permissions.
  'err.noStorage': 'لا يسمح هذا المتصفح لتطبيق Film Camela بحفظ الصور. أوقف التصفح الخاص أو اسمح ببيانات المواقع، ثم أعد فتح التطبيق.', // ko: 이 브라우저 설정에서는 사진을 저장할 수 없어요. 사생활 보호(시크릿) 모드를 끄거나 사이트 데이터 저장을 허용해 주세요. · en: This browser won't let Film Camela save photos. Turn off private browsing or allow site data, then reopen the app.
  'err.import': 'تعذّر استيراد هذا الملف.', // ko: 이 파일은 불러올 수 없어요. · en: This file could not be imported.
  'update.ready': 'إصدار جديد جاهز', // ko: 새 버전이 준비됐어요 · en: A new version is ready
  'update.reload': 'إعادة التحميل', // ko: 새로고침 · en: Reload
  'offline.ready': 'جاهز للعمل دون اتصال', // ko: 오프라인에서도 사용할 수 있어요 · en: Ready to work offline
  'a11y.cameraTitle': 'الكاميرا', // ko: 카메라 · en: Camera
  'a11y.rollLoaded': 'تم إدخال فيلم {stock} · {n, plural, zero {0 لقطة} one {لقطة واحدة} two {لقطتان} few {# لقطات} many {# لقطة} other {# لقطة}}', // ko: {stock} · {n}장 넣었어요 · en: {stock} loaded · {n, plural, one {# shot} other {# shots}}
  'a11y.sentToLab': 'أُرسل إلى المعمل · جاهز بعد {wait}', // ko: 현상소로 보냈어요 · {wait} 뒤 도착 · en: Sent to the lab · ready in {wait}
  'a11y.cameraKeys': 'غيّر الكاميرا بمفتاحي الأسهم',
  'cam.timerSay': '{n, plural, zero {الالتقاط الآن} one {الالتقاط بعد ثانية} two {الالتقاط بعد ثانيتين} few {الالتقاط بعد # ثوانٍ} many {الالتقاط بعد # ثانية} other {الالتقاط بعد # ثانية}} · اضغط زر الغالق مرة أخرى للإلغاء', // ko: {n}초 뒤 촬영 · 셔터를 다시 누르면 취소 · en: Taking the photo in {n} seconds · press the shutter again to cancel
  'cam.timerCancelled': 'أُلغي المؤقت', // ko: 타이머를 취소했어요 · en: Timer cancelled
  'cam.tapToCancel': 'اضغط للإلغاء', // ko: 탭하면 취소 · en: Tap to cancel
  'cam.cancelTimer': 'إلغاء المؤقت', // ko: 타이머 취소 · en: Cancel timer
  'cam.doubleHint': 'ضغطتان، لقطة واحدة', // ko: 두 번 눌러 한 장에 겹쳐요 · en: Two presses, one frame
  'cam.double2': 'اضغط مرة أخرى لتعريض المشهد فوق اللقطة الأولى', // ko: 한 번 더 누르면 첫 장면 위에 겹쳐 찍혀요 · en: Press again to expose over the first shot
  'cam.pressBusy': 'لا يزال حفظ اللقطات السابقة جاريًا', // ko: 앞 사진을 저장하는 중이에요 · en: Still saving the previous shots
  'cam.pressFull': 'لم تتبقَّ لقطات', // ko: 남은 컷이 없어요 · en: No frames left
  'cam.startingQueued': 'سيتم الالتقاط فور جاهزية الكاميرا', // ko: 카메라가 준비되면 바로 찍어요 · en: Taking the photo as soon as the camera is ready
  'cam.switchConfirmFilm2': 'عند تبديل الكاميرا يذهب هذا الفيلم إلى المعمل. يُحمَّض ما التقطته ({shots})، ولن يُستخدم الباقي ({left}).', // ko: 카메라를 바꾸면 지금 롤은 현상소로 가요. 찍은 {shots}은 현상하고, 남은 {left}은 쓰지 않아요. · en: Switching sends this roll to the lab. The {shots} you took {n, plural, one {gets} other {get}} developed; the {left} left {m, plural, one {stays} other {stay}} unused. [+ counts: n, m]
  'cam.switchConfirmPack2': 'عند تبديل الكاميرا تُخرَج هذه العبوة. ينتقل ما التقطته ({shots}) إلى الألبوم، ولن يُستخدم الباقي ({left}).', // ko: 카메라를 바꾸면 지금 팩을 꺼내요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching takes this pack out. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  'cam.switchConfirmCard2': 'عند تبديل الكاميرا تُنهى هذه البطاقة. ينتقل ما التقطته ({shots}) إلى الألبوم، ولن يُستخدم الباقي ({left}).', // ko: 카메라를 바꾸면 지금 카드를 정리해요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching finishes this card. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  'common.undo': 'تراجع', // ko: 되돌리기 · en: Undo
  'view.deleteUndoConfirm': 'يمكنك التراجع خلال ثوانٍ بعد الحذف.', // ko: 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: You can undo it for a few seconds afterwards.
  'view.deleted': 'حُذفت الصورة', // ko: 사진을 삭제했어요 · en: Photo deleted
  'view.restored': 'استُعيدت الصورة', // ko: 사진을 되돌렸어요 · en: Photo restored
  'view.deleteTitle': 'هل تريد حذف هذه الصورة؟', // ko: 사진을 삭제할까요? · en: Delete this photo?
  'view.savedWeb': 'حُفظت في مجلد التنزيلات', // ko: 다운로드 폴더에 저장했어요 · en: Saved to your Downloads folder
  'view.savedAndroid': 'حُفظت في ألبوم Film Camela في المعرض', // ko: 갤러리 › Film Camela 앨범에 저장했어요 · en: Saved to Gallery › Film Camela album
  'gal.deleteRollTitle': 'هل تريد حذف هذا الفيلم؟', // ko: 이 롤을 삭제할까요? · en: Delete this roll?
  'gal.rollDeleted': 'حُذف الفيلم', // ko: 롤을 삭제했어요 · en: Roll deleted
  'gal.rollRestored': 'استُعيد الفيلم', // ko: 롤을 되돌렸어요 · en: Roll restored
  'gal.rollRestoreBlocked': 'تعذّرت الاستعادة: في الكاميرا فيلم آخر الآن', // ko: 카메라에 다른 롤이 들어 있어서 되돌릴 수 없어요 · en: Can't restore it: another roll is in the camera now
  'gal.framesHalf': '{f, plural, zero {0 إطار} one {إطار واحد} two {إطاران} few {# إطارات} many {# إطارًا} other {# إطار}} ({n, plural, zero {0 نصف إطار} one {نصف إطار واحد} two {نصفا إطار} few {# أنصاف إطار} many {# نصف إطار} other {# نصف إطار}})', // ko: {f}프레임 ({n}컷) · en: {f, plural, one {# frame} other {# frames}} ({n, plural, one {# shot} other {# shots}})
  'gal.help': 'مساعدة', // ko: 도움말 · en: Help
  'lab.rushTitle': 'هل تريد التحميض الآن؟', // ko: 지금 바로 현상할까요? · en: Develop now?
  'view.pushNormal': 'عادي', // ko: 노멀 · en: Normal
  'view.expiredNone': 'فيلم جديد', // ko: 새 필름 · en: Fresh film
  'view.expiredYears': '{n, plural, zero {منتهي الصلاحية منذ أقل من سنة} one {منتهي الصلاحية منذ سنة} two {منتهي الصلاحية منذ سنتين} few {منتهي الصلاحية منذ # سنوات} many {منتهي الصلاحية منذ # سنة} other {منتهي الصلاحية منذ # سنة}}', // ko: {n}년 지난 필름 · en: Expired {n, plural, one {# year} other {# years}}
  'dur.days': '{n} ي', // ko: {n}일 · en: {n}d
  'dur.hours': '{n} س', // ko: {n}시간 · en: {n}h
  'dur.minutes': '{n} د', // ko: {n}분 · en: {n}m
  'dur.seconds': '{n} ث', // ko: {n}초 · en: {n}s
  'dur.pair': '{a} و{b}', // ko: {a} {b} · en: {a} {b}
  'wait.days': '{n, plural, zero {0 يوم} one {يوم} two {يومين} few {# أيام} many {# يومًا} other {# يوم}}', // ko: {n}일 · en: {n} d
  'wait.hours': '{n, plural, zero {0 ساعة} one {ساعة} two {ساعتين} few {# ساعات} many {# ساعة} other {# ساعة}}', // ko: {n}시간 · en: {n} h
  'wait.minutes': '{n, plural, zero {0 دقيقة} one {دقيقة} two {دقيقتين} few {# دقائق} many {# دقيقة} other {# دقيقة}}', // ko: {n}분 · en: {n} min

  // MY tab (shots, rewarded ads, Pro) and the paywall sheet. {n} = a count; {left} = how many are left;
  // {time} = local clock time; {date} = a date; {store} = "Google Play" / "App Store" (never translated).
  'quota.empty': 'انتهت لقطاتك المجانية العشر لهذا اليوم · احصل على المزيد من «صفحتي» أو صوّر بلا حدود مع Pro',
  'my.free': 'لقطات اليوم المجانية',
  'my.free.say': 'اللقطات المجانية المتبقية اليوم: {left} من {n}',
  'my.unlimited': 'بلا حدود',
  'my.earned.label': 'لقطات إضافية',
  'my.earned.note': 'تبقى بعد منتصف الليل.',
  'my.resets': '{n, plural, zero {تتجدد لقطاتك المجانية عند {time}} one {تعود لقطة مجانية عند {time}} two {تعود لقطتان مجانيتان عند {time}} few {تعود # لقطات مجانية عند {time}} many {تعود # لقطة مجانية عند {time}} other {تعود # لقطة مجانية عند {time}}}',
  'my.ad.watch': '{n, plural, zero {مشاهدة إعلان} one {مشاهدة إعلان · لقطة إضافية} two {مشاهدة إعلان · لقطتان إضافيتان} few {مشاهدة إعلان · # لقطات إضافية} many {مشاهدة إعلان · # لقطة إضافية} other {مشاهدة إعلان · # لقطة إضافية}}',
  'my.ad.left': 'الإعلانات المتبقية اليوم: {left} من {n}',
  'my.ad.loading': 'جارٍ تحميل الإعلان…',
  'my.ad.none': 'شاهدت كل إعلانات اليوم. المزيد بعد منتصف الليل.',
  'my.ad.offline': 'اتصل بالإنترنت لمشاهدة إعلان.',
  'my.ad.blocked': 'الإعلانات غير متاحة الآن.',
  'my.ad.pro': 'مع Pro، صوّر كما تشاء. بلا إعلانات.',
  'my.ad.rewarded': '{n, plural, zero {لم تُضف أي لقطة.} one {أُضيفت لقطة واحدة. تابع التصوير.} two {أُضيفت لقطتان. تابع التصوير.} few {أُضيفت # لقطات. تابع التصوير.} many {أُضيفت # لقطة. تابع التصوير.} other {أُضيفت # لقطة. تابع التصوير.}}',
  'my.ad.dismissed': '{n, plural, zero {شاهد الإعلان حتى النهاية.} one {شاهد الإعلان حتى النهاية لتحصل على لقطة واحدة.} two {شاهد الإعلان حتى النهاية لتحصل على لقطتين.} few {شاهد الإعلان حتى النهاية لتحصل على # لقطات.} many {شاهد الإعلان حتى النهاية لتحصل على # لقطة.} other {شاهد الإعلان حتى النهاية لتحصل على # لقطة.}}',
  'my.ad.failed': 'تعذّر تحميل الإعلان. حاول مرة أخرى بعد قليل.',
  'my.pro.lead': 'تصوير بلا حدود. بلا إعلانات.',
  'my.plans': 'خطط Pro',
  'my.plan.week': 'أسبوع',
  'my.plan.3month': '3 أشهر',
  'my.plan.lifetime': 'مدى الحياة',
  'my.plan.week.d': 'يتجدد تلقائيًا كل أسبوع',
  'my.plan.3month.d': 'يتجدد تلقائيًا كل 3 أشهر',
  'my.plan.lifetime.d': 'ادفع مرة واحدة واحتفظ به للأبد',
  'my.plan.best': 'الأوفر',
  'my.buy': 'الحصول على Pro',
  'my.restore': 'استعادة المشتريات',
  'my.redeem': 'استرداد رمز ترويجي',
  'my.redeemHint': 'أدخل رمزك واستخدمه في Google Play. يتفعّل Pro عند عودتك إلى التطبيق.',
  'my.redeemCode': 'الرمز',
  'my.redeemGo': 'الاسترداد في Google Play',
  'my.manage': 'إدارة الاشتراك',
  'my.pro.on': 'Pro مفعّل لديك',
  'my.pro.lifetimeOn': 'مدى الحياة · تصوير بلا حدود، بلا إعلانات',
  'my.pro.subOn': 'اشتراك فعّال · تصوير بلا حدود، بلا إعلانات',
  'my.pro.renews': 'التجديد في {date}',
  'my.pro.pending': 'بانتظار الدفع. سيُفعّل Pro فور الموافقة.',
  'my.pro.noStore': 'تعذّر الاتصال بالمتجر الآن. حاول مرة أخرى بعد قليل.',
  'my.pro.legal': 'يتجدد الاشتراك تلقائيًا للمدة نفسها ما لم يُلغَ قبل 24 ساعة على الأقل من نهاية الفترة، ويُحصَّل المبلغ من حسابك في {store}. يمكنك الإلغاء في أي وقت من إعدادات الاشتراكات في {store}. خطة مدى الحياة تُدفع مرة واحدة فقط.',
  'my.buy.done': 'تم تفعيل Pro. صوّر كما تشاء.',
  'my.buy.failed': 'لم تكتمل عملية الشراء. حاول مرة أخرى.',
  'my.restore.done': 'تمت استعادة Pro.',
  'my.restore.none': 'لا توجد مشتريات لاستعادتها في هذا الحساب.',
  'my.restore.failed': 'تعذّرت الاستعادة. حاول مرة أخرى بعد قليل.',
  'my.app.title': 'لقطات أكثر في التطبيق',
  'my.app.body': '{n, plural, zero {في التطبيق، يمكنك التصوير بلا حدود مع Pro.} one {في التطبيق، يمنحك إعلان قصير لقطة إضافية، أو يمكنك التصوير بلا حدود مع Pro.} two {في التطبيق، يمنحك إعلان قصير لقطتين إضافيتين، أو يمكنك التصوير بلا حدود مع Pro.} few {في التطبيق، يمنحك إعلان قصير # لقطات إضافية، أو يمكنك التصوير بلا حدود مع Pro.} many {في التطبيق، يمنحك إعلان قصير # لقطة إضافية، أو يمكنك التصوير بلا حدود مع Pro.} other {في التطبيق، يمنحك إعلان قصير # لقطة إضافية، أو يمكنك التصوير بلا حدود مع Pro.}}',
  'my.app.play': 'احصل عليه من Google Play',
  'my.adPrivacy': 'خيارات خصوصية الإعلانات',
  'shots.left': 'المتبقي {n}',
  'shots.leftSay': '{n, plural, zero {لم يتبق لك اليوم أي لقطة} one {تبقّت لك اليوم لقطة واحدة} two {تبقّت لك اليوم لقطتان} few {تبقّت لك اليوم # لقطات} many {تبقّت لك اليوم # لقطة} other {تبقّت لك اليوم # لقطة}}',
  'pw.title': '{n, plural, zero {لا لقطات مجانية اليوم} one {انتهت لقطتك المجانية اليوم} two {انتهت لقطتاك المجانيتان اليوم} few {انتهت # لقطات مجانية اليوم} many {انتهت # لقطة مجانية اليوم} other {انتهت # لقطة مجانية اليوم}}',
  'pw.lead': 'إن كان الضوء ما زال جميلًا، فصوّر قليلًا بعد.',
  'pw.pro': 'تصوير بلا حدود مع Pro',
  'pw.later': 'سأعود غدًا',
};

export const cameraText: LocaleCameraText = {
  /** Camera body descriptions (expressive register, guide §1.1). */
  desc: {
    pro35: 'كاميرا SLR موثوقة بمقاس 35mm. كل أفلام 35mm، وثلاث نسب، وتكبير، وقرص لتعويض التعريض.', // ko: 믿음직한 35mm SLR. 모든 35mm 필름과 3가지 비율, 줌, 노출 보정까지. · en: A dependable 35mm SLR. Every 35mm film, three formats, zoom, and an exposure dial.
    snap27: 'كاميرا أحادية الاستخدام من 27 لقطة. عدسة بلاستيكية ناعمة، وفلاش تشحنه قبل كل لقطة.', // ko: 27장짜리 일회용 카메라. 살짝 뭉개지는 렌즈, 한 장마다 충전하는 플래시. · en: A 27-shot disposable. A soft plastic lens and a flash you charge before every shot.
    instasq: 'كاميرا فورية مربعة بعبوات من 10 لقطات. تخرج الصورة في الحال، ثم تتضح ملامحها رويدًا.', // ko: 정사각 인스턴트, 10장 팩. 찍자마자 사진이 나오고, 천천히 상이 떠올라요. · en: A square instant camera with 10-shot packs. Each print slides out and slowly comes to life.
    half72: 'كاميرا نصف إطار تضع لقطتين متجاورتين في كل إطار 35mm. 72 لقطة في الفيلم الواحد، وضعف اللحظات.', // ko: 35mm 한 컷에 두 장을 나란히 담는 하프프레임. 한 롤에 72장, 두 배의 순간. · en: Two shots side by side in every frame. 72 half-frames, twice the moments.
    zonelc: 'تعتيم أطراف كأنه نفق، وألوان مشبعة. كاميرا مدمجة لأيام التجوّل في الأزقة.', // ko: 터널 같은 비네팅과 진한 색. 골목을 걷는 날을 위한 컴팩트. · en: Tunnel vignetting and saturated color. A compact made for wandering the streets.
    toy120: 'كاميرا لعبة متوسطة المقاس بعدسة بلاستيكية. أطراف ضبابية، وتعتيم كثيف، وتسرّب ضوء متكرر.', // ko: 플라스틱 렌즈의 중판 토이 카메라. 흐릿한 가장자리, 짙은 비네팅, 자주 스미는 빛샘. · en: A plastic-lens medium-format toy. Soft edges, deep vignetting, and frequent light leaks.
    quad4: 'أربع عدسات تلتقط واحدة تلو الأخرى بفاصل 0.2 ثانية. أربع لحظات من الحركة في صورة واحدة.', // ko: 렌즈 4개가 0.2초 간격으로 차례차례. 한 장에 담기는 네 번의 움직임. · en: Four lenses fire 0.2 s apart. Four moments of motion in one frame.
    doublex: 'تعريضان في لقطة واحدة. مشهد ثانٍ يستقر فوق الأول.', // ko: 한 컷에 두 번의 노출. 첫 장면 위로 두 번째 장면이 포개져요. · en: Two exposures, one frame. A second scene settles over the first.
    panox: 'بانوراما واسعة بنسبة 65:24 تملأ مجال الرؤية. 21 لقطة في الفيلم الواحد.', // ko: 65:24의 넓은 파노라마. 시야 가득, 한 롤에 21장. · en: Sweeping 65:24 panoramas. 21 frames per roll.
    fish180: 'عين سمكة دائرية بزاوية 180°. العالم كله في دائرة.', // ko: 180° 원형 어안. 세상을 동그랗게 담아요. · en: A 180° circular fisheye. The whole world in a circle.
    cine: 'شاشة عريضة أنامورفية بنسبة 2.39:1. خطوط وهج زرقاء تعبر الأضواء الساطعة.', // ko: 2.39:1 시네마스코프. 밝은 빛을 가로지르는 푸른 플레어. · en: 2.39:1 anamorphic widescreen. Blue streaks of flare across bright lights.
    ccd03: 'كاميرا رقمية من عام 2003 كما كانت. بطاقة من 99 لقطة، وختم تاريخ رقمي، ومعاينة فورية.', // ko: 2003년 그 시절의 디카. 99장 메모리, 디지털 날짜, 찍고 바로 확인. · en: A digicam straight from 2003. 99-shot card, digital date imprint, instant review.
    pixel: 'كاميرا بكسل للجيب بدقة 128×112. 30 لقطة بلوحات من أربعة ألوان.', // ko: 128×112 픽셀의 포켓 카메라. 4색 팔레트에 담는 30장. · en: A 128×112 pocket pixel camera. 30 shots in four-color palettes.
    range: 'كاميرا هادئة بمقياس مسافة. عدسة حادة، وخطوط تأطير مضيئة، والأبيض والأسود افتراضيًا.', // ko: 조용한 레인지파인더. 선명한 렌즈, 밝은 프레임 라인, 기본은 흑백. · en: A quiet rangefinder. Crisp lens, bright frame lines, black and white by default.
    aqua27: 'كاميرا أحادية الاستخدام من 27 لقطة داخل غلاف مقاوم للماء. درجات زرقاء مخضرّة كلون الماء، وعدسة ناعمة، وفلاش تشحنه قبل كل لقطة.', // ko: 방수 하우징을 입은 27장 일회용. 물빛 청록 톤, 부드러운 렌즈, 한 장마다 충전하는 플래시. · en: A 27-shot disposable in a waterproof housing. Blue-green water tones, a soft lens, a flash you charge every shot.
    instaw: 'كاميرا فورية عريضة بعبوات من 10 لقطات. تخرج الصورة الأفقية في الحال، ثم تتضح ملامحها رويدًا.', // ko: 가로로 넓은 와이드 인스턴트, 10장 팩. 넓게 나온 사진에 천천히 상이 떠올라요. · en: A wide-format instant camera with 10-shot packs. Landscape prints slide out and slowly come to life.
    twin66: 'كاميرا عاكسة ثنائية العدسة تنظر فيها من الأعلى. 12 لقطة مربعة بمقاس 6×6، ومحدد منظر ينعكس فيه العالم بين اليمين واليسار.', // ko: 고개 숙여 내려다보는 이안 리플렉스. 6×6 정사각 12장, 파인더 속 세상은 좌우가 뒤바뀌어요. · en: A twin-lens reflex you look down into. 12 square 6×6 frames through a mirror-reversed finder.
    super8: 'لقطة واحدة من فيلم منزلي بمقاس 8mm. بوابة مستديرة الزوايا، وألوان دافئة، وحبيبات كثيفة.', // ko: 8mm 홈무비에서 꺼낸 한 프레임. 둥근 게이트, 따뜻한 색, 굵은 입자. · en: A single frame from an 8mm home movie. Rounded gate, warm color, heavy grain.
    slide35: 'كاميرا مدمجة مخصصة لأفلام الشرائح. ألوان زاهية تعود إليك في حوامل شرائح بيضاء.', // ko: 슬라이드 필름 전용 컴팩트. 쨍한 색을 하얀 마운트에 담아 돌려줘요. · en: A compact made for slide film. Vivid color, returned in white slide mounts.
    party: 'كاميرا مدمجة للحفلات، فلاشها الكبير يعمل افتراضيًا. فلاش أمامي قوي وختم للتاريخ.', // ko: 큼직한 플래시가 기본으로 켜지는 파티용 컴팩트. 정면으로 터지는 강한 플래시와 날짜 각인. · en: A party compact whose big flash is on by default. Hard, direct flash and a date imprint.
    kidcam: 'كاميرا رقمية للأطفال بدقة 0.3 MP. عرض 640 بكسل، وألوان مشبعة إلى أقصى حد، وتاريخ رقمي، ومعاينة فورية.', // ko: 0.3메가 어린이 디카. 640픽셀, 넘치는 채도, 디지털 날짜, 찍고 바로 확인. · en: A 0.3 MP kids’ camera. 640 px, colors turned all the way up, digital date, instant review.
    sprocket: 'بانوراما تمتد فوق ثقوب الفيلم، فتبقى الثقوب ظاهرة أعلى كل صورة وأسفلها.', // ko: 필름 구멍까지 담기는 파노라마. 사진 위아래로 퍼포레이션이 그대로 남아요. · en: A panorama that runs right over the sprocket holes, so the perforations frame every shot.
    floppy98: 'كاميرا رقمية من عام 1998 تحفظ الصور على قرص مرن. 20 صورة بعرض 640 بكسل في كل قرص، بألوان باردة ومطموسة.', // ko: 플로피 디스크에 저장하는 1998년 디카. 디스크 한 장에 640픽셀 사진 20장, 차갑고 뭉개진 색. · en: A 1998 digicam that saves to a floppy disk. 20 shots of 640 px per disk, cool smeared color.
    slim06: 'كاميرا رقمية فائقة النحافة بدقة 7 MP تناسب الجيب. ألوان زاهية، وفلاش يعمل افتراضيًا، وتاريخ رقمي.', // ko: 주머니에 쏙 들어가는 700만 화소 초슬림 디카. 쨍한 색, 기본으로 켜지는 플래시, 디지털 날짜. · en: A 7 MP ultra-slim for your pocket. Punchy color, flash on by default, digital date.
    bridge09: 'كاميرا بزوم فائق 20×. تقرّب البعيد، بنسب 4:3 أو 3:2 أو 1:1.', // ko: 20배 줌의 하이줌 디카. 먼 곳도 당겨 찍고, 4:3·3:2·1:1 세 가지 비율로. · en: A 20× superzoom. Pull in what’s far away, in 4:3, 3:2 or 1:1.
    zoom90: 'كاميرا مدمجة بزوم من التسعينيات. زوم 2×، ولفّ آلي للفيلم، وتاريخ برتقالي مطبوع.', // ko: 90년대 자동 줌 카메라. 2배 줌, 모터 감기, 주황색 날짜 각인. · en: A 90s auto zoom compact. 2× zoom, motor wind, orange date imprint.
    mf645: 'فيلم متوسط الحجم 6×4.5. خمس عشرة لقطة في كل بكرة، وعدسة حادة جدًا، ومدى درجات واسع.', // ko: 6×4.5 중형 필름. 롤 하나에 15장, 아주 선명한 렌즈와 넓은 계조. · en: 6×4.5 medium format. 15 frames a roll, a very sharp lens and a long tonal range.
    pinhole: 'صندوق خشبي بثقب دبوس بدلًا من العدسة. نعومة في كل مكان، وزوايا داكنة عميقة.', // ko: 렌즈 대신 바늘구멍 하나로 찍는 나무 상자. 전체가 부드럽고 가장자리는 깊게 어두워요. · en: A wooden box with a pinhole instead of a lens. Soft all over, with deep, dark corners.
    flip03: 'كاميرا موتورولا RAZR V3 من عام 2004 بدقة 0.3 MP. عرض 640 بكسل، وألوان باهتة، وتفاصيل مطموسة.', // ko: 2004년 모토로라 RAZR V3의 30만 화소 카메라. 640픽셀, 바랜 색, 뭉개진 디테일. · en: The 0.3 MP camera of the 2004 Motorola RAZR V3. 640 px, faded color, smeared detail.
    touch07: 'كاميرا أول iPhone (عام 2007) بدقة 2 MP. تركيز ثابت، ودرجات دافئة، وسماء محترقة.', // ko: 2007년 첫 아이폰의 200만 화소 카메라. 고정 초점, 따뜻한 톤, 하얗게 날아간 하늘. · en: The 2 MP camera of the first iPhone (2007). Fixed focus, warm tones, blown-out skies.
    curve07: 'كاميرا BlackBerry Curve من عام 2007 بدقة 2 MP. توازن أبيض بارد، وحدّة مفرطة، وتشويش خشن.', // ko: 2007년 블랙베리 커브의 200만 화소 카메라. 차가운 화이트밸런스, 강한 샤픈, 자글자글한 노이즈. · en: The 2 MP camera of the 2007 BlackBerry Curve. Cool white balance, heavy sharpening, gritty noise.
    filter10: 'iPhone 4 وفلاتر تطبيقات الصور في عام 2010. صور مربعة، وأسود باهت، وإضاءات صفراء، وإطار أبيض.', // ko: 2010년 아이폰 4와 사진 앱 필터 감성. 정사각 사진, 들뜬 검정, 노란 하이라이트, 하얀 테두리. · en: The iPhone 4 and the 2010 photo-app filters. Square shots, lifted blacks, yellow highlights, a white border.
  },
  /** Type word in the era line "1979 · SLR" (guide §3.3). The year and " · " are added by the app. */
  era: {
    SLR: 'SLR',
    Disposable: 'لمرة واحدة',
    Instant: 'فورية',
    'Half-frame': 'نصف إطار',
    Compact: 'مدمجة',
    '120 toy': 'لعبة 120',
    '4-lens': '4 عدسات',
    'Multi-ex': 'تعريض متعدد',
    Panoramic: 'بانورامية',
    Fisheye: 'عين السمكة',
    Anamorphic: 'أنامورفية',
    Digicam: 'رقمية',
    '2-bit': '2 بت',
    Rangefinder: 'بمقياس مسافة',
    Waterproof: 'مقاومة للماء',
    Wide: 'عريضة',
    TLR: 'TLR',
    'Home movie': 'أفلام منزلية',
    Slide: 'شرائح',
    'Big flash': 'فلاش قوي',
    'Kids digicam': 'رقمية للأطفال',
    Sprocket: 'ثقوب الفيلم',
    'Floppy digicam': 'كاميرا رقمية بقرص مرن',
    'Ultra-slim': 'فائقة النحافة',
    Superzoom: 'زوم فائق',
    'Zoom compact': 'مدمجة بزوم',
    'Medium format': 'متوسط الحجم',
    Pinhole: 'ثقب الدبوس',
    'Flip phone': 'هاتف قابل للطي',
    Smartphone: 'هاتف ذكي',
    'Filter app': 'تطبيق فلاتر',
    'QWERTY phone': 'هاتف QWERTY',
  },
};

/** Film stock / sensor descriptions (expressive register). Film names stay in Latin letters. */
export const stockText: LocaleStockText = {
  sunny200: 'أصفر دافئ يفيض بأشعة الشمس. الفيلم الكلاسيكي للسفر ولقطات الحياة اليومية.', // ko: 햇살을 머금은 따뜻한 노랑. 여행과 일상 스냅의 정석. · en: Warm yellows full of sunshine. The classic film for travel and everyday snapshots.
  muse400: 'درجات بشرة ناعمة وإضاءات بألوان الباستيل. فيلم صُنع لتصوير الناس.', // ko: 부드러운 피부톤, 파스텔빛 하이라이트. 사람을 담기 좋은 인물용 필름. · en: Gentle skin tones and pastel highlights. Made for portraits.
  mint400: 'لمسة خضراء في الظلال. هواء المدينة في صورة.', // ko: 그늘에 살짝 도는 초록빛. 도시와 거리의 공기. · en: A hint of green in the shadows. City air in a frame.
  snap800: 'إحساس الكاميرا أحادية الاستخدام كما عهدته. فلاش، وتعتيم أطراف كثيف، وتسرّب ضوء تصنعه الصدفة.', // ko: 일회용 카메라, 그때 그 느낌. 플래시, 진한 비네팅, 우연이 만든 빛샘. · en: Straight out of a disposable. Flash, deep vignetting, and leaks by happy accident.
  mono400: 'أسود عميق وحبيبات خشنة. أبيض وأسود يروي الأشياء كما هي.', // ko: 깊은 검정과 거친 입자의 흑백. 있는 그대로를 담는 다큐멘터리의 결. · en: Deep blacks and gritty grain. Black and white that tells it straight.
  insta600: 'ألوان باهتة قليلًا وحافة بيضاء. دفء صورة فورية تمسكها بيدك.', // ko: 살짝 바랜 색과 하얀 테두리. 손에 쥐는 즉석 사진의 온기. · en: Softly faded color in a white frame. The warmth of an instant print.
  neon800t: 'فيلم سينمائي لإضاءة التنغستن. هالة حمراء تتفتح حول أضواء النيون.', // ko: 텅스텐 시네마 필름. 네온 불빛 둘레로 번지는 붉은 할레이션. · en: Tungsten cinema film. Red halation blooms around neon lights.
  velvet50: 'تشبّع غني وتباين جريء. فيلم شرائح للمناظر الطبيعية.', // ko: 쨍한 채도와 높은 대비의 슬라이드 필름. 풍경을 위한 필름. · en: Rich saturation and bold contrast. A slide film for landscapes.
  chrome100: 'درجات شرائح نقية وباردة. سماء صافية كالزجاج.', // ko: 맑고 차가운 슬라이드 톤. 투명하게 갠 하늘. · en: Clean, cool slide tones. Skies as clear as glass.
  silver100: 'حبيبات دقيقة ومدى واسع من الدرجات. أبيض وأسود بظلال هادئة ورقيقة.', // ko: 고운 입자와 넓은 계조. 빛의 결이 섬세한 흑백. · en: Fine grain and a long tonal range. Black and white in quiet, subtle shades.
  dream160: 'تباين منخفض وألوان باستيل خفيفة كالهواء.', // ko: 낮은 대비, 공기처럼 가벼운 파스텔. · en: Low contrast and pastels as light as air.
  expired98: 'انتهت صلاحيته عام 1998. ضباب أرجواني وغبار، ومفاجأة في كل لقطة.', // ko: 1998년에 만료된 필름. 마젠타 포그와 먼지, 결과는 현상해 봐야 알아요. · en: Expired in 1998. Magenta fog, dust, and a surprise in every frame.
  xpro200: 'فيلم شرائح بتحميض متقاطع كنيغاتيف (C-41). تباين حاد، وإضاءات بلون أخضر ليموني، وظلال زرقاء مخضرّة.', // ko: 슬라이드 필름을 네거티브(C-41)로 교차현상. 강한 대비, 연둣빛 하이라이트, 청록빛 그림자. · en: Slide film cross-processed as negative (C-41). Hard contrast, lime highlights, teal shadows.
  instamini: 'فيلم فوري صغير مشرق ونقي، بأبيض صافٍ ولمسة باردة.', // ko: 밝고 산뜻한 미니 인스턴트. 깨끗한 화이트와 살짝 차가운 톤. · en: Bright, crisp mini instant film with clean whites and a cool touch.
  ccd: 'مستشعر CCD من كاميرا رقمية في أوائل الألفينيات. إضاءات محترقة، ومسحة زرقاء، وحواف بنفسجية.', // ko: 2000년대 초 디카의 CCD. 날아가는 하이라이트, 푸르스름한 톤, 보랏빛 번짐. · en: The CCD of an early-2000s digicam. Clipped highlights, a blue cast, purple fringing.
  pixel: 'مستشعر 2 بت بدقة 128 بكسل. أربعة ألوان فقط مع تنقيط.', // ko: 128픽셀 2비트 센서. 단 4가지 색과 디더링. · en: A 128-pixel, 2-bit sensor. Just four colors and dithering.
  aqua400: 'فيلم أحادي الاستخدام للتصوير تحت الماء. يتلاشى الأحمر في ضباب أزرق مخضرّ، مع حبيبات ناعمة.', // ko: 물속 일회용 필름. 붉은빛이 바래 사라진 청록 톤, 뿌연 입자. · en: Underwater disposable film. Reds fade into a blue-green haze, with soft grain.
  instawide: 'فيلم فوري عريض. ألوان طبيعية وإضاءات دافئة برفق.', // ko: 와이드 인스턴트 필름. 자연스러운 색에 살짝 따뜻한 하이라이트. · en: Wide instant film. Natural color with gently warm highlights.
  reel40: 'فيلم عكسي للأفلام المنزلية. ألوان دافئة مشبعة، وحبيبات كبيرة، وبوابة يعلوها الغبار.', // ko: 홈무비 리버설 필름. 따뜻하고 진한 색, 굵은 입자, 먼지 앉은 게이트. · en: Home-movie reversal film. Warm, saturated color, big grain, and a dusty gate.
  toycmos: 'مستشعر لعبة بدقة 0.3 MP: ألوان كالحلوى، وإضاءات محترقة، وتشوّش لوني متبقّع.', // ko: 0.3메가 장난감 센서. 사탕 같은 색, 날아간 하이라이트, 얼룩덜룩한 색 노이즈. · en: A 0.3 MP toy sensor: candy colors, blown highlights, blotchy color noise.
  vga98: 'مستشعر كاميرا رقمية بقرص مرن من أواخر التسعينيات: مدى ضيق، وصبغة باردة، وضبابية JPEG.', // ko: 90년대 말 플로피 디카의 센서. 좁은 계조, 차가운 톤, 뭉개진 JPEG. · en: A late-90s floppy-disk sensor. Short tonal range, a cool cast, soft JPEG blur.
  ccd7: 'مستشعر CCD بدقة 7 MP من منتصف العقد الأول من الألفية: ألوان زاهية، وبشرة دافئة، وحدّة مفرطة، وإضاءات تحترق بسرعة.', // ko: 2000년대 중반 700만 화소 CCD. 쨍한 색, 따뜻한 피부, 과한 샤프닝, 확 날아가는 하이라이트. · en: A mid-2000s 7 MP CCD. Punchy color, warm skin, crunchy sharpening, hard-clipped highlights.
  vgaphone: 'مستشعر أوائل الهواتف المزودة بكاميرا: ألوان باهتة، وصبغة خضراء مصفرّة، وظلال مليئة بالتشويش.', // ko: 초기 폰카 센서. 바랜 색, 누르스름한 초록빛, 자글자글한 그림자. · en: An early camera-phone sensor. Washed out, a green-yellow cast, noisy shadows.
  phone2mp: 'مستشعر الجيل الأول من الهواتف الذكية: توازن أبيض دافئ، وسماء محترقة، وتفاصيل ناعمة.', // ko: 1세대 스마트폰 센서. 따뜻한 화이트밸런스, 날아간 하늘, 부드러운 디테일. · en: A first-generation smartphone sensor. Warm white balance, blown skies, soft detail.
  bbcurve: 'مستشعر هاتف بلوحة مفاتيح QWERTY: درجات مائلة إلى الزرقة، وحواف مفرطة الحدّة، وتشويش خشن في الظلال.', // ko: 쿼티폰 센서. 푸르스름한 톤, 과한 샤픈, 거친 그림자 노이즈. · en: A QWERTY-phone sensor. Bluish tones, over-sharpened edges, coarse shadow noise.
  app10: 'فلتر تطبيق صور من أوائل العقد الثاني من الألفية: أسود مطفأ، وإضاءات صفراء، وتعتيم قوي للأطراف.', // ko: 2010년대 초 사진 앱 필터. 들뜬 검정, 노란 하이라이트, 진한 비네팅. · en: An early-2010s photo-app filter. Matte blacks, yellow highlights, a heavy vignette.
};
