from langchain_core.tools import tool
import random


@tool
def start_game(game_type: str) -> str:
    """
    Start an interactive game to engage the user based on their mood.
    
    Args:
        game_type: Type of game to start. Options:
            - "would_you_rather" - Fun choice questions (great for boredom, light mood)
            - "riddle" - Brain teasers to solve (great for distraction, boredom)
            - "trivia" - Quiz questions with options (fun for everyone)
            - "gratitude" - Gratitude reflection prompts (great for sadness, low mood)
            - "word_chain" - Word game with last letter (great for engagement)
            - "emoji_guess" - Guess movie from emojis (fun & light)
    
    Returns:
        A special marker that triggers the game UI in the app
    """
    valid_games = ["would_you_rather", "riddle", "trivia", "gratitude", "word_chain", "emoji_guess"]
    
    if game_type.lower() not in valid_games:
        game_type = random.choice(valid_games)
    
    return f"__GAME__|{game_type.lower()}"


# ============== Game Data ==============

WOULD_YOU_RATHER = [
    {"option_a": "Have the ability to fly", "option_b": "Be invisible whenever you want"},
    {"option_a": "Always know what time it is", "option_b": "Always know what the temperature is"},
    {"option_a": "Have unlimited pizza", "option_b": "Have unlimited ice cream"},
    {"option_a": "Be able to talk to animals", "option_b": "Speak every human language"},
    {"option_a": "Live in a treehouse", "option_b": "Live in a houseboat"},
    {"option_a": "Have a pet dragon", "option_b": "Have a pet unicorn"},
    {"option_a": "Be the funniest person", "option_b": "Be the smartest person"},
    {"option_a": "Never have to sleep", "option_b": "Never have to eat"},
    {"option_a": "Travel to the past", "option_b": "Travel to the future"},
    {"option_a": "Have super strength", "option_b": "Have super speed"},
]

RIDDLES = [
    {"question": "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", "answer": "A map", "hint": "You use it to find directions"},
    {"question": "What has hands but can't clap?", "answer": "A clock", "hint": "It tells you something important every day"},
    {"question": "I speak without a mouth and hear without ears. What am I?", "answer": "An echo", "hint": "You hear it in mountains or empty rooms"},
    {"question": "The more you take, the more you leave behind. What am I?", "answer": "Footsteps", "hint": "Think about walking"},
    {"question": "What can travel around the world while staying in a corner?", "answer": "A stamp", "hint": "Found on letters"},
    {"question": "I have keys but open no locks. What am I?", "answer": "A piano", "hint": "It makes music"},
    {"question": "What gets wetter the more it dries?", "answer": "A towel", "hint": "You use it after a shower"},
    {"question": "What has a head and a tail but no body?", "answer": "A coin", "hint": "You flip it to make decisions"},
]

TRIVIA = [
    {"question": "What is the largest planet in our solar system?", "options": ["Mars", "Jupiter", "Saturn", "Neptune"], "answer": "Jupiter"},
    {"question": "Which animal is known as the 'King of the Jungle'?", "options": ["Tiger", "Lion", "Elephant", "Bear"], "answer": "Lion"},
    {"question": "How many colors are in a rainbow?", "options": ["5", "6", "7", "8"], "answer": "7"},
    {"question": "What is the fastest land animal?", "options": ["Lion", "Cheetah", "Horse", "Deer"], "answer": "Cheetah"},
    {"question": "Which fruit is known for keeping the doctor away?", "options": ["Orange", "Banana", "Apple", "Grape"], "answer": "Apple"},
    {"question": "What is the capital of Japan?", "options": ["Seoul", "Beijing", "Tokyo", "Bangkok"], "answer": "Tokyo"},
    {"question": "How many legs does a spider have?", "options": ["6", "8", "10", "4"], "answer": "8"},
    {"question": "What is the largest ocean on Earth?", "options": ["Atlantic", "Indian", "Pacific", "Arctic"], "answer": "Pacific"},
]

