/**
 * Film Camela — Simplified Chinese (zh-CN). Lazy-loaded when this language is chosen or detected.
 *
 * TRANSLATOR CONTRACT — read docs/10_LOCALIZATION_GUIDE.md first (§2.4 for this language, §3 names,
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
 *    Chinese has only "other": no plural blocks. Write the measure word directly: '{n} 张', '{n} 卷'.
 * 5. Never translate, transliterate or inflect: Film Camela, camera names (Pro 35, Snap 27…), film names
 *    (Sunny 200, Expired '98…), ISO, EV, f/8, 1/125, 35mm, 6×6, 2.39:1, 65:24, PRO, CSV, .zip, HTTPS,
 *    Safari, Chrome. Dates, times, sizes and durations arrive formatted in {time} {date} {t} {wait} {used}.
 * 6. Typography: plain Unicode text only; no HTML, no line breaks, no bidi control characters, no "!" hype.
 * 7. Check your file:  STRICT_I18N=1 npx vitest run tests/locales.test.ts   (lists missing keys, bad
 *    placeholders, plural syntax errors) and  npx tsc --noEmit .
 *
 * cameraText.era and the tab labels are pre-filled from the guide's tables (§3.3, §8.3); review them.
 *
 * zh notes: 你 (not 您); full-width punctuation; half-width space between Han and Latin/digits/placeholders
 * that render Latin or digits. Glossary: 冲洗 (develop), 送去冲洗 (send to lab), 冲洗店 (lab), 暗房 (darkroom),
 * 胶卷/卷 (roll), 张 (exposures/photos), 相纸 (instant pack), 接触印样 (contact sheet), 原图 (original),
 * 即时成像 (instant; never 拍立得), 分享/保存. {time} arrives as "9:00" / "14:48" (zh-CN default 24 h), after 今天/明天 + space.
 * Print border chip = 白边 (相纸 is reserved for instant packs). Backup copy names no third-party apps.
 * Number + measure word inside long prose uses \u00A0 so the pair never splits across lines.
 */
import type { LocaleCameraText, LocaleMessages, LocaleStockText } from './types';

