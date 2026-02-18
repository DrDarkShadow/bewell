from langgraph.prebuilt import create_react_agent
from llm import llm
from emotion_tool import (
    detect_emotion, 
    get_emotional_history, 
    analyze_text_features,
    analyze_stress_deep,
    get_stress_score
)
from breathing_tool import start_breathing_exercise
from games_tool import start_game
from prompt import system_prompt

tools = [
    detect_emotion, 
    get_emotional_history, 
    analyze_text_features,
    analyze_stress_deep,
    get_stress_score,
    start_breathing_exercise, 
    start_game
]

agent = create_react_agent(
    model=llm,
    tools=tools,
    prompt=system_prompt
)