GRATITUDE_PROMPTS = [
    "Name 3 things that made you smile today 😊",
    "What's one person you're grateful for and why? 💛",
    "What's something you're looking forward to?",
    "What's a small thing that brought you joy recently?",
    "What's one thing your body helps you do that you're thankful for?",
    "Who made you laugh recently?",
    "What's your favorite memory from this week?",
    "What's something you're proud of accomplishing?",
    "What's a comforting sound or smell you love?",
    "What's one lesson you learned that you're grateful for?",
]

EMOJI_MOVIES = [
    {"emojis": "🧊❄️👸🏻⛄", "movie": "Frozen", "hint": "A Disney princess with ice powers"},
    {"emojis": "🦁👑🌍", "movie": "The Lion King", "hint": "Hakuna Matata!"},
    {"emojis": "🕷️🧑‍🦱🦸", "movie": "Spider-Man", "hint": "A superhero from Marvel"},
    {"emojis": "🧙‍♂️💍🌋", "movie": "Lord of the Rings", "hint": "One ring to rule them all"},
    {"emojis": "🤖🚀🌱", "movie": "Wall-E", "hint": "A lonely robot on Earth"},
    {"emojis": "👨‍🚀🌌✨", "movie": "Interstellar", "hint": "Space and time travel"},
    {"emojis": "🧞‍♂️🏜️👸🐒", "movie": "Aladdin", "hint": "A whole new world"},
    {"emojis": "🦖🏝️😱", "movie": "Jurassic Park", "hint": "Dinosaurs!"},
    {"emojis": "🚢💔🧊", "movie": "Titanic", "hint": "A tragic love story at sea"},
    {"emojis": "👻👻👻🚫", "movie": "Ghostbusters", "hint": "Who you gonna call?"},
]

WORD_CHAIN_STARTERS = [
    "Apple", "Elephant", "Tiger", "Rainbow", "Ocean", 
    "Mountain", "Chocolate", "Guitar", "Diamond", "Phoenix"
]


# ============== Game HTML Generators ==============

def get_would_you_rather_html() -> str:
    """Generate Would You Rather game HTML."""
    game = random.choice(WOULD_YOU_RATHER)
    
    return f'''
    <div style="
        background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
        border-radius: 18px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 6px 25px rgba(255, 107, 107, 0.3);
    ">
        <h3 style="color: white; margin: 0 0 8px 0; font-size: 1.1rem;">🎭 Would You Rather?</h3>
        
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button onclick="this.style.transform='scale(1.02)'; this.style.background='#ffeaa7';" style="
                flex: 1;
                min-width: 140px;
                max-width: 180px;
                background: rgba(255,255,255,0.95);
                color: #FF6B6B;
                border: none;
                padding: 15px 12px;
                border-radius: 12px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            ">
                🅰️ {game["option_a"]}
            </button>
            
            <span style="color: white; font-weight: bold; font-size: 0.9rem; align-self: center;">OR</span>
            
            <button onclick="this.style.transform='scale(1.02)'; this.style.background='#ffeaa7';" style="
                flex: 1;
                min-width: 140px;
                max-width: 180px;
                background: rgba(255,255,255,0.95);
                color: #FF8E53;
                border: none;
                padding: 15px 12px;
                border-radius: 12px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            ">
                🅱️ {game["option_b"]}
            </button>
        </div>
        
        <p style="color: rgba(255,255,255,0.8); margin: 12px 0 0 0; font-size: 0.8rem;">
            💬 Tell me your choice!
        </p>
    </div>
    '''


