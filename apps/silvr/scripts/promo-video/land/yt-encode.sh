#!/bin/bash
# Two-pass re-encode of each promo to ≤ 9.6 MB (browser upload tools take 10 MB per file); YouTube re-encodes anyway.
#   bash yt-encode.sh <folder with FilmCamela_promo_*.mp4>   → <folder>/youtube/*_yt.mp4
set -e
dir="$1"
mkdir -p "$dir/youtube"
for f in "$dir"/FilmCamela_promo_*.mp4; do
  name=$(basename "$f" .mp4)
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  # total budget 9.6 MB, audio 128 kb/s
  vk=$(python -c "print(int(9.6*8*1024*1024/1000/$dur - 128 - 40))")
  log="$dir/youtube/$name.2pass"
  ffmpeg -y -loglevel error -i "$f" -c:v libx264 -preset slow -b:v ${vk}k -pass 1 -passlogfile "$log" -an -f mp4 NUL
  ffmpeg -y -loglevel error -i "$f" -c:v libx264 -preset slow -b:v ${vk}k -pass 2 -passlogfile "$log" -c:a aac -b:a 128k -movflags +faststart "$dir/youtube/${name}_yt.mp4"
  rm -f "$log"*
  echo "$name ${vk}k $(stat -c %s "$dir/youtube/${name}_yt.mp4")"
done
