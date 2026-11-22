// Film Camela Android release pipeline: web build → cap sync → gradle (debug APK, release APK, release AAB)
// → verify every artifact (package, version, SDK levels, AdMob app id, permissions, signing key, R8 kept the
// plugins) → copy to _결과물\FilmCamela_안드로이드\<version>\.
//
// usage:
//   node scripts/release-android.mjs            build in place (subst S: → app root) and copy the outputs
//   node scripts/release-android.mjs --dry-run  build in a scratch COPY of the project (other people may be
//                                               editing src/), outputs stay in <work>/out — nothing is copied
//                                               to _결과물. The release key is used in place via FC_KEYSTORE_PROPS.
//   options: --work <dir> (dry-run copy, default %TEMP%\fc-release-dry) · --out <dir> · --no-clean · --verify-only
//
// Never: VITE_ADS_TEST (QA-only web assets that request test ads even when signed), uploads, git push.
// The keystore and its passwords are never printed or copied; only certificate digests are shown.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const DRY = flag('--dry-run');
const VERIFY_ONLY = flag('--verify-only');

// ---------------------------------------------------------------- expectations
const PKG = 'com.filmcamela.app';
const LAUNCH = 'app.silvr.camera.MainActivity';
const LABEL = 'Film Camela';
const ADMOB_APP_ID = 'ca-app-pub-6568578451894077~3582572576'; // REAL app id (manifest, release and debug)
// Google Play (Nov 2026): new apps and updates must target API 36 (Android 16) since 2026-08-31.
const PLAY_MIN_TARGET = 36;
const REQUIRED_PERMS = ['android.permission.INTERNET', 'android.permission.CAMERA', 'com.google.android.gms.permission.AD_ID', 'com.android.vending.BILLING'];
const KEPT_CLASSES = ['com.getcapacitor.community.admob.AdMob', 'ee.forgr.nativepurchases.NativePurchasesPlugin', 'app.silvr.camera.GalleryPlugin', 'app.silvr.camera.MainActivity'];
const RESULTS_ROOT = 'C:\\Users\\cole0\\Desktop\\클로드코드\\_결과물\\FilmCamela_안드로이드';
// Cert of the previous store build: the upload key must not change between releases.
const REFERENCE_APK = join(RESULTS_ROOT, 'FilmCamela-1.0.0-release.apk');

const gradleSrc = readFileSync(join(APP, 'android/app/build.gradle'), 'utf8');
const VERSION_CODE = Number(gradleSrc.match(/versionCode\s+(\d+)/)?.[1]);
const VERSION_NAME = gradleSrc.match(/versionName\s+"([^"]+)"/)?.[1];
if (!VERSION_CODE || !VERSION_NAME) throw new Error('versionCode / versionName not found in android/app/build.gradle');