def get_riddle_html() -> str:
    """Generate Riddle game HTML."""
    riddle = random.choice(RIDDLES)
    
    return f'''
    <div id="riddle-container" style="
        background: linear-gradient(135deg, #5C6BC0 0%, #7E57C2 100%);
        border-radius: 18px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 6px 25px rgba(92, 107, 192, 0.3);
    ">
        <h3 style="color: white; margin: 0 0 8px 0; font-size: 1.1rem;">🧩 Riddle Time!</h3>
        
        <div style="
            background: rgba(255,255,255,0.15);
            border-radius: 12px;
            padding: 15px;
            margin: 10px 0;
        ">
            <p style="color: white; font-size: 0.95rem; line-height: 1.5; margin: 0;">
                "{riddle["question"]}"
            </p>
        </div>
        
        <button onclick="document.getElementById('riddle-hint').style.display='block'; this.style.display='none';" style="
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.4);
            padding: 8px 16px;
            border-radius: 15px;
            font-size: 0.85rem;
            cursor: pointer;
            margin-right: 8px;
        ">💡 Hint</button>
        
        <button onclick="document.getElementById('riddle-answer').style.display='block'; this.style.display='none';" style="
            background: white;
            color: #5C6BC0;
            border: none;
            padding: 8px 16px;
            border-radius: 15px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
        ">🎯 Answer</button>
        
        <div id="riddle-hint" style="display: none; margin-top: 12px;">
            <p style="color: #FFD54F; font-size: 0.85rem; margin: 0;">💡 {riddle["hint"]}</p>
        </div>
        
        <div id="riddle-answer" style="display: none; margin-top: 12px;">
            <div style="background: rgba(76, 175, 80, 0.3); border-radius: 10px; padding: 10px 15px; display: inline-block;">
                <p style="color: white; font-size: 0.9rem; margin: 0;">✨ {riddle["answer"]}</p>
            </div>
        </div>
    </div>
    '''


def get_trivia_html() -> str:
    """Generate Trivia game HTML."""
    trivia = random.choice(TRIVIA)
    options_html = ""
    
    for i, option in enumerate(trivia["options"]):
        letter = chr(65 + i)  # A, B, C, D
        is_correct = option == trivia["answer"]
        
        options_html += f'''
        <button onclick="checkTrivia(this, {str(is_correct).lower()})" style="
            width: 100%;
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 0.85rem;
            cursor: pointer;
            margin: 5px 0;
            text-align: left;
        ">
            <span style="font-weight: bold; margin-right: 8px;">{letter}.</span> {option}
        </button>
        '''
    
    return f'''
    <div style="
        background: linear-gradient(135deg, #00B4DB 0%, #0083B0 100%);
        border-radius: 18px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 6px 25px rgba(0, 180, 219, 0.3);
    ">
        <h3 style="color: white; margin: 0 0 8px 0; font-size: 1.1rem;">🧠 Trivia Time!</h3>
        
        <div style="
            background: rgba(255,255,255,0.15);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 12px;
        ">
            <p style="color: white; font-size: 0.95rem; margin: 0;">
                {trivia["question"]}
            </p>
        </div>
        
        <div style="max-width: 350px; margin: 0 auto;">
            {options_html}
        </div>
        
        <div id="trivia-result" style="margin-top: 10px;"></div>
    </div>
    
    <script>
        function checkTrivia(btn, isCorrect) {{
            const buttons = btn.parentElement.querySelectorAll('button');
            buttons.forEach(b => b.disabled = true);
            
            if (isCorrect) {{
                btn.style.background = '#4CAF50';
                btn.style.borderColor = '#4CAF50';
                document.getElementById('trivia-result').innerHTML = '<p style="color: #A5D6A7; font-size: 1rem;">🎉 Correct!</p>';
            }} else {{
                btn.style.background = '#f44336';
                btn.style.borderColor = '#f44336';
                document.getElementById('trivia-result').innerHTML = '<p style="color: #FFCDD2; font-size: 0.9rem;">❌ Try again!</p>';
            }}
        }}
    </script>
    '''


def get_gratitude_html() -> str:
    """Generate Gratitude reflection HTML."""
    prompt = random.choice(GRATITUDE_PROMPTS)
    
    return f'''
    <div style="
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        border-radius: 18px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 6px 25px rgba(17, 153, 142, 0.3);
    ">
        <h3 style="color: white; margin: 0 0 8px 0; font-size: 1.1rem;">🌸 Gratitude Moment</h3>
        
        <div style="
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            padding: 18px;
            margin: 10px 0;
        ">
            <p style="color: white; font-size: 1.1rem; line-height: 1.5; margin: 0; font-weight: 500;">
                ✨ {prompt}
            </p>
        </div>
        
        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 12px;">
            <span style="font-size: 1.8rem;">🌻</span>
            <span style="font-size: 1.8rem;">💛</span>
            <span style="font-size: 1.8rem;">🌈</span>
        </div>
        
        <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 0.8rem;">
            💬 Share your thoughts!
        </p>
    </div>
    '''


