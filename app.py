
# === ALL IMPORTS AT TOP ===
import os
import sys
import streamlit as st
import json
import random
from datetime import datetime
from agent import agent
from games_tool import get_game_html
from breathing_tool import get_breathing_exercise_html
sys.path.append(os.path.dirname(__file__))
from llm import llm

# ============== Affirmation Feature ==============
def get_user_name():
    try:
        with open(os.path.join(os.path.dirname(__file__), "user_data.json"), "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("name", "dost")
    except Exception:
        return "dost"

def generate_affirmation(name: str) -> str:
    prompt = f"Write a short, cute, personalized affirmation for {name} to start their day. Use emojis and a friendly, supportive tone. 1-2 sentences only."
    try:
        response = llm.invoke(prompt)
        if hasattr(response, "content"):
            return response.content.strip()
        return str(response).strip()
    except Exception:
        # fallback
        return f"You are amazing, {name}! 💛 Keep shining today."

if "affirmation_claimed" not in st.session_state:
    st.session_state.affirmation_claimed = False

if not st.session_state.affirmation_claimed:
    user_name = get_user_name()
    affirmation = generate_affirmation(user_name)
    with st.container():
        st.markdown(f"""
        <div style='background: linear-gradient(90deg,#ffe0ec 0%,#fffbe7 100%); border-radius: 18px; padding: 18px 20px; margin-bottom: 18px; box-shadow: 0 2px 8px #ffe0ec;'>
            <span style='font-size:1.2rem; color:#d63384; font-weight:600;'>🌸 Affirmation for you:</span><br>
            <span style='font-size:1.3rem; color:#856404;'>{affirmation}</span>
        </div>
        """, unsafe_allow_html=True)
        if st.button("I claimed it! 🌟", key="claim_affirmation", use_container_width=True):
            st.session_state.affirmation_claimed = True

import os
import sys
import streamlit as st
import json
import random
from datetime import datetime
from agent import agent
from games_tool import get_game_html
from breathing_tool import get_breathing_exercise_html

# Lazy load stress calculator to avoid slow startup
_stress_calculator = None

def get_stress_score_for_ui(text: str):
    """Get stress score for display in UI"""
    global _stress_calculator
    try:
        if _stress_calculator is None:
            from model_fusion import get_stress_calculator
            _stress_calculator = get_stress_calculator()
        result = _stress_calculator.calculate_stress(text)
        return {
            "score": result.stress_score,
            "level": result.stress_level,
            "sentiment": result.sentiment.label,
            "emotion": result.emotions.primary_emotion
        }
    except Exception as e:
        return None

# File path for storing conversation
CONVERSATION_FILE = os.path.join(os.path.dirname(__file__), "chat_history.json")

def load_conversation():
    """Load conversation from file"""
    try:
        if os.path.exists(CONVERSATION_FILE):
            with open(CONVERSATION_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("messages", [])
    except (json.JSONDecodeError, IOError):
        pass
    return []

def save_conversation(messages):
    """Save conversation to file"""
    try:
        data = {
            "last_updated": datetime.now().isoformat(),
            "messages": messages
        }
        with open(CONVERSATION_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except IOError as e:
        st.error(f"Error saving conversation: {e}")

# Page Configuration 
st.set_page_config(
    page_title="Companion Bot 💛",
    page_icon="💛",
    layout="wide",
    initial_sidebar_state="expanded"
)

#Custom CSS 
st.markdown("""
<style>
    /* Hide default streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* Sidebar styling */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #fff3cd 0%, #ffeeba 100%);
        padding-top: 0.5rem;
        min-width: 180px;
        max-width: 350px;
        resize: horizontal;
        overflow: auto;
    }
    
    [data-testid="stSidebar"] .stMarkdown h1,
    [data-testid="stSidebar"] .stMarkdown h2,
    [data-testid="stSidebar"] .stMarkdown h3,
    [data-testid="stSidebar"] .stMarkdown p {
        color: #856404 !important;
    }
    
    [data-testid="stSidebar"] hr {
        border-color: rgba(133, 100, 4, 0.2);
    }
    
    /* Sidebar buttons */
    [data-testid="stSidebar"] .stButton > button {
        width: 100%;
        background: rgba(255,255,255,0.7) !important;
        color: #856404 !important;
        border: 2px solid rgba(255, 193, 7, 0.4) !important;
        border-radius: 12px !important;
        padding: 10px 14px !important;
        font-size: 0.9rem !important;
        font-weight: 600 !important;
        text-align: left !important;
        margin: 4px 0 !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 0 2px 8px rgba(255, 193, 7, 0.15) !important;
        cursor: pointer !important;
        position: relative;
        overflow: hidden;
    }
    
    [data-testid="stSidebar"] .stButton > button:hover {
        background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%) !important;
        color: #5a4504 !important;
        transform: translateX(5px) scale(1.02);
        box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4) !important;
        border-color: #ffc107 !important;
    }
    
    [data-testid="stSidebar"] .stButton > button:active {
        transform: translateX(5px) scale(0.98) !important;
        box-shadow: 0 2px 5px rgba(255, 193, 7, 0.3) !important;
    }
    
    /* Add pulse animation on focus */
    [data-testid="stSidebar"] .stButton > button:focus {
        outline: none !important;
        box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.5) !important;
    }
    
    /* Light friendly background */
    .stApp {
        background: linear-gradient(180deg, #fff9e6 0%, #ffffff 100%);
    }
    
    /* Main container */
    .main .block-container {
        max-width: 900px;
        padding-top: 1rem;
        padding-bottom: 100px;
    }
    
    /* Header styling */
    .friendly-header {
        text-align: center;
        padding: 25px 20px;
        background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
        border-radius: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
    }
    
    .friendly-header h1 {
        color: #856404;
        font-size: 2rem;
        margin-bottom: 5px;
        font-weight: 600;
    }
    
    .friendly-header p {
        color: #856404;
        opacity: 0.8;
        font-size: 0.95rem;
        margin: 0;
    }
    
    /* Chat message styling */
    [data-testid="stChatMessage"] {
        background-color: transparent;
        padding: 12px 0;
    }
    
    /* User message bubble */
    [data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) > div:last-child {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 18px 18px 4px 18px;
        padding: 12px 18px;
        margin-left: 20%;
    }
    
    /* Assistant message bubble */
    [data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-assistant"]) > div:last-child {
        background: #f8f9fa;
        color: #333;
        border-radius: 18px 18px 18px 4px;
        padding: 12px 18px;
        margin-right: 20%;
        border: 1px solid #e9ecef;
    }
    
    /* Chat input styling */
    .stChatInput {
        border-radius: 25px !important;
        border: 2px solid #ffc107 !important;
        background: white !important;
    }
    
    .stChatInput:focus-within {
        border-color: #ffb300 !important;
        box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2) !important;
    }
    
    /* Section title in sidebar */
    .sidebar-section {
        color: #856404 !important;
        font-size: 0.75rem !important;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin: 12px 0 8px 0;
        padding-left: 5px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    /* Icon bounce animation on hover */
    @keyframes iconBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
    
    @keyframes iconWiggle {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-10deg); }
        75% { transform: rotate(10deg); }
    }
    
    @keyframes iconPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
    
    /* Make emojis in buttons animate on hover */
    [data-testid="stSidebar"] .stButton > button:hover {
        animation: none;
    }
    
    /* Sidebar button icon animation */
    [data-testid="stSidebar"] .stButton > button::before {
        transition: transform 0.3s ease;
    }
    
    /* Scrollbar styling */
    ::-webkit-scrollbar {
        width: 6px;
    }
    
    ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: #ffc107;
        border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #ffb300;
    }
    
    /* Main content button styling */
    .stButton > button {
        transition: all 0.3s ease !important;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    }
    
    .stButton > button:active {
        transform: translateY(0);
    }
</style>
""", unsafe_allow_html=True)

# ============== Initialize Session State ==============
if "messages" not in st.session_state:
    loaded_messages = load_conversation()
    if loaded_messages:
        st.session_state.messages = loaded_messages
    else:
        st.session_state.messages = [{
            "role": "assistant",
            "content": "Hey there! 😊 I'm your friendly companion. How are you feeling today?"
        }]
        save_conversation(st.session_state.messages)

if "current_activity" not in st.session_state:
    st.session_state.current_activity = None

if "game_type" not in st.session_state:
    st.session_state.game_type = None

#Sidebar
with st.sidebar:
    st.markdown("## 💛 Companion Bot")
    st.markdown("Your friendly wellness companion")
    
    st.markdown("---")
    
    # Chat button
    if st.button("💬 Chat", key="nav_chat", use_container_width=True):
        st.session_state.current_activity = None
        st.session_state.game_type = None
        st.rerun()
    
    st.markdown("---")
    
    # Games section
    st.markdown('<p class="sidebar-section">🎮 Games</p>', unsafe_allow_html=True)
    
    if st.button("🎭 Would You Rather", key="game_wyr", use_container_width=True):
        st.session_state.current_activity = "game"
        st.session_state.game_type = "would_you_rather"
        st.rerun()
    
    if st.button("🧩 Riddles", key="game_riddle", use_container_width=True):
        st.session_state.current_activity = "game"
        st.session_state.game_type = "riddle"
        st.rerun()
    
    if st.button("🧠 Trivia Quiz", key="game_trivia", use_container_width=True):
        st.session_state.current_activity = "game"
        st.session_state.game_type = "trivia"
        st.rerun()
    
    if st.button("🎬 Emoji Movie Guess", key="game_emoji", use_container_width=True):
        st.session_state.current_activity = "game"
        st.session_state.game_type = "emoji_guess"
        st.rerun()
    
    if st.button("🔗 Word Chain", key="game_word", use_container_width=True):
        st.session_state.current_activity = "game"
        st.session_state.game_type = "word_chain"
        st.rerun()
    
    if st.button("🌸 Gratitude Reflection", key="game_gratitude", use_container_width=True):
        st.session_state.current_activity = "game"
        st.session_state.game_type = "gratitude"
        st.rerun()
    
    st.markdown("---")
    
    # Wellness section
    st.markdown('<p class="sidebar-section">🧘 Wellness</p>', unsafe_allow_html=True)
    
    if st.button("🌬️ Breathing Exercise", key="breathing", use_container_width=True):
        st.session_state.current_activity = "breathing"
        st.rerun()
    
    if st.button("📊 Stress Tracker", key="stress_tracker", use_container_width=True):
        st.session_state.current_activity = "stress_tracker"
        st.rerun()
    
    st.markdown("---")
    
    # Chat History button
    if st.button("📜 Chat History", key="chat_history", use_container_width=True):
        st.session_state.current_activity = "history"
        st.rerun()

#  Main Content Area 

# Header
st.markdown("""
<div class="friendly-header">
    <h1>💛 Companion Bot</h1>
    <p>Your friendly chat companion - here to listen, play, and relax with you!</p>
</div>
""", unsafe_allow_html=True)

# Display content based on current activity
if st.session_state.current_activity == "breathing":
    # Breathing Exercise
    st.markdown("### 🌬️ Breathing Exercise")
    st.markdown("Take a moment to relax. Follow the breathing circle below.")
    
    # Breathing cycle selector
    cycles = st.slider("Number of cycles:", min_value=1, max_value=5, value=3)
    
    # Display breathing exercise
    breathing_html = get_breathing_exercise_html(cycles)
    st.components.v1.html(breathing_html, height=450)
    
    st.markdown("---")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🔄 Restart Exercise", use_container_width=True):
            st.rerun()
    with col2:
        if st.button("💬 Back to Chat", use_container_width=True):
            st.session_state.current_activity = None
            st.rerun()

elif st.session_state.current_activity == "stress_tracker":
    # Stress Tracker
    st.markdown("### 📊 Stress Tracker")
    st.markdown("Analyzing your conversation to understand your emotional state...")

    import pandas as pd

    # Get all user messages
    user_messages = [m["content"] for m in st.session_state.messages if m["role"] == "user"]

    if len(user_messages) == 0:
        st.info("💬 Start chatting first! I'll analyze your messages to understand how you're feeling.")
    else:
        # Calculate stress score for each message (simulate history)
        from model_fusion import get_stress_calculator
        calc = get_stress_calculator()
        stress_scores = []
        for msg in user_messages[-10:]:
            result = calc.calculate_stress(msg)
            stress_scores.append({
                "message": msg,
                "score": result.stress_score,
                "level": result.stress_level,
                "recommendation": result.recommendation
            })

        df = pd.DataFrame(stress_scores)

        # Current (latest) stress
        latest = stress_scores[-1]
        level = latest["level"]
        score = latest["score"]
        recommendation = latest["recommendation"]

        # Color based on stress level
        if level == "severe":
            color = "#dc3545"
            emoji = "🔴"
            bg_color = "#fff5f5"
        elif level == "high":
            color = "#fd7e14"
            emoji = "🟠"
            bg_color = "#fff8f0"
        elif level == "moderate":
            color = "#ffc107"
            emoji = "🟡"
            bg_color = "#fffef0"
        else:
            color = "#28a745"
            emoji = "🟢"
            bg_color = "#f0fff4"

        # Layout: percentage left, chart right
        col1, col2 = st.columns([1,2])
        with col1:
            st.markdown(f"""
            <div style="background: {bg_color}; 
                        border: 2px solid {color}; 
                        border-radius: 15px; 
                        padding: 25px; 
                        text-align: center;
                        margin-bottom: 20px;">
                <div style="font-size: 3rem; font-weight: bold; color: {color};">
                    {emoji} {score:.0%}
                </div>
                <div style="font-size: 1.5rem; color: {color}; margin-top: 10px;">
                    Stress Level: <strong>{level.upper()}</strong>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with col2:
            st.markdown("#### Stress Trend (last 10 messages)")
            st.line_chart(df["score"], use_container_width=True)

        # Show tips based on trend
        st.markdown("### 💡 Tips for You")
        if len(df) > 2:
            if df["score"].iloc[-1] > df["score"].iloc[0]:
                st.warning("Your stress seems to be increasing. Try a breathing exercise, take a break, or talk to a friend. Remember, I'm here for you!")
            elif df["score"].iloc[-1] < df["score"].iloc[0]:
                st.success("Your stress is decreasing! Keep up the good work and continue your healthy habits.")
            else:
                st.info("Your stress level is stable. Maintain your routine and check in regularly.")
        else:
            st.info("Not enough data for a trend. Keep chatting and I'll track your progress!")

        # Show latest recommendation
        st.markdown(f"**Latest tip:** {recommendation}")
    
    st.markdown("---")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🔄 Refresh Analysis", use_container_width=True):
            st.rerun()
    with col2:
        if st.button("💬 Back to Chat", use_container_width=True):
            st.session_state.current_activity = None
            st.rerun()

elif st.session_state.current_activity == "game" and st.session_state.game_type:
    # Game display
    game_titles = {
        "would_you_rather": "🎭 Would You Rather",
        "riddle": "🧩 Riddle Time",
        "trivia": "🧠 Trivia Quiz",
        "emoji_guess": "🎬 Emoji Movie Guess",
        "word_chain": "🔗 Word Chain",
        "gratitude": "🌸 Gratitude Reflection"
    }
    
    game_title = game_titles.get(st.session_state.game_type, "🎮 Game")
    st.markdown(f"### {game_title}")
    
    # Display the game
    game_html = get_game_html(st.session_state.game_type)
    st.components.v1.html(game_html, height=350)
    
    st.markdown("---")
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("🔄 New Question", use_container_width=True):
            st.rerun()
    with col2:
        if st.button("🎲 Random Game", use_container_width=True):
            games = ["would_you_rather", "riddle", "trivia", "emoji_guess", "word_chain", "gratitude"]
            st.session_state.game_type = random.choice(games)
            st.rerun()
    with col3:
        if st.button("💬 Back to Chat", use_container_width=True):
            st.session_state.current_activity = None
            st.rerun()

elif st.session_state.current_activity == "history":
    # Chat History View
    st.markdown("### 📜 Chat History")
    st.markdown("Here's a summary of your conversations.")
    
    if len(st.session_state.messages) > 0:
        # Show message count
        st.info(f"📊 Total messages: {len(st.session_state.messages)}")
        
        # Display all messages in a scrollable container
        for i, message in enumerate(st.session_state.messages):
            role_emoji = "🧑" if message["role"] == "user" else "💛"
            role_name = "You" if message["role"] == "user" else "Companion"
            
            with st.container():
                st.markdown(f"**{role_emoji} {role_name}:** {message['content'][:200]}{'...' if len(message['content']) > 200 else ''}")
                if i < len(st.session_state.messages) - 1:
                    st.markdown("---")
    else:
        st.info("No chat history yet. Start a conversation! 💬")
    
    st.markdown("---")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🗑️ Clear All History", use_container_width=True):
            st.session_state.messages = [{
                "role": "assistant",
                "content": "Hey there! 😊 I'm your friendly companion. How are you feeling today?"
            }]
            save_conversation(st.session_state.messages)
            st.success("History cleared!")
            st.rerun()
    with col2:
        if st.button("💬 Back to Chat", use_container_width=True):
            st.session_state.current_activity = None
            st.rerun()

else:
    # Chat interface
    # Display chat messages
    for message in st.session_state.messages:
        avatar = "🧑" if message["role"] == "user" else "💛"
        with st.chat_message(message["role"], avatar=avatar):
            st.markdown(message["content"])
    
    # Chat input
    if prompt := st.chat_input("Type your message here... 💬"):
        # Add user message
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Display user message
        with st.chat_message("user", avatar="🧑"):
            st.markdown(prompt)
        
        # Get bot response
        with st.chat_message("assistant", avatar="💛"):
            with st.spinner(""):
                try:
                    # Build conversation context
                    conv_history = [{"role": m["role"], "content": m["content"]} for m in st.session_state.messages]
                    result = agent.invoke({"messages": conv_history})
                    content = result["messages"][-1].content
                    
                    # Handle both string and list content formats
                    if isinstance(content, list):
                        response = ""
                        for block in content:
                            if isinstance(block, dict) and "text" in block:
                                response += block["text"]
                            elif isinstance(block, str):
                                response += block
                    else:
                        response = content
                    
                    # Check for game or breathing triggers
                    if "__GAME__|" in response:
                        game_type = response.split("__GAME__|")[1].strip()
                        st.session_state.current_activity = "game"
                        st.session_state.game_type = game_type
                        response = f"Let's play {game_type.replace('_', ' ').title()}! 🎮"
                    elif "__BREATHING_EXERCISE__|" in response:
                        st.session_state.current_activity = "breathing"
                        response = "Let's do a breathing exercise together! 🧘"
                        
                except Exception as e:
                    response = f"Oops! Something went wrong 😅 Please try again. ({str(e)})"
            
            st.markdown(response)
        
        # Add assistant response and save
        st.session_state.messages.append({"role": "assistant", "content": response})
        save_conversation(st.session_state.messages)
        
        # Rerun if activity was triggered
        if st.session_state.current_activity:
            st.rerun()
