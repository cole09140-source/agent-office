// Turns the scene photos into one portrait Y4M clip for Chrome's fake camera.
// Each photo is held for 2 s at 5 fps, so consecutive shots land on different scenes.
// usage: node make-scene.mjs <out.y4m> <photo1.png> [photo2.png ...]
import { execFileSync } from 'node:child_process';

const [out, ...photos] = process.argv.slice(2);
if (!out || !photos.length) throw new Error('usage: node make-scene.mjs <out.y4m> <photo.png>...');
const inputs = photos.flatMap((p) => ['-loop', '1', '-t', '2', '-i', p]);
const fit = photos.map((_, i) => `[${i}:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=5,setsar=1[v${i}]`);
const concat = `${photos.map((_, i) => `[v${i}]`).join('')}concat=n=${photos.length}:v=1:a=0,format=yuv420p[out]`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', [...fit, concat].join(';'), '-map', '[out]', '-pix_fmt', 'yuv420p', out], { stdio: 'inherit' });
console.log(`wrote ${out}`);