export const messages: LocaleMessages = {
  'app.tagline': '保留每一张原图的胶片相机', // ko: 원본이 그대로 남는 필름 카메라 · en: The film camera that keeps every original
  'tab.camera': '相机', // from guide §8.3 · en: Camera
  'tab.lab': '冲洗店', // from guide §8.3 · en: Lab
  'tab.gallery': '相册', // from guide §8.3 · en: Album
  'tab.analog': '胶片机', // from guide §8.3 · en: Analog
  'tab.settings': '设置', // from guide §8.3 · en: Settings
  'common.cancel': '取消', // ko: 취소 · en: Cancel
  'common.close': '关闭', // ko: 닫기 · en: Close
  'common.save': '保存', // ko: 저장 · en: Save
  'common.delete': '删除', // ko: 삭제 · en: Delete
  'common.done': '完成', // ko: 완료 · en: Done
  'common.retry': '重试', // ko: 다시 시도 · en: Retry
  'common.back': '返回', // ko: 뒤로 · en: Back
  'common.next': '下一步', // ko: 다음 · en: Next
  'common.start': '开始', // ko: 시작하기 · en: Get started
  'common.on': '打开', // ko: 켜짐 · en: On
  'common.off': '关闭', // ko: 꺼짐 · en: Off
  'common.pro': 'PRO', // ko: PRO · en: PRO
  'common.loading': '正在载入…', // ko: 불러오는 중… · en: Loading…
  'common.error': '暂时出了点问题，请重试。', // ko: 잠시 문제가 생겼어요. 다시 시도해 주세요. · en: Something went wrong. Please try again.
  'toast.close': '关闭提示', // ko: 알림 닫기 · en: Dismiss
  'lab.developedMany': '{n} 卷胶卷冲洗好了', // ko: 롤 {n}개 현상이 끝났어요 · en: {n} rolls developed
  'cam.loadCard': '插入存储卡', // ko: 메모리 카드 넣기 · en: Insert card
  'cam.loadPack': '装入相纸', // ko: 필름 팩 넣기 · en: Load film pack
  'cam.useCamera': '用这台相机拍', // ko: 이 카메라로 찍기 · en: Use this camera
  'cam.allCameras': '查看全部', // ko: 모두 보기 · en: All cameras
  'cam.allCamerasTitle': '全部相机', // ko: 카메라 모두 보기 · en: All cameras
  'cam.group.film': '胶片相机', // ko: 필름 카메라 · en: Film cameras
  'cam.group.instant': '即时成像相机', // ko: 즉석 카메라 · en: Instant cameras
  'cam.group.digital': '数码', // ko: 디지털 · en: Digital
  'cam.group.toy': '玩具与特殊相机', // ko: 토이·특수 카메라 · en: Toy & special
  'a11y.stockKeys': '用 ← → 键浏览胶卷，按 Enter 键选择', // ko: ← → 키로 필름을 살펴보고 Enter로 골라요 · en: Arrow keys browse films; Enter selects
  'gal.importHint': '照片会用这款胶卷冲洗，之后随时可以在暗房里更换。', // ko: 고른 필름으로 현상해요. 다크룸에서 언제든 바꿀 수 있어요. · en: Your photos develop with this film. You can change it in the darkroom any time.
  'onb.restore': '换了新手机？恢复备份', // ko: 이전 폰에서 옮겨 오셨나요? 백업 불러오기 · en: Coming from another phone? Restore a backup
  'onb.1.title': '像胶片一样，一张一张拍', // ko: 필름처럼, 한 장씩 · en: Shoot like film
  'onb.1.body': '选一台相机，装上一卷胶卷。数着剩下的张数，用心按下每一次快门。', // ko: 카메라를 고르고 롤을 넣어 보세요. 남은 장수를 세어 가며, 셔터 한 번에 마음을 담아요. · en: Pick a camera, load a roll, and make every frame count.
  'onb.2.title': '等待冲洗的心动', // ko: 현상소에서 기다리는 설렘 · en: Let the lab take its time
  'onb.2.body': '拍完一卷，就送去冲洗。立即、1\u00A0小时、早上 9\u00A0点或 3\u00A0天，想等多久，由你决定。', // ko: 다 찍은 롤은 현상소로 보내요. 즉시, 1시간, 아침 9시, 3일 중에서 기다림의 길이를 골라 보세요. · en: Send finished rolls to the lab and choose your wait: Instant, 1 hour, next 9 AM, or 3 days.
  'onb.3.title': '在暗房重新冲洗', // ko: 다크룸에서 언제든 다시 현상 · en: Re-develop in the darkroom
  'onb.3.body': '原图始终完好保留。胶卷、亮度、过期胶卷质感和光晕，想重选几次都可以。', // ko: 찍은 원본은 언제나 그대로 남아요. 필름, 밝기, 오래된 필름 느낌, 빛 번짐까지 몇 번이고 다시 골라 보세요. · en: Your original is always kept. Try another film, brightness, aged-film look, or glow, as often as you like.
  'onb.privacy': '免费 · 无需账户，没有服务器。每一张照片都只留在这台设备上。', // ko: 무료 · 계정도 서버도 없어요. 모든 사진은 이 기기 안에만 머물러요. · en: Free. No account. No servers. Every photo stays on this device.
  'cam.loadFilm': '装入胶卷', // ko: 필름 넣기 · en: Load film
  'cam.chooseFilm': '选择胶卷', // ko: 필름을 고르세요 · en: Choose your film
  'cam.exposures': '{n} 张', // ko: {n}장 · en: {n} exp
  'cam.load': '装入这卷胶卷', // ko: 이 필름 넣기 · en: Load this film
  'cam.left': '剩 {n} 张', // ko: {n}장 남음 · en: {n} left
  'cam.rewind': '送去冲洗', // ko: 현상소로 보내기 · en: Send to lab
  'cam.rollFull': '这一卷已全部拍完', // ko: 롤을 끝까지 다 찍었어요 · en: Roll finished
  'cam.sendToLab': '送去冲洗', // ko: 현상소로 보내기 · en: Send to lab
  'cam.flash': '闪光灯', // ko: 플래시 · en: Flash
  'cam.timer': '定时', // ko: 타이머 · en: Timer
  'cam.grid': '网格', // ko: 격자 · en: Grid
  'cam.date': '日期', // ko: 날짜 · en: Date
  'cam.flip': '切换镜头', // ko: 카메라 전환 · en: Switch camera
  'cam.zoom': '变焦', // ko: 줌 · en: Zoom
  'cam.aspect': '画幅', // ko: 비율 · en: Format
  'cam.shutter': '拍照', // ko: 촬영 · en: Take photo
  'cam.noCamera.title': '无法使用相机', // ko: 카메라를 사용할 수 없어요 · en: Camera unavailable
  'cam.noCamera.body': '请在浏览器或设备设置中允许访问相机。现在也可以先导入设备里的照片来冲洗。', // ko: 브라우저나 기기 설정에서 카메라 권한을 허용해 주세요. 그동안 기기에 있는 사진을 불러와 현상할 수도 있어요. · en: Allow camera access in your browser or device settings. In the meantime, you can import photos and develop them.
  'cam.noCamera.import': '导入照片来冲洗', // ko: 사진 불러와 현상하기 · en: Import & develop photos
  'cam.starting': '正在启动相机…', // ko: 카메라 준비 중… · en: Starting camera…
  'cam.saved': '第 {n} 张', // ko: {n}번째 컷 · en: Frame {n}
  'cam.rewindConfirm': '已拍 {shots}。剩下的 {left}将留空，现在送去冲洗吗？', // ko: {shots} 찍었어요. 남은 {left}은 비워 둔 채 현상소로 보낼까요? · en: You’ve taken {shots}. Send this roll to the lab? The remaining {left} will stay blank. [+ counts: n, m]
  'cam.emptyRewind': '还没拍任何照片。现在取出胶卷，这一卷就会被丢弃。', // ko: 아직 찍은 사진이 없어요. 지금 필름을 빼면 이 롤은 사라져요. · en: No shots yet. If you unload now, this roll is discarded.
  'cam.unload': '取出胶卷', // ko: 필름 빼기 · en: Unload film
  'cam.rollSize': '胶卷张数', // ko: 롤 장수 · en: Roll size
  'cam.rollInfo': '胶卷信息', // ko: 롤 정보 · en: roll info
  'cam.sec': '{n} 秒', // ko: {n}초 · en: {n}s
  'cam.err.insecure': '相机只能在安全连接（HTTPS）下使用。请通过 https 地址打开。', // ko: 카메라는 보안 연결(HTTPS)에서만 쓸 수 있어요. https 주소로 열어 주세요. · en: The camera only works over a secure (HTTPS) connection. Open the https address.
  'cam.err.unsupported': '此浏览器不支持相机。请用最新版 Safari 或 Chrome 打开。', // ko: 이 브라우저는 카메라를 지원하지 않아요. 최신 Safari나 Chrome에서 열어 주세요. · en: This browser doesn't support the camera. Try the latest Safari or Chrome.
  'cam.err.busy': '其他 App 正在使用相机。请关闭该 App 后重试。现在也可以先导入设备里的照片来冲洗。', // ko: 다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 시도해 주세요. 그동안 기기의 사진을 불러와 현상할 수 있어요. · en: Another app is using the camera. Close it and try again. In the meantime, you can import photos and develop them.
  'cam.err.notfound': '这台设备上没有找到相机。你可以改为导入设备里的照片来冲洗。', // ko: 이 기기에서 카메라를 찾지 못했어요. 대신 기기의 사진을 불러와 현상할 수 있어요. · en: No camera was found on this device. You can import photos and develop them instead.
  'cam.quadProgress': '镜头 {n}/4', // ko: 렌즈 {n}/4 · en: Lens {n}/4
  'common.skip': '跳过', // ko: 건너뛰기 · en: Skip
  'view.savedToast': '图片已保存', // ko: 이미지를 저장했어요 · en: Image saved
  'view.prev': '上一张', // ko: 이전 사진 · en: Previous photo
  'view.next': '下一张', // ko: 다음 사진 · en: Next photo
  'view.photoN': '第 {n} 张照片', // ko: {n}번째 사진 · en: Photo {n}
  'dr.applyRollConfirm': '要把这些设置应用到这一卷的所有照片吗？', // ko: 이 설정을 롤의 모든 사진에 적용할까요? · en: Apply these settings to every photo in the roll?
  'dr.original': '原图', // ko: 원본 · en: Original
  'dr.showOriginal': '查看原图', // ko: 원본 보기 · en: Show original
  'dr.years': '{n} 年', // ko: {n}년 · en: {n, plural, one {# year} other {# years}}
  'an.log.deleteFrame': '删除第 {n} 张的记录', // ko: {n}번 컷 기록 삭제 · en: Delete frame {n} log
  'lab.rushFor': '立即冲洗 · {stock}', // ko: 지금 바로 현상 · {stock} · en: Develop now · {stock}
  'speed.default': '默认', // ko: 기본 · en: default
  'palette.moss': '苔绿', // ko: 이끼 · en: Moss
  'palette.mono': '黑白', // ko: 흑백 · en: Mono
  'palette.sepia': '棕褐', // ko: 세피아 · en: Sepia
  'palette.ice': '冰蓝', // ko: 얼음 · en: Ice
  'palette.berry': '莓果', // ko: 베리 · en: Berry
  'cam.chooseCamera': '选择相机', // ko: 카메라를 고르세요 · en: Choose your camera
  'cam.film': '胶卷', // ko: 필름 · en: Film
  'cam.fixedFilm': '专用胶卷', // ko: 전용 필름 · en: Built-in film
  'cam.pin': '置顶 {name}', // ko: {name} 고정 · en: Pin {name}
  'cam.pinHint': '置顶', // ko: 맨 앞에 고정 · en: Pin to the front
  'cam.pinned': '已置顶', // ko: 고정됨 · en: Pinned
  'cam.pinnedSay': '已置顶 {name} · 显示在最前面', // ko: {name} 고정했어요 · 맨 앞에 보여요 · en: {name} pinned to the front
  'cam.unpinnedSay': '已取消置顶 {name}', // ko: {name} 고정을 풀었어요 · en: {name} unpinned
  'cam.pinnedToast': '已置顶 {name} · 移到了最前面', // ko: {name} 고정 · 맨 앞으로 옮겼어요 · en: {name} pinned · moved to the front
  'cam.pinShow': '查看', // ko: 보기 · en: Show
  'cam.otherWindow': '已在另一个窗口中拍过', // ko: 다른 창에서 이미 찍었어요 · en: Already taken in another window
  'cam.pressesDropped': '已取消 {n} 次快门操作', // ko: {n}번 누른 건 취소됐어요 · en: {n, plural, one {# press was} other {# presses were}} cancelled
  'cam.quickStart': '快速开始', // ko: 빠른 시작 · en: Quick start
  'cam.quick.film': '胶片相机', // ko: 일반 필름 · en: Film camera
  'cam.quick.instant': '即时成像', // ko: 즉석 사진 · en: Instant photo
  'cam.quick.disposable': '一次性', // ko: 일회용 · en: Disposable
  'cam.pack': '{n} 张装相纸', // ko: {n}장 팩 · en: {n}-shot pack
  'cam.card': '存储卡 {n} 张', // ko: {n}장 메모리 · en: {n}-shot card
  'cam.halves': '半格 {n} 张', // ko: 하프 {n}장 · en: {n} half-frames
  'cam.flashCharge': '轻点为闪光灯充电', // ko: 탭해서 플래시 충전 · en: Tap to charge the flash
  'cam.flashCharging': '正在充电…', // ko: 충전 중… · en: Charging…
  'cam.flashReady': '闪光灯已就绪', // ko: 플래시 준비됨 · en: Flash ready
  'cam.ev': '曝光', // ko: 노출 · en: Exposure
  'cam.palette': '色板', // ko: 팔레트 · en: Palette
  'cam.halfNext': '下一张会拍在右半格', // ko: 다음 장은 오른쪽 칸에 찍혀요 · en: Next shot fills the right half
  'cam.double1': '第一次曝光完成 · 再找一个要叠加的画面', // ko: 첫 번째 노출 완료 · 겹쳐 담을 장면을 찾아보세요 · en: First exposure done · now find the second scene
  'cam.quadHint': '按一次，4 个镜头依次拍摄', // ko: 한 번 누르면 렌즈 4개가 차례로 찍어요 · en: One press, four lenses in sequence
  'cam.inCamera': '相机内', // ko: 카메라 안 · en: In camera
  'cam.lastShot': '最近一张', // ko: 마지막 사진 · en: Last shot
  'cam.packDone': '这盒相纸用完了。照片正在相册里等你。', // ko: 팩을 다 썼어요. 사진은 앨범에서 기다리고 있어요. · en: Pack finished. Your photos are waiting in the album.
  'cam.nShots': '{n}\u00A0张', // ko: {n}장 · en: {n, plural, one {# shot} other {# shots}}
  'cam.nHalves': '{n}\u00A0张（{f}\u00A0格）', // ko: {n}컷({f}프레임) · en: {n, plural, one {# half} other {# halves}} ({f, plural, one {# frame} other {# frames}})
  'cam.nHalfShots': '{n}\u00A0张', // ko: {n}컷 · en: {n, plural, one {# half} other {# halves}}
  'cam.develop': '送去冲洗', // ko: 현상소로 · en: Send to lab
  'cam.finishPack': '取出相纸', // ko: 팩 꺼내기 · en: Finish pack
  'cam.finishCard': '取出存储卡', // ko: 카드 정리 · en: Finish card
  'cam.rewindSub': '胶卷倒片后送去冲洗。冲洗好后，就能在相册里看到照片。', // ko: 필름을 감아 현상소로 보내요. 현상이 끝나면 앨범에서 볼 수 있어요. · en: The roll goes to the lab. Once developed, the photos appear in your album.
  'cam.finishSubViewable': '照片已经在相册里了。取出后就能换上新的。', // ko: 사진은 이미 앨범에 있어요. 정리하면 새로 넣을 수 있어요. · en: Your photos are already in the album. Finish to start a fresh one.
  'cam.finishPackConfirm': '已拍 {shots}。剩下的 {left}将不再使用，现在取出相纸吗？', // ko: {shots} 찍었어요. 팩에 남은 {left}은 쓰지 않고 꺼낼까요? · en: {shots} taken. Finish the pack? The remaining {left} will go unused. [+ counts: n, m]
  'cam.finishCardConfirm': '已拍 {shots}。存储卡剩下的 {left}将留空，现在取出吗？照片会一直留在相册里。', // ko: {shots} 찍었어요. 카드에 남은 {left}은 비워 두고 정리할까요? 사진은 앨범에 그대로 있어요. · en: {shots} taken. Finish the card? The remaining {left} will stay blank; your photos stay in the album. [+ counts: n, m]
  'cam.switchBody': '换一台相机', // ko: 다른 카메라로 바꾸기 · en: Switch camera body
  'cam.switchSub': '先把这一卷送去冲洗，再选新的相机。', // ko: 지금 롤을 먼저 현상소로 보낸 뒤 새 카메라를 골라요. · en: This roll goes to the lab first, then you pick a new camera.
  'cam.switchSubViewable': '照片留在相册里，接着选新的相机。', // ko: 지금 사진은 앨범에 두고 새 카메라를 골라요. · en: Your photos stay in the album, then you pick a new camera.
  'cam.switchSubEmpty': '还没有拍照，可以直接更换。', // ko: 아직 찍은 사진이 없어서 바로 바꿀 수 있어요. · en: Nothing shot yet, so you can switch right away.
  'cam.switchConfirm': '要换相机，需要先把这一卷（{shots}）送去冲洗。拍下的照片都会冲洗出来。', // ko: 카메라를 바꾸려면 지금 롤({shots})을 먼저 현상소로 보내야 해요. 찍은 사진은 모두 현상돼요. · en: To switch cameras, this roll ({shots}) goes to the lab first. Every shot will be developed. [+ counts: n] — shown only when no frames are left unused
  'cam.switchConfirmPack': '要换相机，需要先取出这盒相纸（{shots}）。照片会留在相册里。', // ko: 카메라를 바꾸려면 지금 팩({shots})을 먼저 꺼내요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this pack ({shots}) comes out first. Your photos stay in the album. [+ counts: n]
  'cam.switchConfirmCard': '要换相机，需要先取出这张存储卡（{shots}）。照片会留在相册里。', // ko: 카메라를 바꾸려면 지금 카드({shots})를 먼저 정리해요. 사진은 앨범에 그대로 있어요. · en: To switch cameras, this card ({shots}) is finished first. Your photos stay in the album. [+ counts: n]
  'cam.switchOkFilm': '送去冲洗并更换', // ko: 현상소로 보내고 바꾸기 · en: Send to lab & switch
  'cam.switchOkDone': '取出并更换', // ko: 정리하고 바꾸기 · en: Finish & switch
  'cam.switchedLab': '胶卷已送去冲洗。现在来选一台新相机吧。', // ko: 롤을 현상소에 보냈어요. 이제 새 카메라를 골라 보세요. · en: Roll sent to the lab. Pick your next camera.
  'cam.switchedAlbum': '照片已放进相册。现在来选一台新相机吧。', // ko: 사진을 앨범에 넣었어요. 이제 새 카메라를 골라 보세요. · en: Photos are in your album. Pick your next camera.
  'cam.more': '更多', // ko: 더보기 · en: More
  'cam.flashOnSay': '闪光灯已打开', // ko: 플래시 켬 · en: Flash on
  'cam.flashOffSay': '闪光灯已关闭', // ko: 플래시 끔 · en: Flash off
  'cam.flashOnScreen': '闪光灯已打开 · 前置镜头会用屏幕补光', // ko: 플래시 켬 · 전면 카메라는 화면이 하얗게 빛나요 · en: Flash on · the front camera lights up the screen instead
  'cam.flipToFront': '切换到前置镜头', // ko: 전면 카메라로 전환 · en: Flip to front camera
  'cam.flipToBack': '切换到后置镜头', // ko: 후면 카메라로 전환 · en: Flip to back camera
  'gal.emptyHintCamera': '相机里还有已拍的 {shots}。送去冲洗后，照片就会出现在这里。', // ko: 카메라 안에 사진 {shots}이 기다리고 있어요. 현상소로 보내면 현상을 마친 뒤 여기에 나타나요. · en: You have {shots} in the camera. Send them to the lab and they show up here once developed. [+ counts: n]
  'gal.developNow': '送去冲洗', // ko: 현상소로 보내기 · en: Send to lab
  'gal.inCameraBanner': '相机内 {shots} · 送去冲洗', // ko: 카메라 안 {shots} · 현상소로 보내기 · en: {shots} in the camera · Send to lab [+ counts: n]
  'lab.emptyCamera': '相机里已拍 {shots}。把胶卷送过来，就会在这里开始冲洗。', // ko: 카메라 안에 사진 {shots}이 있어요. 현상소로 보내면 여기서 현상이 시작돼요. · en: You have {shots} in the camera. Send the roll to the lab and it develops here. [+ counts: n]
  'speed.title': '想什么时候拿到照片？', // ko: 언제 받아볼까요? · en: When do you want your prints?
  'speed.instant': '立即', // ko: 즉시 · en: Instant
  'speed.why': '快要忘记时，照片才送到。这份惊喜，就是胶片的乐趣。想马上看，就选“立即”。', // ko: 잊을 즈음 도착하는 설렘, 그게 필름의 재미예요. 바로 보려면 ‘즉시’. · en: Forget the roll, then find it again. That’s film. Instant shows them now.
  'speed.at.now': '直接进入相册', // ko: 지금 바로 앨범에 도착 · en: In your album right away
  'speed.at.today': '今天 {time} 送达', // ko: 오늘 {time} 도착 · en: Arrives today at {time}
  'speed.at.tomorrow': '明天 {time} 送达', // ko: 내일 {time} 도착 · en: Arrives tomorrow at {time}
  'speed.at.date': '{date}送达', // ko: {date} 도착 · en: Arrives {date}
  'speed.instant.d': '不用等，现在就看', // ko: 기다림 없이, 지금 바로 · en: No waiting. See them now
  'speed.1h': '1 小时', // ko: 1시간 · en: 1 hour
  'speed.1h.d': '一杯咖啡的时间', // ko: 커피 한 잔의 기다림 · en: Time for a coffee
  'speed.morning': '早上 9 点', // ko: 아침 9시 · en: Next 9 AM
  'speed.morning.d': '一觉醒来就到了', // ko: 자고 일어나면 와 있어요 · en: Wake up to your photos
  'speed.3d': '3 天', // ko: 3일 · en: 3 days
  'speed.3d.d': '慢慢来，才是胶片', // ko: 진짜 필름처럼, 느긋하게 · en: Slow, like real film
  'lab.title': '冲洗店', // ko: 현상소 · en: Film Lab
  'lab.empty': '冲洗店里现在很安静。', // ko: 지금은 현상소가 조용해요. · en: The lab is quiet right now.
  'lab.emptyHint': '送去冲洗的胶卷会在这里等候。', // ko: 현상소로 보낸 롤은 여기서 기다려요. · en: Rolls you send to the lab wait here.
  'lab.emptyWhat': '冲洗好之前，胶卷都在这里。', // ko: 현상소로 보낸 롤이 현상될 때까지 머무는 곳이에요. · en: Rolls you send to the lab rest here while they develop.
  'lab.emptyHow': '照片会按你选的时间送达。选“立即”，就直接进入相册。', // ko: 고른 시간에 맞춰 도착해요. ‘즉시’라면 바로 앨범으로. · en: They arrive on the schedule you choose. Instant skips the wait.
  'lab.intro': '冲洗完成的胶卷会移到相册。', // ko: 현상을 마친 롤은 앨범으로 옮겨져요. · en: Developed rolls move to your album.
  'lab.introRush': '等不及的话，轻点“立即冲洗”。', // ko: 기다리기 어렵다면 ‘지금 바로 현상’을 눌러 보세요. · en: Can’t wait? Tap Develop now.
  'lab.readyIn': '还需 {t}', // ko: {t} 남음 · en: Ready in {t}
  'lab.ready': '冲洗完成', // ko: 현상 완료 · en: Developed
  'lab.rush': '立即冲洗', // ko: 지금 바로 현상 · en: Develop now
  'lab.rushConfirm': '跳过等待，马上就能在相册里看到照片。', // ko: 기다림을 건너뛰고 바로 앨범에서 볼 수 있어요. · en: Skip the wait and see the photos in the album right away.
  'lab.developedToast': '你的 {stock} 胶卷冲洗好了', // ko: {stock} 롤 현상이 끝났어요 · en: Your {stock} roll is developed
  'lab.open': '查看照片', // ko: 사진 보기 · en: View photos
  'gal.title': '相册', // ko: 앨범 · en: Album
  'gal.empty': '还没有冲洗好的照片。', // ko: 아직 현상된 사진이 없어요. · en: No developed photos yet.
  'gal.emptyHint': '你的第一卷，从相机开始。', // ko: 첫 롤은 카메라에서 시작돼요. · en: Your first roll starts in the camera.
  'gal.emptyHintLab': '冲洗店里有 {n} 卷正在冲洗。', // ko: 현상소에서 {n}롤이 현상 중이에요. · en: {n, plural, one {# roll is} other {# rolls are}} developing in the lab.
  'gal.openLab': '前往冲洗店', // ko: 현상소 보기 · en: Open the lab
  'gal.import': '导入照片', // ko: 사진 불러오기 · en: Import photos
  'gal.restore': '恢复旧手机的备份', // ko: 이전 폰 백업 불러오기 · en: Restore a backup
  'gal.importing': '正在冲洗… {n}/{total}', // ko: 현상 중… {n}/{total} · en: Developing… {n}/{total}
  'gal.imported': '导入的照片', // ko: 불러온 사진 · en: Imported
  'gal.new': '新', // ko: 새 롤 · en: NEW
  'gal.frames': '{n}\u00A0张', // ko: {n}장 · en: {n, plural, one {# frame} other {# frames}}
  'gal.contact': '接触印样', // ko: 밀착 인화 · en: Contact sheet
  'gal.deleteRoll': '删除胶卷', // ko: 롤 삭제 · en: Delete roll
  'gal.deleteRollConfirm': '这一卷的 {n} 张照片将全部删除。删除后几秒内仍可撤销。', // ko: 이 롤의 사진 {n}장이 모두 삭제돼요. 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: All {n, plural, one {# photo} other {# photos}} in this roll will be deleted. You can undo it for a few seconds afterwards.
  'gal.developing': '冲洗中', // ko: 현상 중 · en: Developing
  'view.share': '分享', // ko: 공유 · en: Share
  'view.saveImage': '保存', // ko: 저장 · en: Save
  'view.darkroom': '暗房', // ko: 다크룸 · en: Darkroom
  'view.info': '信息', // ko: 정보 · en: Info
  'view.deleteConfirm': '删除这张照片？原图也会一并删除。', // ko: 이 사진을 삭제할까요? 원본도 함께 삭제돼요. · en: Delete this photo? The original is deleted too.
  'view.developing': '冲洗中…', // ko: 현상 중… · en: Developing…
  'view.taken': '拍摄时间', // ko: 촬영 · en: Taken
  'view.film': '胶卷', // ko: 필름 · en: Film
  'view.frame': '编号', // ko: 컷 · en: Frame
  'view.size': '尺寸', // ko: 크기 · en: Size
  'dr.title': '暗房', // ko: 다크룸 · en: Darkroom
  'dr.film': '胶卷', // ko: 필름 · en: Film
  'dr.push': '迫冲／拉冲', // ko: 증감현상 (대비·입자) · en: Push / pull (contrast & grain)
  'dr.push.hint': '+ 反差、颗粒更强 / − 更柔和', // ko: + 대비·입자↑ / − 부드럽게 · en: + contrast & grain / − softer
  'dr.stops': '{v} 档', // ko: {v} 스톱 · en: {v} {n, plural, one {stop} other {stops}} [+ counts: n]
  'dr.normal': '正常', // ko: 노멀 · en: Normal
  'dr.redevelop': '重新冲洗', // ko: 다시 현상 · en: Re-develop
  'dr.expired': '过期胶卷质感', // ko: 오래된 필름 느낌 (만료) · en: Aged film look (expired)
  'dr.grain': '颗粒', // ko: 입자 · en: Grain
  'dr.halation': '光晕', // ko: 빛 번짐 (할레이션) · en: Glow (halation)
  'dr.leak': '漏光', // ko: 빛샘 · en: Light leak
  'dr.leak.reroll': '换一种漏光', // ko: 다른 빛샘 · en: Another leak
  'dr.flash': '闪光效果', // ko: 플래시 룩 · en: Flash look
  'dr.date': '日期印记', // ko: 날짜 각인 · en: Date stamp
  'dr.border': '边框', // ko: 테두리 · en: Border
  'dr.border.none': '无', // ko: 없음 · en: None
  'dr.border.film35': '35mm', // ko: 35mm · en: 35mm
  'dr.border.instant': '即时成像', // ko: 인스턴트 · en: Instant
  'dr.border.print': '白边', // ko: 인화지 · en: Print
  'dr.border.slide': '反转片', // ko: 슬라이드 · en: Slide
  'dr.border.gate': '电影', // ko: 시네 · en: Cine
  'dr.border.sprocket': '齿孔', // ko: 스프로킷 · en: Sprocket
  'dr.compare': '按住查看原图', // ko: 길게 눌러 원본 보기 · en: Hold to see the original
  'dr.reset': '重置', // ko: 초기화 · en: Reset
  'dr.saved': '已重新冲洗', // ko: 다시 현상했어요 · en: Re-developed
  'dr.applyRoll': '应用到整卷', // ko: 롤 전체에 적용 · en: Apply to roll
  'dr.rotate': '旋转', // ko: 회전 · en: Rotate
  'dr.ev': '曝光补偿', // ko: 노출 보정 · en: Exposure
  'dr.palette': '色板', // ko: 팔레트 · en: Palette
  'dr.camera': '相机', // ko: 카메라 · en: Camera
  'hint.ios': '将 Film Camela 添加到主屏幕，照片能保存得更安全（“共享”→“添加到主屏幕”）。', // ko: 홈 화면에 추가하면 사진을 더 안전하게 지킬 수 있어요. (공유 → 홈 화면에 추가) · en: Add Film Camela to your Home Screen to keep photos safe (Share → Add to Home Screen).
  'dr.applyRollDone': '已应用到整卷', // ko: 롤 전체에 적용했어요 · en: Applied to the whole roll
  'dr.applyRollUndone': '已恢复这一卷原来的设置', // ko: 롤 전체 적용을 되돌렸어요 · en: Roll settings restored
  'dr.discardConfirm': '放弃更改？', // ko: 변경 사항을 버릴까요? · en: Discard changes?
  'dr.discard': '放弃', // ko: 버리기 · en: Discard
  'dr.saveNew': '存为新照片', // ko: 새 사진으로 저장 · en: Save as new photo
  'dr.savedNew': '已存为新照片（第 {n} 张）', // ko: 새 사진으로 저장했어요 ({n}번) · en: Saved as a new photo (#{n})
  'dr.tone': '数码风格', // ko: 디지털 룩 · en: Digital look
  'dr.look': '风格', // ko: 룩 · en: Look
  'dr.tone.none': '默认', // ko: 기본 · en: Default
  'dr.tone.cool': '冷调', // ko: 쿨 · en: Cool
  'dr.tone.warm': '暖调', // ko: 웜 · en: Warm
  'dr.tone.washed': '褪色', // ko: 바랜 · en: Washed
  'dr.tone.night': '夜景', // ko: 야간 · en: Night
  'view.noDate': '无日期信息', // ko: 날짜 정보 없음 · en: No date info
  'roll.select': '选择', // ko: 선택 · en: Select
  'roll.selectHint': '轻点照片进行选择', // ko: 사진을 눌러 선택하세요 · en: Tap photos to select them
  'roll.selectedN': '已选 {n} 张', // ko: {n}장 선택됨 · en: {n} selected
  'roll.shareN': '分享 {n} 张', // ko: 공유 {n}장 · en: Share {n}
  'roll.saveN': '保存 {n} 张', // ko: 저장 {n}장 · en: Save {n}
  'roll.selectPhoto': '选择第 {n} 张照片', // ko: 사진 {n} 선택 · en: Select photo {n}
  'roll.ready': '{n} 张照片已准备好', // ko: 사진 {n}장이 준비됐어요 · en: {n, plural, one {# photo} other {# photos}} ready
  'an.title': '胶片机', // ko: 아날로그 · en: Analog
  'an.subtitle': '为你手中的胶片相机准备的工具', // ko: 실제 필름 카메라를 위한 도구 · en: Tools for your real film camera
  'an.meter': 'Sunny 16 曝光计算器', // ko: Sunny 16 노출 계산기 · en: Sunny 16 exposure calculator
  'an.iso': 'ISO', // ko: ISO · en: ISO
  'an.light': '光线', // ko: 빛 · en: Light
  'an.aperture': '光圈', // ko: 조리개 · en: Aperture
  'an.shutter': '快门速度', // ko: 셔터 속도 · en: Shutter speed
  'an.comp': '曝光补偿', // ko: 노출 보정 · en: Compensation
  'an.tripod': '建议使用三脚架', // ko: 삼각대를 권장해요 · en: Use a tripod
  'an.outOfRange': '超出快门范围。试试换个光圈或 ISO。', // ko: 셔터 범위를 벗어났어요. 조리개나 ISO를 바꿔보세요. · en: Outside the shutter range. Try another aperture or ISO.
  'an.light.snow': '晴天的雪地或海滩', // ko: 맑은 날 눈밭·해변 · en: Snow / sand, sunny
  'an.light.sunny': '晴天（阴影清晰）', // ko: 맑음 (선명한 그림자) · en: Sunny (sharp shadows)
  'an.light.slightOvercast': '多云', // ko: 약간 흐림 · en: Slightly overcast
  'an.light.overcast': '阴天', // ko: 흐림 · en: Overcast
  'an.light.heavyOvercast': '阴云密布', // ko: 매우 흐림 · en: Heavy overcast
  'an.light.shade': '背阴处', // ko: 그늘 · en: Open shade
  'an.light.sunset': '日落前', // ko: 일몰 직전 · en: Just before sunset
  'an.light.indoorBright': '明亮的室内', // ko: 밝은 실내 · en: Bright interior
  'an.light.indoor': '室内', // ko: 실내 · en: Interior
  'an.light.night': '夜晚街头', // ko: 밤거리 · en: Night street
  'an.log': '胶片拍摄记录', // ko: 필름 촬영 노트 · en: Film shooting log
  'an.log.empty': '还没有正在记录的胶卷。', // ko: 아직 기록 중인 롤이 없어요. · en: No logged rolls yet.
  'an.log.new': '记录新胶卷', // ko: 새 롤 기록 · en: Log a new roll
  'an.log.camera': '相机', // ko: 카메라 · en: Camera
  'an.log.film': '胶卷', // ko: 필름 · en: Film
  'an.log.exposures': '张数', // ko: 장수 · en: Exposures
  'an.log.note': '备注', // ko: 메모 · en: Note
  'an.log.addFrame': '记录一张', // ko: 컷 기록 · en: Log frame
  'an.log.lens': '镜头', // ko: 렌즈 · en: Lens
  'an.log.export': '导出 CSV', // ko: CSV 내보내기 · en: Export CSV
  'an.log.deleteRoll': '删除记录', // ko: 기록 삭제 · en: Delete log
  'an.log.deleteConfirm': '删除这一卷的记录？', // ko: 이 롤 기록을 삭제할까요? · en: Delete this roll log?
  'an.log.useMeter': '使用计算器数值', // ko: 계산기 값 사용 · en: Use calculator values
  'an.log.frames': '{n}/{m}\u00A0张', // ko: {n}/{m}장 · en: {n}/{m} frames
  'an.log.location': '同时保存位置', // ko: 위치 함께 저장 · en: Save location
  'an.active': '正在记录的胶卷', // ko: 지금 기록 중인 롤 · en: Roll in progress
  'an.active.go': '记录一张', // ko: 컷 기록하기 · en: Log a frame
  'an.log.repeat': '相同设置 +1 张', // ko: 같은 설정으로 +1컷 · en: Same settings +1
  'an.log.otherSettings': '其他设置', // ko: 다른 설정 · en: New settings
  'an.log.frameN': '记录第 {n} 张', // ko: {n}번 컷 기록 · en: Log frame {n}
  'an.log.editFrame': '修改第 {n} 张', // ko: {n}번 컷 고치기 · en: Edit frame {n}
  'an.log.saveFrame': '记录这一张', // ko: 이 컷 기록 · en: Log this frame
  'an.log.saveEdit': '保存修改', // ko: 고친 내용 저장 · en: Save changes
  'an.log.manual': '手动输入', // ko: 직접 입력 · en: Type it in
  'an.log.pickStops': '从刻度中选择', // ko: 눈금에서 고르기 · en: Pick from the dial
  'an.log.logged': '已记录第 {n} 张', // ko: {n}번 컷을 기록했어요 · en: Frame {n} logged
  'an.log.deleted': '已删除第 {n} 张的记录', // ko: {n}번 컷 기록을 지웠어요 · en: Frame {n} log deleted
  'an.log.undo': '撤销', // ko: 되돌리기 · en: Undo
  'an.log.undoFailed': '这期间同一编号已有新记录，无法撤销', // ko: 그 사이 같은 번호가 기록돼서 되돌리지 못했어요 · en: Couldn't undo: that frame number is taken now
  'an.log.full': '这一卷的每一张都记录好了', // ko: 이 롤의 컷을 모두 기록했어요 · en: Every frame on this roll is logged
  'an.log.firstHint': '每拍一张，就在这里记一笔。轻点某一行，随时可以修改。', // ko: 한 컷 찍을 때마다 여기에 남겨 두세요. 줄을 누르면 언제든 고칠 수 있어요. · en: Log each frame here as you shoot. Tap a row any time to edit it.
  'set.title': '设置', // ko: 설정 · en: Settings
  'set.lang': '语言', // ko: 언어 · en: Language
  'set.lang.auto': '跟随系统', // ko: 시스템 · en: System
  'set.sound': '快门声', // ko: 셔터 소리 · en: Shutter sound
  'set.haptics': '触感反馈', // ko: 진동 · en: Haptics
  'set.dateStamp': '在照片上加日期', // ko: 사진에 날짜 넣기 · en: Add the date to photos
  'set.dateFormat': '日期格式', // ko: 날짜 형식 · en: Date format
  'set.grid': '显示网格', // ko: 격자 표시 · en: Show grid
  'set.mirror': '前置镜头照片镜像保存', // ko: 전면 카메라 좌우 반전 저장 · en: Mirror front camera photos
  'set.rollSize': '默认胶卷张数', // ko: 기본 롤 장수 · en: Default roll size
  'set.speed': '默认冲洗速度', // ko: 기본 현상 속도 · en: Default lab speed
  'set.speed.hint': '送胶卷去冲洗时，这个速度会标为“默认”。即时成像相机和数码相机不经过冲洗店，照片直接进入相册。', // ko: 필름 롤을 현상소로 보낼 때 ‘기본’으로 표시돼요. 인스턴트·디카 사진은 현상소 없이 바로 앨범에 들어가요. · en: Marked as default when you send a film roll to the lab. Instant and digital cameras skip the lab: their photos go straight to the album.
  'set.storage': '储存空间', // ko: 저장 공간 · en: Storage
  'set.storage.used': '已使用 {used}', // ko: {used} 사용 중 · en: {used} used
  'set.storage.persist': '防止照片被清除', // ko: 사진 지워지지 않게 보호 · en: Keep photos from being cleared
  'set.storage.persistHint': '请求浏览器在设备储存空间不足时，也不要自动清除本 App 的照片。', // ko: 기기 저장 공간이 부족해져도 브라우저가 이 앱의 사진을 자동으로 지우지 않도록 요청해요. · en: Asks the browser not to clear this app’s photos automatically when the device runs low on space.
  'set.storage.persistAsk': '打开保护', // ko: 보호 켜기 · en: Turn on
  'set.storage.persisted': '已保护', // ko: 보호됨 · en: Protected
  'set.storage.refusedShort': '未获允许', // ko: 허락 안 됨 · en: Not allowed
  'set.storage.refused': '此浏览器未允许保护。将 Film Camela 添加到主屏幕，照片能保存得更久。也别忘了备份。', // ko: 이 브라우저가 보호를 허락하지 않았어요. 홈 화면에 추가하면 더 오래 보관돼요. 백업도 함께 해 두세요. · en: This browser declined. Adding Film Camela to your Home Screen keeps photos longer. Keep a backup too.
  'set.install': '安装到主屏幕', // ko: 홈 화면에 앱 설치 · en: Install app to home screen
  'set.privacy': '隐私政策', // ko: 개인정보 처리방침 · en: Privacy policy
  'set.terms': '使用条款', // ko: 이용약관 · en: Terms of use
  'set.support': '支持与联系', // ko: 고객지원 · 문의 · en: Support & contact
  'set.licenses': '开源许可', // ko: 오픈소스 라이선스 · en: Open-source licenses
  'set.backup': '备份', // ko: 백업 · en: Backup
  'set.backup.hint': '照片和记录只保存在这台设备上。换手机或清除浏览器数据前，记得先存一份备份文件（.zip）。', // ko: 사진과 기록은 이 기기에만 머물러요. 폰을 바꾸거나 브라우저 데이터를 지우기 전에 백업 파일(.zip)로 챙겨 두세요. · en: Your photos and logs live only on this device. Before you switch phones or clear browser data, save a backup file (.zip) somewhere safe.
  'set.backup.export': '保存备份文件（.zip）', // ko: 백업 파일 저장 (.zip) · en: Save backup file (.zip)
  'set.backup.saveAgain': '再存一份', // ko: 한 번 더 저장 · en: Save another copy
  'set.backup.send': '发送到其他 App', // ko: 카카오톡·드라이브로 보내기 · en: Send to KakaoTalk or Drive
  'set.backup.savedWeb': '已保存到“下载”文件夹 · {name}', // ko: 다운로드 폴더에 저장했어요 · {name} · en: Saved to your Downloads folder · {name}
  'set.backup.savedShared': '已保存到你在分享面板中选择的位置（文件、网盘等）· {name}', // ko: 공유 창에서 고른 곳(파일·드라이브 등)에 저장했어요 · {name} · en: Saved where you picked in the share sheet (Files, Drive…) · {name}
  'set.backup.restoreHint': '换新手机时，先用聊天 App、邮件或网盘把这个文件发给自己，再在新手机上打开 Film Camela，进入“设置”，轻点“从备份恢复”。', // ko: 새 폰으로 옮기려면 이 파일을 카카오톡 ‘나와의 채팅’이나 드라이브로 보낸 뒤, 새 폰의 Film Camela 설정에서 ‘백업에서 복원’을 눌러 열어요. · en: To move to a new phone, send this file to yourself (KakaoTalk, Drive or email), then open it there with Restore from backup in Film Camela Settings.
  'set.credit': '© 2026 ATIUM GROUP Co., Ltd.', // ko: © 2026 아티움그룹 주식회사 (ATIUM GROUP Co., Ltd.) · en: © 2026 ATIUM GROUP Co., Ltd.
  'set.backup.import': '从备份恢复', // ko: 백업에서 복원 · en: Restore from backup
  'set.backup.working': '正在备份… {done}/{total}', // ko: 백업 중… {done}/{total} · en: Backing up… {done}/{total}
  'set.backup.restoring': '正在恢复…', // ko: 복원 중… · en: Restoring…
  'set.backup.done': '备份已就绪 · {rolls} 卷胶卷、{photos} 张照片', // ko: 백업 준비 완료 · 롤 {rolls}개, 사진 {photos}장 · en: Backup ready · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}}
  'set.backup.save': '已就绪 · 保存', // ko: 준비 완료 · 저장하기 · en: Ready · Save it
  'set.backup.saved': '备份文件已保存', // ko: 백업 파일을 저장했어요 · en: Backup file saved
  'set.backup.saveFailed': '没能保存，请再轻点一次', // ko: 저장하지 못했어요. 다시 눌러 주세요 · en: Couldn't save it. Tap again
  'set.backup.tooLarge': '超过 4 GB，无法存成一个文件。请先清理一些旧胶卷，再重试', // ko: 4GB가 넘어 파일 하나에 담을 수 없어요. 오래된 롤을 정리한 뒤 다시 시도해 주세요 · en: Over 4 GB, too large for one file. Clear out some old rolls and try again
  'set.backup.newer': '这份备份来自更新版本的 App，请先更新 App', // ko: 더 새로운 버전의 앱에서 만든 백업이에요. 앱을 업데이트해 주세요 · en: This backup is from a newer version of the app. Please update
  'set.backup.partial': '恢复了 {rolls} 卷后已暂停。腾出储存空间后再次恢复，即可接着进行', // ko: 롤 {rolls}개까지 복원하고 멈췄어요. 저장 공간을 확보한 뒤 다시 복원하면 이어서 진행돼요 · en: Stopped after restoring {rolls, plural, one {# roll} other {# rolls}}. Free up storage and restore again to continue
  'set.backup.empty': '还没有可以备份的照片或记录', // ko: 아직 백업할 사진이나 기록이 없어요 · en: Nothing to back up yet
  'set.backup.restored': '恢复完成 · 新增 {rolls} 卷胶卷、{photos} 张照片', // ko: 복원 완료 · 롤 {rolls}개, 사진 {photos}장 추가 · en: Restored · {rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}} added
  'set.backup.skipped': '已有的 {n} 个项目保持不变', // ko: 이미 있는 항목 {n}개는 그대로 두었어요 · en: Skipped {n, plural, one {# item} other {# items}} you already have
  'set.backup.damaged': '已跳过 {n} 个损坏的项目', // ko: 손상된 항목 {n}개는 건너뛰었어요 · en: Skipped {n} damaged {n, plural, one {item} other {items}}
  'set.backup.invalid': '这不是 Film Camela 备份文件，或者文件已损坏', // ko: Film Camela 백업 파일이 아니거나 손상된 파일이에요 · en: Not a Film Camela backup, or the file is damaged
  'set.backup.failed': '没能创建备份，请检查储存空间', // ko: 백업을 만들지 못했어요. 저장 공간을 확인해 주세요 · en: Couldn't create the backup. Check free storage
  'set.reset': '删除所有数据', // ko: 모든 데이터 삭제 · en: Delete all data
  'set.resetConfirm': '所有胶卷、照片、记录和设置都将被删除，且无法恢复。请先用上方的“保存备份文件”备份一份。仍要删除吗？', // ko: 모든 롤, 사진, 기록, 설정이 삭제되고 되돌릴 수 없어요. 먼저 위의 ‘백업 파일 저장’으로 백업해 두세요. 그래도 삭제할까요? · en: All rolls, photos, logs and settings will be deleted, and this cannot be undone. Save a backup file first (above). Delete anyway?
  'set.version': '版本', // ko: 버전 · en: Version
  'set.replayOnb': '重新查看介绍', // ko: 소개 다시 보기 · en: Replay intro
  'share.title': '用 Film Camela 拍摄', // ko: Film Camela로 촬영 · en: Shot on Film Camela
  'err.storage': '储存空间不足。请删除几张照片后重试。', // ko: 저장 공간이 부족해요. 사진 몇 장을 지우고 다시 시도해 주세요. · en: Storage is full. Delete a few photos and try again.
  'common.notFound': '找不到内容，可能已被删除。', // ko: 찾을 수 없어요. 삭제되었을 수 있어요. · en: Couldn't find this. It may have been deleted.
  'an.log.noLocation': '未能获取位置，已保存（不含位置）', // ko: 위치를 확인하지 못해 위치 없이 저장했어요 · en: Couldn’t get your location, so it was saved without one
  'err.storagePermission': '储存权限已关闭。请在“设置 > 应用 > Film Camela > 权限”中允许访问储存空间。', // ko: 저장 권한이 꺼져 있어요. 설정 > 앱 > Film Camela > 권한에서 저장공간을 허용해 주세요. · en: Storage permission is off. Allow it in Settings > Apps > Film Camela > Permissions.
  'err.noStorage': '当前的浏览器设置不允许保存照片。请关闭无痕浏览，或允许网站储存数据，然后重新打开 App。', // ko: 이 브라우저 설정에서는 사진을 저장할 수 없어요. 사생활 보호(시크릿) 모드를 끄거나 사이트 데이터 저장을 허용해 주세요. · en: This browser won't let Film Camela save photos. Turn off private browsing or allow site data, then reopen the app.
  'err.import': '无法导入这个文件。', // ko: 이 파일은 불러올 수 없어요. · en: This file could not be imported.
  'update.ready': '新版本已就绪', // ko: 새 버전이 준비됐어요 · en: A new version is ready
  'update.reload': '重新载入', // ko: 새로고침 · en: Reload
  'offline.ready': '现在离线也能使用', // ko: 오프라인에서도 사용할 수 있어요 · en: Ready to work offline
  'a11y.cameraTitle': '相机', // ko: 카메라 · en: Camera
  'a11y.rollLoaded': '已装入 {stock} · {n} 张', // ko: {stock} · {n}장 넣었어요 · en: {stock} loaded · {n, plural, one {# shot} other {# shots}}
  'a11y.sentToLab': '已送去冲洗 · {wait}后送达', // ko: 현상소로 보냈어요 · {wait} 뒤 도착 · en: Sent to the lab · ready in {wait}
  'a11y.cameraKeys': '用 ← → 键选择相机，按 Tab 键前往置顶按钮', // ko: ← → 키로 카메라를 고르고, Tab으로 고정 버튼으로 가요 · en: Use the arrow keys to choose a camera; Tab reaches its pin button
  'cam.timerSay': '{n} 秒后拍摄 · 再按一次快门可取消', // ko: {n}초 뒤 촬영 · 셔터를 다시 누르면 취소 · en: Taking the photo in {n} seconds · press the shutter again to cancel
  'cam.timerCancelled': '已取消定时', // ko: 타이머를 취소했어요 · en: Timer cancelled
  'cam.tapToCancel': '轻点取消', // ko: 탭하면 취소 · en: Tap to cancel
  'cam.cancelTimer': '取消定时', // ko: 타이머 취소 · en: Cancel timer
  'cam.doubleHint': '按两次，叠成一张', // ko: 두 번 눌러 한 장에 겹쳐요 · en: Two presses, one frame
  'cam.double2': '再按一次，叠在第一个画面上', // ko: 한 번 더 누르면 첫 장면 위에 겹쳐 찍혀요 · en: Press again to expose over the first shot
  'cam.pressBusy': '正在保存前面的照片', // ko: 앞 사진을 저장하는 중이에요 · en: Still saving the previous shots
  'cam.pressFull': '没有剩余张数了', // ko: 남은 컷이 없어요 · en: No frames left
  'cam.startingQueued': '相机准备好后立即拍摄', // ko: 카메라가 준비되면 바로 찍어요 · en: Taking the photo as soon as the camera is ready
  'cam.switchConfirmFilm2': '换相机后，这一卷会送去冲洗。已拍的 {shots}会冲洗出来，剩下的 {left}不再使用。', // ko: 카메라를 바꾸면 지금 롤은 현상소로 가요. 찍은 {shots}은 현상하고, 남은 {left}은 쓰지 않아요. · en: Switching sends this roll to the lab. The {shots} you took {n, plural, one {gets} other {get}} developed; the {left} left {m, plural, one {stays} other {stay}} unused. [+ counts: n, m]
  'cam.switchConfirmPack2': '换相机会取出这盒相纸。已拍的 {shots}会放进相册，剩下的 {left}不再使用。', // ko: 카메라를 바꾸면 지금 팩을 꺼내요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching takes this pack out. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  'cam.switchConfirmCard2': '换相机会取出这张存储卡。已拍的 {shots}会放进相册，剩下的 {left}不再使用。', // ko: 카메라를 바꾸면 지금 카드를 정리해요. 찍은 {shots}은 앨범으로, 남은 {left}은 쓰지 않아요. · en: Switching finishes this card. The {shots} you took {n, plural, one {goes} other {go}} to the album; the {left} left won't be used. [+ counts: n, m]
  'common.undo': '撤销', // ko: 되돌리기 · en: Undo
  'view.deleteUndoConfirm': '删除后几秒内仍可撤销。', // ko: 삭제한 뒤 잠시 동안 되돌릴 수 있어요. · en: You can undo it for a few seconds afterwards.
  'view.deleted': '照片已删除', // ko: 사진을 삭제했어요 · en: Photo deleted
  'view.restored': '照片已恢复', // ko: 사진을 되돌렸어요 · en: Photo restored
  'view.deleteTitle': '删除这张照片？', // ko: 사진을 삭제할까요? · en: Delete this photo?
  'view.savedWeb': '已保存到“下载”文件夹', // ko: 다운로드 폴더에 저장했어요 · en: Saved to your Downloads folder
  'view.savedAndroid': '已保存到图库的“Film Camela”相册', // ko: 갤러리 › Film Camela 앨범에 저장했어요 · en: Saved to Gallery › Film Camela album
  'gal.deleteRollTitle': '删除这卷胶卷？', // ko: 이 롤을 삭제할까요? · en: Delete this roll?
  'gal.rollDeleted': '胶卷已删除', // ko: 롤을 삭제했어요 · en: Roll deleted
  'gal.rollRestored': '胶卷已恢复', // ko: 롤을 되돌렸어요 · en: Roll restored
  'gal.rollRestoreBlocked': '相机里已经装着另一卷胶卷，无法恢复', // ko: 카메라에 다른 롤이 들어 있어서 되돌릴 수 없어요 · en: Can't restore it: another roll is in the camera now
  'gal.framesHalf': '{f} 格（{n} 张）', // ko: {f}프레임 ({n}컷) · en: {f, plural, one {# frame} other {# frames}} ({n, plural, one {# shot} other {# shots}})
  'gal.help': '帮助', // ko: 도움말 · en: Help
  'lab.rushTitle': '现在就冲洗吗？', // ko: 지금 바로 현상할까요? · en: Develop now?
  'view.pushNormal': '正常', // ko: 노멀 · en: Normal
  'view.expiredNone': '新胶卷', // ko: 새 필름 · en: Fresh film
  'view.expiredYears': '过期 {n} 年', // ko: {n}년 지난 필름 · en: Expired {n, plural, one {# year} other {# years}}
  'dur.days': '{n} 天', // ko: {n}일 · en: {n}d
  'dur.hours': '{n} 小时', // ko: {n}시간 · en: {n}h
  'dur.minutes': '{n} 分', // ko: {n}분 · en: {n}m
  'dur.seconds': '{n} 秒', // ko: {n}초 · en: {n}s
  'dur.pair': '{a} {b}', // ko: {a} {b} · en: {a} {b}
  'wait.days': '{n} 天', // ko: {n}일 · en: {n} d
  'wait.hours': '{n} 小时', // ko: {n}시간 · en: {n} h
  'wait.minutes': '{n} 分钟', // ko: {n}분 · en: {n} min
};

