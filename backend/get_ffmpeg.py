import urllib.request
import zipfile
import os
import io

url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
print(f"Downloading {url}...")
try:
    with urllib.request.urlopen(url) as response:
        with zipfile.ZipFile(io.BytesIO(response.read())) as z:
            print("Extracting ffmpeg.exe and ffprobe.exe...")
            for file in z.namelist():
                if file.endswith('ffmpeg.exe') or file.endswith('ffprobe.exe'):
                    # extract just the file name
                    filename = os.path.basename(file)
                    with open(filename, 'wb') as f:
                        f.write(z.read(file))
                    print(f"Saved {filename}")
    print("Done! ffmpeg is now in the backend directory.")
except Exception as e:
    print(f"Failed to download/extract ffmpeg: {e}")
