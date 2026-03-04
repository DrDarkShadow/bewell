"""
Script to check PEAK memory usage when all models are loaded simultaneously
"""
import psutil
import os
import sys
import gc
import torch

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(backend_dir)
sys.path.insert(0, project_root)

def get_memory_usage():
    """Get current memory usage in MB"""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024  # Convert to MB

def main():
    print("="*70)
    print("PEAK MEMORY USAGE TEST - ALL MODELS LOADED SIMULTANEOUSLY")
    print("="*70)
    print(f"Total System RAM: {psutil.virtual_memory().total / 1024 / 1024 / 1024:.2f} GB")
    print(f"Available RAM: {psutil.virtual_memory().available / 1024 / 1024 / 1024:.2f} GB")
    
    # Baseline
    baseline = get_memory_usage()
    print(f"\n📊 Baseline Memory: {baseline:.2f} MB")
    
    models = {}
    
    # Load Model 1: GoEmotion
    print("\n" + "="*70)
    print("Loading Model 1: GoEmotion (Emotion Detection)")
    print("="*70)
    try:
        from transformers import pipeline
        models['goemotion'] = pipeline(
            "text-classification",
            model="SamLowe/roberta-base-go_emotions",
            top_k=None,
            device=-1
        )
        after_goemotion = get_memory_usage()
        print(f"✅ GoEmotion loaded")
        print(f"   Memory after loading: {after_goemotion:.2f} MB")
        print(f"   Memory used: {after_goemotion - baseline:.2f} MB")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Load Model 2: Whisper
    print("\n" + "="*70)
    print("Loading Model 2: Whisper (Speech-to-Text)")
    print("="*70)
    try:
        from transformers import WhisperProcessor, WhisperForConditionalGeneration
        models['whisper_processor'] = WhisperProcessor.from_pretrained("openai/whisper-base")
        models['whisper_model'] = WhisperForConditionalGeneration.from_pretrained("openai/whisper-base")
        after_whisper = get_memory_usage()
        print(f"✅ Whisper loaded")
        print(f"   Memory after loading: {after_whisper:.2f} MB")
        print(f"   Memory used: {after_whisper - after_goemotion:.2f} MB")
    except Exception as e:
        print(f"❌ Error: {e}")
        after_whisper = after_goemotion
    
    # Load Model 3: Bedrock Agent (simulated)
    print("\n" + "="*70)
    print("Loading Model 3: Bedrock Agent")
    print("="*70)
    try:
        from agent.chatbot.agent import agent
        models['bedrock_agent'] = agent
        after_bedrock = get_memory_usage()
        print(f"✅ Bedrock Agent loaded")
        print(f"   Memory after loading: {after_bedrock:.2f} MB")
        print(f"   Memory used: {after_bedrock - after_whisper:.2f} MB")
    except Exception as e:
        print(f"❌ Error: {e}")
        after_bedrock = after_whisper
    
    # Peak Memory
    peak = get_memory_usage()
    
    print("\n" + "="*70)
    print("PEAK MEMORY ANALYSIS")
    print("="*70)
    print(f"Baseline Memory:        {baseline:.2f} MB")
    print(f"Peak Memory:            {peak:.2f} MB")
    print(f"Total Memory Used:      {peak - baseline:.2f} MB")
    print(f"Total Memory Used (GB): {(peak - baseline) / 1024:.2f} GB")
    
    # System Memory Info
    mem = psutil.virtual_memory()
    print(f"\n📊 System Memory Status:")
    print(f"   Total RAM:      {mem.total / 1024 / 1024 / 1024:.2f} GB")
    print(f"   Used RAM:       {mem.used / 1024 / 1024 / 1024:.2f} GB")
    print(f"   Available RAM:  {mem.available / 1024 / 1024 / 1024:.2f} GB")
    print(f"   Memory %:       {mem.percent}%")
    
    # Recommendations
    print("\n" + "="*70)
    print("DEPLOYMENT TIER RECOMMENDATIONS")
    print("="*70)
    
    total_mb = peak - baseline
    
    tiers = [
        (512, "Free Tier (512MB)", "❌ Too small - Will crash"),
        (1024, "1GB Tier", "⚠️  Might work but risky"),
        (2048, "2GB Tier", "✅ Recommended - Safe buffer"),
        (4096, "4GB Tier", "✅ Very safe - Plenty of room"),
    ]
    
    for size, name, status in tiers:
        if total_mb <= size * 0.7:  # 70% threshold for safety
            print(f"✅ {name:25} - {status}")
        elif total_mb <= size * 0.9:  # 90% threshold
            print(f"⚠️  {name:25} - {status}")
        else:
            print(f"❌ {name:25} - {status}")
    
    print("\n" + "="*70)
    print("OPTIMIZATION STRATEGIES")
    print("="*70)
    print("1. 🔥 Use Whisper Tiny instead of Base (saves ~200MB)")
    print("2. 🔥 Lazy load models (load only when needed)")
    print("3. 🔥 Use quantized models (4-bit/8-bit)")
    print("4. 🔥 Offload Whisper to separate service")
    print("5. 🔥 Use Hugging Face Inference API instead of local models")
    print("6. 🔥 Cache models on disk, load on-demand")
    
    print("\n" + "="*70)
    print("COST ESTIMATES (Monthly)")
    print("="*70)
    print("Railway:")
    print("  - 512MB:  Free ($5 credit)")
    print("  - 1GB:    ~$5-10/month")
    print("  - 2GB:    ~$10-20/month")
    print("\nRender:")
    print("  - 512MB:  Free (750 hours)")
    print("  - 1GB:    $7/month")
    print("  - 2GB:    $25/month")
    
    # Test with sample data
    print("\n" + "="*70)
    print("TESTING WITH SAMPLE DATA")
    print("="*70)
    
    if 'goemotion' in models:
        print("\n🧪 Testing GoEmotion...")
        before = get_memory_usage()
        result = models['goemotion']("I am feeling very happy today!")
        after = get_memory_usage()
        print(f"   Result: {result[0][0]['label']}")
        print(f"   Memory during inference: {after - before:.2f} MB")
    
    final_peak = get_memory_usage()
    print(f"\n🔝 Final Peak Memory: {final_peak:.2f} MB")
    print(f"🔝 Total Usage: {final_peak - baseline:.2f} MB ({(final_peak - baseline)/1024:.2f} GB)")

if __name__ == "__main__":
    main()