export const cameraText: LocaleCameraText = {
  /** Camera body descriptions (expressive register, guide §1.1). */
  desc: {
    pro35: '可靠的 35mm 单反。兼容所有 35mm 胶卷，3\u00A0种画幅，还有变焦和曝光补偿。', // ko: 믿음직한 35mm SLR. 모든 35mm 필름과 3가지 비율, 줌, 노출 보정까지. · en: A dependable 35mm SLR. Every 35mm film, three formats, zoom, and an exposure dial.
    snap27: '27\u00A0张的一次性相机。微微朦胧的塑料镜头，每拍一张都要给闪光灯充电。', // ko: 27장짜리 일회용 카메라. 살짝 뭉개지는 렌즈, 한 장마다 충전하는 플래시. · en: A 27-shot disposable. A soft plastic lens and a flash you charge before every shot.
    instasq: '方画幅即时成像相机，10\u00A0张装相纸。按下快门，照片随即吐出，影像慢慢浮现。', // ko: 정사각 인스턴트, 10장 팩. 찍자마자 사진이 나오고, 천천히 상이 떠올라요. · en: A square instant camera with 10-shot packs. Each print slides out and slowly comes to life.
    half72: '在一格 35mm 里并排拍下两张的半格相机。一卷 72\u00A0张，留下双倍的瞬间。', // ko: 35mm 한 컷에 두 장을 나란히 담는 하프프레임. 한 롤에 72장, 두 배의 순간. · en: Two shots side by side in every frame. 72 half-frames, twice the moments.
    zonelc: '隧道般的暗角，浓郁的色彩。适合漫步街巷的便携机。', // ko: 터널 같은 비네팅과 진한 색. 골목을 걷는 날을 위한 컴팩트. · en: Tunnel vignetting and saturated color. A compact made for wandering the streets.
    toy120: '塑料镜头的中画幅玩具相机。边缘柔和，暗角浓重，时常漏光。', // ko: 플라스틱 렌즈의 중판 토이 카메라. 흐릿한 가장자리, 짙은 비네팅, 자주 스미는 빛샘. · en: A plastic-lens medium-format toy. Soft edges, deep vignetting, and frequent light leaks.
    quad4: '4\u00A0个镜头每隔 0.2\u00A0秒依次拍摄。一张照片，留住四个动作瞬间。', // ko: 렌즈 4개가 0.2초 간격으로 차례차례. 한 장에 담기는 네 번의 움직임. · en: Four lenses fire 0.2 s apart. Four moments of motion in one frame.
    doublex: '一格，两次曝光。第二个画面轻轻叠在第一个之上。', // ko: 한 컷에 두 번의 노출. 첫 장면 위로 두 번째 장면이 포개져요. · en: Two exposures, one frame. A second scene settles over the first.
    panox: '65:24\u00A0的宽幅全景，视野一览无余。一卷 21\u00A0张。', // ko: 65:24의 넓은 파노라마. 시야 가득, 한 롤에 21장. · en: Sweeping 65:24 panoramas. 21 frames per roll.
    fish180: '180° 圆形鱼眼。把世界装进一个圆。', // ko: 180° 원형 어안. 세상을 동그랗게 담아요. · en: A 180° circular fisheye. The whole world in a circle.
    cine: '2.39:1\u00A0变形宽银幕。一道蓝色光斑，横贯明亮的光源。', // ko: 2.39:1 시네마스코프. 밝은 빛을 가로지르는 푸른 플레어. · en: 2.39:1 anamorphic widescreen. Blue streaks of flare across bright lights.
    ccd03: '来自 2003\u00A0年的数码卡片机。99\u00A0张存储卡，数码日期，拍完即看。', // ko: 2003년 그 시절의 디카. 99장 메모리, 디지털 날짜, 찍고 바로 확인. · en: A digicam straight from 2003. 99-shot card, digital date imprint, instant review.
    pixel: '128×112\u00A0像素的口袋相机。用 4\u00A0色色板拍下 30\u00A0张。', // ko: 128×112 픽셀의 포켓 카메라. 4색 팔레트에 담는 30장. · en: A 128×112 pocket pixel camera. 30 shots in four-color palettes.
    range: '安静的旁轴相机。锐利的镜头，明亮的取景框线，默认黑白。', // ko: 조용한 레인지파인더. 선명한 렌즈, 밝은 프레임 라인, 기본은 흑백. · en: A quiet rangefinder. Crisp lens, bright frame lines, black and white by default.
    aqua27: '穿上防水壳的 27\u00A0张一次性相机。水一般的青绿色调，柔和的镜头，每拍一张都要给闪光灯充电。', // ko: 방수 하우징을 입은 27장 일회용. 물빛 청록 톤, 부드러운 렌즈, 한 장마다 충전하는 플래시. · en: A 27-shot disposable in a waterproof housing. Blue-green water tones, a soft lens, a flash you charge every shot.
    instaw: '横向宽幅的即时成像相机，10\u00A0张装相纸。宽幅照片上，影像慢慢浮现。', // ko: 가로로 넓은 와이드 인스턴트, 10장 팩. 넓게 나온 사진에 천천히 상이 떠올라요. · en: A wide-format instant camera with 10-shot packs. Landscape prints slide out and slowly come to life.
    twin66: '低头俯看取景的双反相机。12\u00A0张 6×6\u00A0方画幅，取景器里的世界左右颠倒。', // ko: 고개 숙여 내려다보는 이안 리플렉스. 6×6 정사각 12장, 파인더 속 세상은 좌우가 뒤바뀌어요. · en: A twin-lens reflex you look down into. 12 square 6×6 frames through a mirror-reversed finder.
    super8: '从 8mm 家庭电影里截下的一帧。圆角片窗，温暖的色彩，粗粝的颗粒。', // ko: 8mm 홈무비에서 꺼낸 한 프레임. 둥근 게이트, 따뜻한 색, 굵은 입자. · en: A single frame from an 8mm home movie. Rounded gate, warm color, heavy grain.
    slide35: '反转片专用便携机。鲜亮的色彩，装进白色幻灯片框交到你手中。', // ko: 슬라이드 필름 전용 컴팩트. 쨍한 색을 하얀 마운트에 담아 돌려줘요. · en: A compact made for slide film. Vivid color, returned in white slide mounts.
    party: '大号闪光灯默认开启的派对便携机。强烈的正面闪光，再加上日期印记。', // ko: 큼직한 플래시가 기본으로 켜지는 파티용 컴팩트. 정면으로 터지는 강한 플래시와 날짜 각인. · en: A party compact whose big flash is on by default. Hard, direct flash and a date imprint.
    kidcam: '30\u00A0万像素的儿童数码相机。640\u00A0像素的画面，浓烈到溢出的色彩，数码日期，拍完即看。', // ko: 0.3메가 어린이 디카. 640픽셀, 넘치는 채도, 디지털 날짜, 찍고 바로 확인. · en: A 0.3 MP kids’ camera. 640 px, colors turned all the way up, digital date, instant review.
    sprocket: '连齿孔一起拍下的全景相机。照片上下边缘，留着胶片的齿孔。', // ko: 필름 구멍까지 담기는 파노라마. 사진 위아래로 퍼포레이션이 그대로 남아요. · en: A panorama that runs right over the sprocket holes, so the perforations frame every shot.
  },
  /** Type word in the era line "1979 · SLR" (guide §3.3). The year and " · " are added by the app. */
  era: {
    SLR: '单反',
    Disposable: '一次性',
    Instant: '即时成像',
    'Half-frame': '半格',
    Compact: '便携机',
    '120 toy': '120 玩具相机',
    '4-lens': '四镜头',
    'Multi-ex': '多重曝光',
    Panoramic: '全景',
    Fisheye: '鱼眼',
    Anamorphic: '变形宽银幕',
    Digicam: '数码卡片机',
    '2-bit': '2-bit',
    Rangefinder: '旁轴',
    Waterproof: '防水',
    Wide: '宽幅',
    TLR: '双反',
    'Home movie': '家庭电影',
    Slide: '反转片',
    'Big flash': '大闪光灯',
    'Kids digicam': '儿童数码相机',
    Sprocket: '齿孔',
  },
};

