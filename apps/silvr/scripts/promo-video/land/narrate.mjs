// ElevenLabs narration per locale and beat (copy.json → <out>/<locale>/<n>-<beat>.mp3 + durations.json).
//   node narrate.mjs --out <dir> [--locales ko-KR,en-US] [--force]
// Each line is generated alone (so every beat can be timed to its scene) but with previous/next text for
// natural prosody. Key: user env ELEVENLABS_API_KEY (never printed).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const out = arg('out');
if (!out) throw new Error('--out <dir> is required');
const force = process.argv.includes('--force');
const copy = JSON.parse(readFileSync(join(here, 'copy.json'), 'utf8'));
const locales = (arg('locales') ?? Object.keys(copy.locales).join(',')).split(',');
const key = process.env.ELEVENLABS_API_KEY || execFileSync('powershell', ['-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('ELEVENLABS_API_KEY','User')"], { encoding: 'utf8' }).trim();
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim());

let chars = 0;
for (const loc of locales) {
  const L = copy.locales[loc];
  const dir = join(out, loc);
  mkdirSync(dir, { recursive: true });
  const durations = {};
  for (let i = 0; i < copy.beats.length; i++) {
    const file = join(dir, `${i + 1}-${copy.beats[i]}.mp3`);
    if (force || !existsSync(file)) {
      const v3 = L.model === 'eleven_v3'; // v3: better Mandarin tones, no request stitching
      const body = {
        text: L.say[i],
        model_id: L.model ?? 'eleven_multilingual_v2',
        voice_settings: v3 ? { stability: 0.5, similarity_boost: 0.8 } : { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true, speed: 1.0 },
        ...(v3 ? {} : { previous_text: L.say.slice(0, i).join(' ') || undefined, next_text: L.say.slice(i + 1).join(' ') || undefined }),
      };
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${L.voice}?output_format=mp3_44100_192`, { method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`${loc} ${i}: ${r.status} ${(await r.text()).slice(0, 200)}`);
      writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      chars += [...L.say[i]].length;
    }
    durations[copy.beats[i]] = +dur(file).toFixed(3);
  }
  writeFileSync(join(dir, 'durations.json'), JSON.stringify(durations, null, 1));
  console.log(loc, L.voiceName, Object.values(durations).map((d) => d.toFixed(1)).join(' + '), '=', Object.values(durations).reduce((a, b) => a + b, 0).toFixed(1), 's');
}
console.log('characters used this run:', chars);
