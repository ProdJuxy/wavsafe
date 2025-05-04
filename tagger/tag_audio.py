import os
from dotenv import load_dotenv
from supabase import create_client, Client
from essentia.standard import MonoLoader, RhythmExtractor2013, KeyExtractor

# Load .env variables
load_dotenv()

# Grab Supabase credentials from environment
SUPABASE_URL = os.getenv("https://xuidscjvuwckndqpqnpn.supabase.co")
SUPABASE_KEY = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aWRzY2p2dXdja25kcXBxbnBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTM2MTI2MSwiZXhwIjoyMDYwOTM3MjYxfQ.HCgfBdEbq85IkZzUR51AXa2aIJpJKBVAgk5Oj1mWUzE")

# Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Folder with your audio files
audio_folder = "audio"

def analyze_audio(file_path):
    loader = MonoLoader(filename=file_path)
    audio = loader()
    
    bpm_extractor = RhythmExtractor2013(method="multifeature")
    bpm, _, _, _, _ = bpm_extractor(audio)
    
    key_extractor = KeyExtractor()
    key, scale, strength = key_extractor(audio)

    return {
        "bpm": round(bpm),
        "key": f"{key} {scale}"
    }

def update_supabase_metadata(original_name, bpm, key):
    response = supabase.table("files_metadata") \
        .update({"bpm": bpm, "key": key}) \
        .eq("original_name", original_name) \
        .execute()

    if response.get("status_code", 200) >= 400:
        print(f"❌ Failed to update: {original_name}")
    else:
        print(f"✅ Updated: {original_name} → BPM: {bpm}, Key: {key}")

def main():
    for filename in os.listdir(audio_folder):
        if filename.endswith(".wav") or filename.endswith(".mp3"):
            file_path = os.path.join(audio_folder, filename)
            print(f"\n🎧 Analyzing {filename}...")

            try:
                data = analyze_audio(file_path)
                update_supabase_metadata(filename, data["bpm"], data["key"])
            except Exception as e:
                print(f"⚠️ Error analyzing {filename}: {e}")

if __name__ == "__main__":
    main()