/** Film stock / sensor descriptions (expressive register). Film names stay in Latin letters. */
export const stockText: LocaleStockText = {
  sunny200: '饱含阳光的暖黄。旅行和日常随拍的经典之选。', // ko: 햇살을 머금은 따뜻한 노랑. 여행과 일상 스냅의 정석. · en: Warm yellows full of sunshine. The classic film for travel and everyday snapshots.
  muse400: '柔和的肤色，粉彩般的高光。最适合拍人的人像胶卷。', // ko: 부드러운 피부톤, 파스텔빛 하이라이트. 사람을 담기 좋은 인물용 필름. · en: Gentle skin tones and pastel highlights. Made for portraits.
  mint400: '阴影里透出一丝绿意。把城市街头的空气装进画面。', // ko: 그늘에 살짝 도는 초록빛. 도시와 거리의 공기. · en: A hint of green in the shadows. City air in a frame.
  snap800: '一次性相机，还是当年的味道。闪光灯、浓重的暗角，还有意外的漏光。', // ko: 일회용 카메라, 그때 그 느낌. 플래시, 진한 비네팅, 우연이 만든 빛샘. · en: Straight out of a disposable. Flash, deep vignetting, and leaks by happy accident.
  mono400: '深邃的黑，粗粝的颗粒。如实记录的纪实黑白。', // ko: 깊은 검정과 거친 입자의 흑백. 있는 그대로를 담는 다큐멘터리의 결. · en: Deep blacks and gritty grain. Black and white that tells it straight.
  insta600: '微微褪色的色彩，配上白色边框。即时成像照片握在手里的温度。', // ko: 살짝 바랜 색과 하얀 테두리. 손에 쥐는 즉석 사진의 온기. · en: Softly faded color in a white frame. The warmth of an instant print.
  neon800t: '钨丝灯电影胶片。红色光晕在霓虹灯四周晕开。', // ko: 텅스텐 시네마 필름. 네온 불빛 둘레로 번지는 붉은 할레이션. · en: Tungsten cinema film. Red halation blooms around neon lights.
  velvet50: '鲜艳的饱和度，强烈的反差。为风光而生的反转片。', // ko: 쨍한 채도와 높은 대비의 슬라이드 필름. 풍경을 위한 필름. · en: Rich saturation and bold contrast. A slide film for landscapes.
  chrome100: '清透冷冽的反转片色调。天空澄澈如洗。', // ko: 맑고 차가운 슬라이드 톤. 투명하게 갠 하늘. · en: Clean, cool slide tones. Skies as clear as glass.
  silver100: '颗粒细腻，影调宽广。光影层次丰富而微妙的黑白。', // ko: 고운 입자와 넓은 계조. 빛의 결이 섬세한 흑백. · en: Fine grain and a long tonal range. Black and white in quiet, subtle shades.
  dream160: '低反差，空气般轻盈的粉彩。', // ko: 낮은 대비, 공기처럼 가벼운 파스텔. · en: Low contrast and pastels as light as air.
  expired98: '1998\u00A0年就已过期。洋红色的雾、灰尘，结果如何，冲出来才知道。', // ko: 1998년에 만료된 필름. 마젠타 포그와 먼지, 결과는 현상해 봐야 알아요. · en: Expired in 1998. Magenta fog, dust, and a surprise in every frame.
  xpro200: '反转片按负片（C-41）工艺交叉冲洗。强烈反差，青柠色高光，青绿色阴影。', // ko: 슬라이드 필름을 네거티브(C-41)로 교차현상. 강한 대비, 연둣빛 하이라이트, 청록빛 그림자. · en: Slide film cross-processed as negative (C-41). Hard contrast, lime highlights, teal shadows.
  instamini: '明亮清爽的迷你即时成像相纸。干净的白，带一点冷调。', // ko: 밝고 산뜻한 미니 인스턴트. 깨끗한 화이트와 살짝 차가운 톤. · en: Bright, crisp mini instant film with clean whites and a cool touch.
  ccd: '2000\u00A0年代初数码卡片机的 CCD。高光溢出，色调偏蓝，带着紫边。', // ko: 2000년대 초 디카의 CCD. 날아가는 하이라이트, 푸르스름한 톤, 보랏빛 번짐. · en: The CCD of an early-2000s digicam. Clipped highlights, a blue cast, purple fringing.
  pixel: '128\u00A0像素的 2-bit 传感器。只有 4\u00A0种颜色和抖动点阵。', // ko: 128픽셀 2비트 센서. 단 4가지 색과 디더링. · en: A 128-pixel, 2-bit sensor. Just four colors and dithering.
  aqua400: '水下一次性胶卷。红色褪尽，只剩青绿色调和朦胧的颗粒。', // ko: 물속 일회용 필름. 붉은빛이 바래 사라진 청록 톤, 뿌연 입자. · en: Underwater disposable film. Reds fade into a blue-green haze, with soft grain.
  instawide: '宽幅即时成像相纸。色彩自然，高光微微偏暖。', // ko: 와이드 인스턴트 필름. 자연스러운 색에 살짝 따뜻한 하이라이트. · en: Wide instant film. Natural color with gently warm highlights.
  reel40: '家庭电影反转片。温暖浓郁的色彩，粗大的颗粒，片窗边沾着灰尘。', // ko: 홈무비 리버설 필름. 따뜻하고 진한 색, 굵은 입자, 먼지 앉은 게이트. · en: Home-movie reversal film. Warm, saturated color, big grain, and a dusty gate.
  toycmos: '30\u00A0万像素的玩具传感器。糖果般的色彩，过曝的高光，斑驳的彩色噪点。', // ko: 0.3메가 장난감 센서. 사탕 같은 색, 날아간 하이라이트, 얼룩덜룩한 색 노이즈. · en: A 0.3 MP toy sensor: candy colors, blown highlights, blotchy color noise.
};