def get_word_chain_html() -> str:
    """Generate Word Chain game HTML."""
    starter = random.choice(WORD_CHAIN_STARTERS)
    last_letter = starter[-1].upper()
    
    return f'''
    <div style="
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        border-radius: 18px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 6px 25px rgba(240, 147, 251, 0.3);
    ">
        <h3 style="color: white; margin: 0 0 8px 0; font-size: 1.1rem;">🔗 Word Chain!</h3>
        
        <div style="
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            padding: 15px;
            margin: 10px 0;
        ">
            <p style="color: rgba(255,255,255,0.8); font-size: 0.85rem; margin: 0 0 5px 0;">I'll start with:</p>
            <p style="color: white; font-size: 1.8rem; margin: 0; font-weight: bold;">
                {starter}
            </p>
        </div>
        
        <div style="
            background: white;
            color: #f5576c;
            display: inline-block;
            padding: 10px 25px;
            border-radius: 15px;
        ">
            <p style="margin: 0; font-size: 0.85rem;">Your word starts with:</p>
            <p style="margin: 3px 0 0 0; font-size: 1.8rem; font-weight: bold;">{last_letter}</p>
        </div>
        
        <p style="color: rgba(255,255,255,0.8); margin: 12px 0 0 0; font-size: 0.8rem;">
            💬 Type a word starting with "{last_letter}"!
        </p>
    </div>
    '''


def get_emoji_guess_html() -> str:
    """Generate Emoji Movie Guess game HTML."""
    movie = random.choice(EMOJI_MOVIES)
    
    return f'''
    <div id="emoji-game" style="
        background: linear-gradient(135deg, #FDB813 0%, #FF9500 100%);
        border-radius: 18px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 6px 25px rgba(253, 184, 19, 0.3);
    ">
        <h3 style="color: white; margin: 0 0 8px 0; font-size: 1.1rem;">🎬 Guess the Movie!</h3>
        
        <div style="
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 18px;
            margin: 10px 0;
        ">
            <p style="font-size: 2.5rem; margin: 0; letter-spacing: 8px;">
                {movie["emojis"]}
            </p>
        </div>
        
        <button onclick="document.getElementById('emoji-hint').style.display='block'; this.style.display='none';" style="
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.5);
            padding: 8px 16px;
            border-radius: 15px;
            font-size: 0.85rem;
            cursor: pointer;
            margin-right: 8px;
        ">💡 Hint</button>
        
        <button onclick="document.getElementById('emoji-answer').style.display='block'; this.style.display='none';" style="
            background: white;
            color: #FF9500;
            border: none;
            padding: 8px 16px;
            border-radius: 15px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
        ">🎯 Answer</button>
        
        <div id="emoji-hint" style="display: none; margin-top: 12px;">
            <p style="
                background: rgba(255,255,255,0.2);
                display: inline-block;
                padding: 8px 15px;
                border-radius: 10px;
                color: white;
                font-size: 0.85rem;
                margin: 0;
            ">💡 {movie["hint"]}</p>
        </div>
        
        <div id="emoji-answer" style="display: none; margin-top: 12px;">
            <div style="
                background: rgba(76, 175, 80, 0.3);
                border-radius: 12px;
                padding: 12px 20px;
                display: inline-block;
            ">
                <p style="color: white; font-size: 1.2rem; margin: 0; font-weight: bold;">
                    🎬 {movie["movie"]}
                </p>
            </div>
        </div>
    </div>
    '''


def get_game_html(game_type: str) -> str:
    """Get the appropriate game HTML based on type."""
    game_map = {
        "would_you_rather": get_would_you_rather_html,
        "riddle": get_riddle_html,
        "trivia": get_trivia_html,
        "gratitude": get_gratitude_html,
        "word_chain": get_word_chain_html,
        "emoji_guess": get_emoji_guess_html,
    }
    
    if game_type in game_map:
        return game_map[game_type]()
    
    # Default to a random game
    return random.choice(list(game_map.values()))()
