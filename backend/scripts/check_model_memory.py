"""
Script to check memory usage of individual models
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

def get_gpu_memory():
    """Get GPU memory usage if available"""
    if torch.cuda.is_available():
        return torch.cuda.memory_allocated() / 1024 / 1024  # Convert to MB
    return 0

def check_model_memory(model_name, load_function):
    """Check memory usage for a specific model"""
    print(f"\n{'='*60}")
    print(f"Testing: {model_name}")
    print(f"{'='*60}")
    
    # Clear memory
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    # Get baseline memory
    baseline_ram = get_memory_usage()
    baseline_gpu = get_gpu_memory()
    
    print(f"Baseline RAM: {baseline_ram:.2f} MB")
    print(f"Baseline GPU: {baseline_gpu:.2f} MB")
    
    # Load model
    print(f"\nLoading {model_name}...")
    try:
        model = load_function()
        
        # Get memory after loading
        after_ram = get_memory_usage()
        after_gpu = get_gpu_memory()
        
        ram_used = after_ram - baseline_ram
        gpu_used = after_gpu - baseline_gpu
        
        print(f"\n✅ Model loaded successfully!")
        print(f"RAM Usage: {ram_used:.2f} MB")
        print(f"GPU Usage: {gpu_used:.2f} MB")
        print(f"Total RAM: {after_ram:.2f} MB")
        
        # Clean up
        del model
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        return {
            "model": model_name,
            "ram_mb": ram_used,
            "gpu_mb": gpu_used,
            "total_ram_mb": after_ram
        }
        
    except Exception as e:
        print(f"\n❌ Error loading {model_name}: {e}")
        return {
            "model": model_name,
            "error": str(e)
        }

def main():
    print("="*60)
    print("MODEL MEMORY USAGE CHECKER")
    print("="*60)
    print(f"Python: {sys.version}")
    print(f"PyTorch: {torch.__version__}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA Device: {torch.cuda.get_device_name(0)}")
    print(f"Total System RAM: {psutil.virtual_memory().total / 1024 / 1024 / 1024:.2f} GB")
    
    results = []
    
    # Test 1: GoEmotion Model
    def load_goemotion():
        from transformers import pipeline
        return pipeline(
            "text-classification",
            model="SamLowe/roberta-base-go_emotions",
            top_k=None,
            device=-1  # CPU
        )
    
    results.append(check_model_memory("GoEmotion (RoBERTa)", load_goemotion))
    
    # Test 2: RoBERTa Stress Model
    def load_roberta_stress():
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        tokenizer = AutoTokenizer.from_pretrained("mnoukhov/bert-base-uncased-goemotions")
        model = AutoModelForSequenceClassification.from_pretrained("mnoukhov/bert-base-uncased-goemotions")
        return (tokenizer, model)
    
    results.append(check_model_memory("RoBERTa Stress", load_roberta_stress))
    
    # Test 3: Whisper Model
    def load_whisper():
        from transformers import WhisperProcessor, WhisperForConditionalGeneration
        processor = WhisperProcessor.from_pretrained("openai/whisper-base")
        model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-base")
        return (processor, model)
    
    results.append(check_model_memory("Whisper Base", load_whisper))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    total_ram = 0
    total_gpu = 0
    
    for result in results:
        if "error" not in result:
            print(f"\n{result['model']}:")
            print(f"  RAM: {result['ram_mb']:.2f} MB")
            print(f"  GPU: {result['gpu_mb']:.2f} MB")
            total_ram += result['ram_mb']
            total_gpu += result['gpu_mb']
        else:
            print(f"\n{result['model']}: ERROR - {result['error']}")
    
    print(f"\n{'='*60}")
    print(f"TOTAL MEMORY USAGE (All Models Combined):")
    print(f"  Total RAM: {total_ram:.2f} MB ({total_ram/1024:.2f} GB)")
    print(f"  Total GPU: {total_gpu:.2f} MB ({total_gpu/1024:.2f} GB)")
    print(f"{'='*60}")
    
    # Recommendations
    print("\n📊 DEPLOYMENT RECOMMENDATIONS:")
    print("-" * 60)
    
    if total_ram < 512:
        print("✅ Can run on 512MB RAM tier (Free tier)")
    elif total_ram < 1024:
        print("⚠️  Needs at least 1GB RAM")
    elif total_ram < 2048:
        print("⚠️  Needs at least 2GB RAM")
    else:
        print("❌ Needs more than 2GB RAM - Consider model optimization")
    
    print("\n💡 OPTIMIZATION SUGGESTIONS:")
    print("-" * 60)
    print("1. Use quantized models (4-bit/8-bit) to reduce memory")
    print("2. Load models on-demand instead of keeping in memory")
    print("3. Use model caching to avoid reloading")
    print("4. Consider using API-based models (OpenAI, Hugging Face Inference)")
    print("5. Use smaller model variants (e.g., whisper-tiny instead of base)")

if __name__ == "__main__":
    main()