// ---------------------------------------------------------------- tools
const SDK = process.env.ANDROID_HOME || 'C:\\Android\\sdk';
const newest = (dir, re = /./) => readdirSync(dir).filter((d) => re.test(d)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop();
const BT = join(SDK, 'build-tools', newest(join(SDK, 'build-tools'), /^\d/));
const JDK = process.env.FC_JAVA_HOME || join('C:\\Program Files\\Microsoft', newest('C:\\Program Files\\Microsoft', /^jdk-21\./));
const AAPT2 = join(BT, 'aapt2.exe');
const APKSIGNER = join(BT, 'apksigner.bat');
const APKANALYZER = join(SDK, 'cmdline-tools', 'latest', 'bin', 'apkanalyzer.bat');
const KEYTOOL = join(JDK, 'bin', 'keytool.exe');
const JAR = join(JDK, 'bin', 'jar.exe');

const env = { ...process.env, JAVA_HOME: JDK, ANDROID_HOME: SDK, ANDROID_SDK_ROOT: SDK, PATH: `${join(JDK, 'bin')};${process.env.PATH}` };
delete env.VITE_ADS_TEST; // release web assets must request REAL ad units

const q = (s) => (/[\s&()^]/.test(s) ? `"${s}"` : s);
/** Runs a command (through cmd for .bat/.cmd/npx), inheriting output unless capture is set. */
function run(cmd, argv, { cwd = APP, capture = false, extraEnv = {}, allowFail = false } = {}) {
  const shell = /\.(bat|cmd)$/i.test(cmd) || /^(npm|npx)$/.test(cmd);
  const r = shell
    ? spawnSync([q(cmd), ...argv.map(q)].join(' '), { cwd, env: { ...env, ...extraEnv }, shell: true, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', maxBuffer: 256 << 20 })
    : spawnSync(cmd, argv, { cwd, env: { ...env, ...extraEnv }, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', maxBuffer: 256 << 20 });
  if (r.status !== 0 && !allowFail) throw new Error(`${cmd} ${argv.join(' ')} failed (exit ${r.status})\n${(r.stderr || '').slice(-3000)}`);
  return capture ? `${r.stdout ?? ''}${r.stderr ?? ''}` : '';
}
const log = (s) => console.log(`\n=== ${s}`);

// ---------------------------------------------------------------- workspace
let ROOT = APP;
let OUT = opt('--out', join(RESULTS_ROOT, VERSION_NAME));
const extraEnv = {};
if (DRY) {
  ROOT = resolve(opt('--work', join(tmpdir(), 'fc-release-dry')));
  OUT = opt('--out', join(ROOT, 'out'));
  extraEnv.FC_KEYSTORE_PROPS = join(APP, 'android', 'keystore.properties');
  if (!VERIFY_ONLY) {
    log(`dry run: copying the project to ${ROOT} (no keystore, node_modules linked)`);
    const SKIP_DIRS = new Set(['node_modules', 'build', '.gradle', 'keystore', 'dist', 'ios', 'test-results', 'playwright-report', 'e2e', 'design', '.vercel', 'out', '.cxx']);
    const SKIP_FILE = /^(keystore\.properties|.*\.(jks|keystore|apk|aab))$/i;
    for (const sub of ['src', 'public', 'scripts', 'android']) rmSync(join(ROOT, sub), { recursive: true, force: true });
    mkdirSync(ROOT, { recursive: true });
    cpSync(APP, ROOT, {
      recursive: true,
      filter: (src) => {
        const name = src.split(/[\\/]/).pop();
        if (src === APP) return true;
        if (SKIP_FILE.test(name)) return false;
        try {
          if (statSync(src).isDirectory() && SKIP_DIRS.has(name)) return false;
        } catch {
          return false;
        }
        return true;
      },
    });
    linkNodeModules(join(APP, 'node_modules'), join(ROOT, 'node_modules'));
  }
}

/**
 * Dry-run node_modules: junctions to the real packages, except the Capacitor Android projects, which are
 * COPIED — gradle reports "No variants exist" for library projects reached through a junction.
 */
function linkNodeModules(from, to) {
  removeNoFollow(to);
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const st = statSync(src);
    if (!st.isDirectory()) {
      copyFileSync(src, join(to, name));
      continue;
    }
    if (name.startsWith('@')) {
      linkNodeModules(src, join(to, name));
      continue;
    }
    const android = existsSync(join(src, 'android', 'build.gradle')) || existsSync(join(src, 'capacitor', 'build.gradle'));
    if (android) cpSync(src, join(to, name), { recursive: true, filter: (p) => !/[\\/](build|\.gradle|node_modules)$/.test(p) });
    else symlinkSync(src, join(to, name), 'junction');
  }
}
/** Deletes a tree but only UNLINKS junctions/symlinks — never touches what they point at (the real node_modules). */
function removeNoFollow(p) {
  let st;
  try {
    st = lstatSync(p);
  } catch {
    return;
  }
  if (st.isSymbolicLink()) {
    try {
      rmdirSync(p);
    } catch {
      unlinkSync(p);
    }
    return;
  }
  if (st.isDirectory()) {
    for (const n of readdirSync(p)) removeNoFollow(join(p, n));
    rmdirSync(p);
  } else unlinkSync(p);
}

/** Maps a drive letter to ROOT (gradle + Windows path-length limit). Reuses S: when it already points at ROOT. */
function sameDir(a, b) {
  try {
    const x = statSync(join(a, 'package.json'), { bigint: true });
    const y = statSync(join(b, 'package.json'), { bigint: true });
    return x.ino === y.ino && x.dev === y.dev;
  } catch {
    return false;
  }
}
let drive = null;
let mappedHere = false;
function mapDrive() {
  for (const letter of DRY ? 'RQPONMLK' : 'S') {
    const d = `${letter}:`;
    if (existsSync(`${d}\\`)) {
      if (sameDir(`${d}\\`, ROOT)) return (drive = d);
      continue;
    }
    run('subst', [d, ROOT]);
    mappedHere = true;
    return (drive = d);
  }
  throw new Error(DRY ? 'no free drive letter for subst' : 'S: is mapped to another folder — run `subst S: /D` first');
}

// ---------------------------------------------------------------- build
const apkDir = () => join(ROOT, 'android', 'app', 'build', 'outputs');
const ART = {
  debug: () => join(apkDir(), 'apk', 'debug', 'app-debug.apk'),
  release: () => join(apkDir(), 'apk', 'release', 'app-release.apk'),
  aab: () => join(apkDir(), 'bundle', 'release', 'app-release.aab'),
};

try {
  if (!VERIFY_ONLY) {
    if (!existsSync(extraEnv.FC_KEYSTORE_PROPS ?? join(ROOT, 'android', 'keystore.properties'))) throw new Error('release signing: android/keystore.properties missing (backup: _결과물\\SILVR_안드로이드\\서명키_백업)');
    // Vite also reads VITE_* from .env files: refuse a QA flag there too.
    for (const f of readdirSync(ROOT).filter((n) => /^\.env/.test(n))) {
      if (/^\s*VITE_ADS_TEST\s*=\s*['"]?1/m.test(readFileSync(join(ROOT, f), 'utf8'))) throw new Error(`${f} sets VITE_ADS_TEST=1 — release web assets would request TEST ads`);
    }
    log('web build (npm run build, no VITE_ADS_TEST)');
    run('npm', ['run', 'build'], { cwd: ROOT });
    log('npx cap sync android');
    run('npx', ['cap', 'sync', 'android'], { cwd: ROOT });
    mapDrive();
    log(`gradle on ${drive} (${ROOT})`);
    const tasks = [...(flag('--no-clean') ? [] : ['clean']), 'assembleDebug', 'assembleRelease', 'bundleRelease'];
    run(`${drive}\\android\\gradlew.bat`, [...tasks, '--stacktrace'], { cwd: `${drive}\\android`, extraEnv });
  }

  // -------------------------------------------------------------- verify
  log('verify');
  const checks = [];
  const check = (name, ok, note = '') => {
    checks.push({ name, ok: !!ok, note: String(note) });
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${note ? ` — ${note}` : ''}`);
  };
  for (const [k, f] of Object.entries(ART)) if (!existsSync(f())) throw new Error(`missing ${k} output: ${f()}`);

  const badging = (apk) => run(AAPT2, ['dump', 'badging', apk], { capture: true });
  const parseBadging = (b) => ({
    pkg: b.match(/package: name='([^']+)'/)?.[1],
    versionCode: Number(b.match(/versionCode='(\d+)'/)?.[1]),
    versionName: b.match(/versionName='([^']+)'/)?.[1],
    minSdk: Number(b.match(/(?:minSdkVersion|sdkVersion):'(\d+)'/)?.[1]),
    targetSdk: Number(b.match(/targetSdkVersion:'(\d+)'/)?.[1]),
    label: b.match(/application-label:'([^']*)'/)?.[1],
    launch: b.match(/launchable-activity: name='([^']+)'/)?.[1],
    debuggable: /application-debuggable/.test(b),
    perms: [...b.matchAll(/uses-permission: name='([^']+)'/g)].map((m) => m[1]),
  });
  /** android:value of the AdMob APPLICATION_ID meta-data, resolved through the resource table. */
  function admobAppId(apk) {
    const tree = run(AAPT2, ['dump', 'xmltree', '--file', 'AndroidManifest.xml', apk], { capture: true });
    const at = tree.indexOf('com.google.android.gms.ads.APPLICATION_ID');
    if (at < 0) return null;
    // Binary manifests reference @0x7f…, proto (AAB) manifests @string/name.
    const val = tree.slice(at, at + 400).match(/:value\([^)]*\)=(@0x[0-9a-f]+|@string\/[\w.]+|"([^"]*)")/i);
    if (!val) return null;
    if (val[2] !== undefined) return val[2];
    const res = run(AAPT2, ['dump', 'resources', apk], { capture: true });
    const ref = val[1].startsWith('@0x') ? new RegExp(`resource ${val[1].slice(1)} `, 'i') : new RegExp(`resource 0x[0-9a-f]+ ${val[1].slice(1).replace('.', '\\.')}\\s`, 'i');
    const m = ref.exec(res);
    return m ? (res.slice(m.index, m.index + 400).match(/"([^"]*)"/)?.[1] ?? null) : null;
  }
  const certSha = (apk) => {
    const o = run(APKSIGNER, ['verify', '--print-certs', '-v', apk], { capture: true, allowFail: true });
    return {
      verified: /^Verifies\s*$/m.test(o),
      v2: /Verified using v2 scheme \(APK Signature Scheme v2\): true/.test(o),
      sha256: o.match(/Signer #1 certificate SHA-256 digest: ([0-9a-f]+)/)?.[1],
      dn: o.match(/Signer #1 certificate DN: (.*)/)?.[1]?.trim(),
    };
  };
  const jarCertSha = (file) => {
    const o = run(KEYTOOL, ['-printcert', '-jarfile', file], { capture: true, allowFail: true });
    return o.match(/SHA256:\s*([0-9A-F:]+)/)?.[1]?.replace(/:/g, '').toLowerCase();
  };
  const short = (s) => (s ? `${s.slice(0, 16)}…` : 'none');

  const rel = parseBadging(badging(ART.release()));
  const dbg = parseBadging(badging(ART.debug()));
  for (const [name, b, debuggable] of [['release APK', rel, false], ['debug APK', dbg, true]]) {
    check(`${name}: package ${PKG}`, b.pkg === PKG, b.pkg);
    check(`${name}: versionCode ${VERSION_CODE} / ${VERSION_NAME}`, b.versionCode === VERSION_CODE && b.versionName === VERSION_NAME, `${b.versionCode} / ${b.versionName}`);
    check(`${name}: targetSdk ≥ ${PLAY_MIN_TARGET} (Play 2026), minSdk`, b.targetSdk >= PLAY_MIN_TARGET, `target ${b.targetSdk}, min ${b.minSdk}`);
    check(`${name}: label "${LABEL}", launcher ${LAUNCH}`, b.label === LABEL && b.launch === LAUNCH, `${b.label} / ${b.launch}`);
    check(`${name}: ${debuggable ? '' : 'not '}debuggable`, b.debuggable === debuggable);
    const missing = REQUIRED_PERMS.filter((p) => !b.perms.includes(p));
    check(`${name}: permissions AD_ID, BILLING, INTERNET, CAMERA`, !missing.length, missing.length ? `missing ${missing.join(', ')}` : `${b.perms.length} total`);
    const app = admobAppId(name.startsWith('release') ? ART.release() : ART.debug());
    check(`${name}: AdMob APPLICATION_ID is the real app id`, app === ADMOB_APP_ID, app);
  }

  // Signing.
  const relCert = certSha(ART.release());
  const dbgCert = certSha(ART.debug());
  check('release APK: signature verifies (v2)', relCert.verified && relCert.v2, relCert.dn);
  check('release APK: not the debug key', relCert.sha256 && !/Android Debug/i.test(relCert.dn ?? '') && relCert.sha256 !== dbgCert.sha256, `release ${short(relCert.sha256)} vs debug ${short(dbgCert.sha256)}`);
  if (existsSync(REFERENCE_APK)) {
    const ref = certSha(REFERENCE_APK);
    check('release APK: same upload key as the 1.0.0 release', ref.sha256 === relCert.sha256, `1.0.0 ${short(ref.sha256)}`);
  } else check('release APK: same upload key as the 1.0.0 release', true, `skipped (no ${REFERENCE_APK})`);
  const aabCert = jarCertSha(ART.aab());
  check('release AAB: signed with the same key as the release APK', aabCert === relCert.sha256, short(aabCert));

  // AAB manifest/resources: repack base/ as a proto APK so aapt2 can read it (no bundletool needed).
  const tmp = join(tmpdir(), `fc-aab-${process.pid}`);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(join(tmp, 'x'), { recursive: true });
  run(JAR, ['xf', ART.aab(), 'base/manifest/AndroidManifest.xml', 'base/resources.pb', 'base/res'], { cwd: join(tmp, 'x'), capture: true });
  mkdirSync(join(tmp, 'p'), { recursive: true });
  copyFileSync(join(tmp, 'x', 'base', 'manifest', 'AndroidManifest.xml'), join(tmp, 'p', 'AndroidManifest.xml'));
  copyFileSync(join(tmp, 'x', 'base', 'resources.pb'), join(tmp, 'p', 'resources.pb'));
  cpSync(join(tmp, 'x', 'base', 'res'), join(tmp, 'p', 'res'), { recursive: true });
  const protoApk = join(tmp, 'base-proto.apk');
  run(JAR, ['cfM', protoApk, '-C', join(tmp, 'p'), '.'], { capture: true });
  const aab = parseBadging(badging(protoApk));
  check(`release AAB: package / versionCode / targetSdk`, aab.pkg === PKG && aab.versionCode === VERSION_CODE && aab.targetSdk >= PLAY_MIN_TARGET && !aab.debuggable, `${aab.pkg} ${aab.versionCode} target ${aab.targetSdk}`);
  const aabMissing = REQUIRED_PERMS.filter((p) => !aab.perms.includes(p));
  check('release AAB: permissions AD_ID, BILLING, INTERNET, CAMERA', !aabMissing.length, aabMissing.join(', '));
  const aabApp = admobAppId(protoApk);
  check('release AAB: AdMob APPLICATION_ID is the real app id', aabApp === ADMOB_APP_ID, aabApp);
  rmSync(tmp, { recursive: true, force: true });

  // R8: plugin entry points (looked up by name from JS) must survive shrinking.
  const dex = run(APKANALYZER, ['dex', 'packages', '--defined-only', ART.release()], { capture: true, allowFail: true });
  const lost = KEPT_CLASSES.filter((c) => !new RegExp(`^C\\s.*\\s${c.replace(/\./g, '\\.')}\\s*$`, 'm').test(dex));
  check('release APK: R8 kept the plugin classes', !lost.length, lost.length ? `missing ${lost.join(', ')}` : KEPT_CLASSES.map((c) => c.split('.').pop()).join(', '));
  const mapping = join(apkDir(), 'mapping', 'release', 'mapping.txt');
  check('release: R8 mapping.txt written (upload to Play for crash deobfuscation)', existsSync(mapping));

  // Play: apps targeting 35+ must support 16 KB memory pages (native libs aligned; none today).
  const listing = run(JAR, ['tf', ART.release()], { capture: true });
  const libs = listing.split(/\r?\n/).filter((l) => /^lib\/.*\.so$/.test(l));
  const za = run(join(BT, 'zipalign.exe'), ['-c', '-v', '-P', '16', '4', ART.release()], { capture: true, allowFail: true });
  check('release APK: 16 KB page-size alignment (zipalign -P 16)', /Verification succes/i.test(za), `${libs.length} native libs`);

  // Web assets inside the release APK.
  check('release APK: web assets packaged (assets/public/index.html)', /^assets\/public\/index\.html$/m.test(listing));

  // -------------------------------------------------------------- outputs
  const failed = checks.filter((c) => !c.ok);
  mkdirSync(OUT, { recursive: true });
  const base = `FilmCamela-${VERSION_NAME}`;
  const outputs = { [`${base}-release.aab`]: ART.aab(), [`${base}-release.apk`]: ART.release(), [`${base}-debug.apk`]: ART.debug() };
  if (existsSync(mapping)) outputs[`${base}-mapping.txt`] = mapping;
  const sums = [];
  if (!failed.length || DRY) {
    for (const [name, from] of Object.entries(outputs)) {
      copyFileSync(from, join(OUT, name));
      sums.push(`${createHash('sha256').update(readFileSync(from)).digest('hex')}  ${name}`);
    }
    writeFileSync(join(OUT, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`);
  }
  writeFileSync(
    join(OUT, 'verify.json'),
    JSON.stringify({ when: new Date().toISOString(), dryRun: DRY, version: `${VERSION_NAME} (${VERSION_CODE})`, releaseCertSha256: relCert.sha256, debugCertSha256: dbgCert.sha256, checks }, null, 2),
  );
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed → ${OUT}${failed.length && !DRY ? ' (artifacts NOT copied: fix the failures)' : ''}`);
  process.exitCode = failed.length ? 1 : 0;
} finally {
  if (mappedHere && drive) spawnSync('subst', [drive, '/D'], { stdio: 'ignore' });
}
