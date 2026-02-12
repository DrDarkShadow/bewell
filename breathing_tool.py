from langchain_core.tools import tool


@tool
def start_breathing_exercise(cycles: int = 3) -> str:
    """
    Start an interactive guided breathing exercise.
    Use this when user is stressed, anxious, overwhelmed, or asks for breathing help.
    
    Args:
        cycles: Number of breathing cycles (default 3, max 5)
    
    Returns:
        A special marker that triggers the breathing UI in the app
    """
    cycles = min(max(cycles, 1), 5)  
    return f"__BREATHING_EXERCISE__|{cycles}"


# Breat
def get_breathing_exercise_html(cycles: int = 3) -> str:
    """Generate the HTML for the interactive breathing exercise."""
    
    # Each cycle: 4s inhale + 4s hold + 4s exhale = 12s
    cycle_duration = 12
    total_duration = cycles * cycle_duration
    
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                background: transparent;
            }}
            
            .breathing-container {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
            }}
            
            .title {{
                color: white;
                font-size: 1.2rem;
                margin-bottom: 3px;
            }}
            
            .subtitle {{
                color: rgba(255,255,255,0.8);
                font-size: 0.85rem;
                margin-bottom: 15px;
            }}
            
            .circle-container {{
                display: flex;
                justify-content: center;
                align-items: center;
                height: 140px;
                margin: 10px 0;
            }}
            
            .breath-circle {{
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, #ffffff, #e0e5ff);
                box-shadow: 0 0 40px rgba(255,255,255,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: breathe {cycle_duration}s ease-in-out infinite;
            }}
            
            @keyframes breathe {{
                0% {{
                    width: 60px;
                    height: 60px;
                    box-shadow: 0 0 30px rgba(255,255,255,0.4);
                }}
                33% {{
                    width: 120px;
                    height: 120px;
                    box-shadow: 0 0 60px rgba(255,255,255,0.8);
                }}
                66% {{
                    width: 120px;
                    height: 120px;
                    box-shadow: 0 0 60px rgba(255,255,255,0.8);
                }}
                100% {{
                    width: 60px;
                    height: 60px;
                    box-shadow: 0 0 30px rgba(255,255,255,0.4);
                }}
            }}
            
            .emoji {{
                font-size: 1.5rem;
                animation: emoji-change {cycle_duration}s ease-in-out infinite;
            }}
            
            .instruction {{
                font-size: 1.3rem;
                color: white;
                font-weight: 600;
                min-height: 35px;
                animation: instruction-change {cycle_duration}s ease-in-out infinite;
            }}
            
            @keyframes instruction-change {{
                0%, 5% {{
                    opacity: 1;
                }}
                0%, 33% {{
                    content: "Breathe In...";
                }}
                33%, 66% {{
                    content: "Hold...";
                }}
                66%, 100% {{
                    content: "Breathe Out...";
                }}
            }}
            
            .timer-container {{
                display: flex;
                justify-content: center;
                gap: 6px;
                margin: 10px 0;
            }}
            
            .phase {{
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 0.75rem;
                font-weight: 600;
                color: white;
                opacity: 0.4;
                transition: all 0.3s ease;
            }}
            
            .phase.active {{
                opacity: 1;
                transform: scale(1.1);
            }}
            
            .phase-inhale {{
                background: rgba(76, 175, 80, 0.6);
                animation: phase-inhale {cycle_duration}s ease-in-out infinite;
            }}
            
            .phase-hold {{
                background: rgba(255, 193, 7, 0.6);
                animation: phase-hold {cycle_duration}s ease-in-out infinite;
            }}
            
            .phase-exhale {{
                background: rgba(33, 150, 243, 0.6);
                animation: phase-exhale {cycle_duration}s ease-in-out infinite;
            }}
            
            @keyframes phase-inhale {{
                0%, 33% {{ opacity: 1; transform: scale(1.1); background: rgba(76, 175, 80, 0.9); }}
                34%, 100% {{ opacity: 0.4; transform: scale(1); background: rgba(76, 175, 80, 0.4); }}
            }}
            
            @keyframes phase-hold {{
                0%, 33% {{ opacity: 0.4; transform: scale(1); }}
                34%, 66% {{ opacity: 1; transform: scale(1.1); background: rgba(255, 193, 7, 0.9); }}
                67%, 100% {{ opacity: 0.4; transform: scale(1); background: rgba(255, 193, 7, 0.4); }}
            }}
            
            @keyframes phase-exhale {{
                0%, 66% {{ opacity: 0.4; transform: scale(1); }}
                67%, 100% {{ opacity: 1; transform: scale(1.1); background: rgba(33, 150, 243, 0.9); }}
            }}
            
            .current-phase {{
                font-size: 2rem;
                color: white;
                font-weight: bold;
                min-height: 50px;
            }}
            
            .info {{
                color: rgba(255,255,255,0.7);
                font-size: 0.9rem;
                margin-top: 15px;
            }}
            
            .tip {{
                background: rgba(255,255,255,0.15);
                border-radius: 15px;
                padding: 15px;
                margin-top: 15px;
                color: rgba(255,255,255,0.9);
                font-size: 0.9rem;
            }}
        </style>
    </head>
    <body>
        <div class="breathing-container">
            <h3 class="title">🧘 Breathing Exercise</h3>
            <p class="subtitle">Follow the circle - it's automatic!</p>
            
            <div class="circle-container">
                <div class="breath-circle">
                    <span class="emoji">😌</span>
                </div>
            </div>
            
            <div class="timer-container">
                <div class="phase phase-inhale">🌬️ INHALE (4s)</div>
                <div class="phase phase-hold">✋ HOLD (4s)</div>
                <div class="phase phase-exhale">💨 EXHALE (4s)</div>
            </div>
            
            <div id="phase-text" class="current-phase">🌬️ Breathe In...</div>
            
            <div class="tip">
                💡 <strong>Tip:</strong> Breathe in through your nose, out through your mouth. Let your belly rise and fall.
            </div>
            
            <p class="info">🔄 Running {cycles} cycles continuously</p>
        </div>
        
        <script>
            const phases = ['🌬️ Breathe In...', '✋ Hold...', '💨 Breathe Out...'];
            let currentPhase = 0;
            
            function updatePhase() {{
                document.getElementById('phase-text').textContent = phases[currentPhase];
                currentPhase = (currentPhase + 1) % 3;
            }}
            
            // Update phase text every 4 seconds
            updatePhase();
            setInterval(updatePhase, 4000);
        </script>
    </body>
    </html>
    '''
