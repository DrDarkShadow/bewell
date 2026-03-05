"""
Content Moderation Module for Anonomus Chat
"""
import re
import json
import os
from typing import Tuple

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
MODERATION_FILE = os.path.join(DATA_DIR, "moderation.json")
os.makedirs(DATA_DIR, exist_ok=True)

def _read_mod():
    if not os.path.exists(MODERATION_FILE): return {}
    with open(MODERATION_FILE, "r") as f:
        try: return json.load(f)
        except: return {}

def _write_mod(data):
    with open(MODERATION_FILE, "w") as f: json.dump(data, f, indent=2)

def _pair_key(s_id, r_id): return "_".join(sorted([s_id, r_id]))

PERSONAL_INFO_PATTERNS = [
    # Phone numbers / sequences (Caught shorter sequences too)
    (re.compile(r'(\d[\d\s\-\(\)]{6,}\d)', re.IGNORECASE), "potential phone number/ID"),
    # Emails
    (re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b', re.IGNORECASE), "email address"),
    # Sensitive Credentials (English + Hinglish)
    (re.compile(r'\b(password|passwd|pwd|passcode|pin|otp|login|creds|credential|secret|chabi|kod|code)\b', re.IGNORECASE), "sensitive credentials"),
    # Social media / Account IDs (English + Hinglish + Hindi)
    (re.compile(r'\b(whatsapp|wa\.me|telegram|insta|instagram|facebook|snapchat|id is|handle is|username is|id lo|id de|id hai|handle lo|id do|आईडी)\b', re.IGNORECASE), "social media or account details"),
    # Disclosure phrases (English + Hinglish + Hindi)
    (re.compile(r'\b(call me|my number|this is my|reach me at|text me|my pass is|number lelo|number lo|baat karo|call kar|phone kar|number hai|nambar|नंबर|कॉल)\b', re.IGNORECASE), "private contact details"),
    (re.compile(r'https?://\S+|www\.\S+', re.IGNORECASE), "link"),
]

# Comprehensive English, Hinglish, and Hindi Abusive Word List
ABUSIVE_WORDS = [
    # English
    "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "pussy", "stupid", "fool", "idiot", "donkey", "dog", "garbage", "trash",
    # Hinglish / Hindi (Transliterated)
    "madarchod", "bhenchod", "behenchod", "gaandu", "chutiya", "harami", "sala", "saala", "kutiya", "kamina", "kamine", "randi", "randa", 
    "dalal", "bhadvva", "bhadwa", "lodu", "jhantu", "lavde", "lauda", "suar", "gadha", "ullu", "bewakoof", "badtameez", 
    "jungli", "bakwas", "kamina", "kaminey", "haramzada", "haramzadi", "haramkhor", "haramkhore", "ullu ke patthe", "ullu ka pattha",
    # Hindi (Devanagari)
    "गाली", "कुतिया", "हरामी", "साला", "बेवकूफ", "गधा", "सूअर", "चूतिया", "मादरचोद", "बहनचोद", "हरामजादा"
]
_ABUSIVE_RE = re.compile(r'\b(' + '|'.join(re.escape(w) for w in ABUSIVE_WORDS) + r')\b', re.IGNORECASE)

def check_message(content: str, sender_id: str, receiver_id: str) -> Tuple[bool, str, str]:
    content_lower = content.lower()
    for pattern, label in PERSONAL_INFO_PATTERNS:
        if pattern.search(content_lower):
            return True, "personal_info", f"Warning: Sharing {label} is not allowed."
    if _ABUSIVE_RE.search(content_lower):
        return True, "abusive", "Warning: Abusive language is not allowed."
    return False, "", ""

def record_violation(sender_id, receiver_id):
    data = _read_mod()
    pair = _pair_key(sender_id, receiver_id)
    if pair not in data: data[pair] = {}
    if sender_id not in data[pair]: data[pair][sender_id] = {"warnings": 0, "blocked": False}
    entry = data[pair][sender_id]
    entry["warnings"] += 1
    if entry["warnings"] >= 3: entry["blocked"] = True
    _write_mod(data)
    return entry["warnings"]

def is_blocked(sender_id, receiver_id):
    data = _read_mod()
    pair = _pair_key(sender_id, receiver_id)
    pair_data = data.get(pair, {})
    
    # Check if sender is blocked by moderation
    if pair_data.get(sender_id, {}).get("blocked", False):
        return True
        
    # Check if receiver has manually blocked sender
    # We'll store manual blocks under a "manual_blocks" key in pair_data
    if sender_id in pair_data.get("manual_blocks", []):
        return True
        
    return False

def toggle_manual_block(blocker_id, blocked_id):
    """
    blocker_id: Person who is clicking 'Block'
    blocked_id: Person being blocked
    """
    data = _read_mod()
    pair = _pair_key(blocker_id, blocked_id)
    if pair not in data: data[pair] = {}
    if "manual_blocks" not in data[pair]: data[pair]["manual_blocks"] = []
    
    if blocked_id in data[pair]["manual_blocks"]:
        data[pair]["manual_blocks"].remove(blocked_id)
        blocked = False
    else:
        data[pair]["manual_blocks"].append(blocked_id)
        blocked = True
        
    _write_mod(data)
    return blocked

def get_block_status(user_a, user_b):
    data = _read_mod()
    pair = _pair_key(user_a, user_b)
    manual_blocks = data.get(pair, {}).get("manual_blocks", [])
    return {
        "is_blocked_by_me": user_b in manual_blocks,
        "is_blocking_me": user_a in manual_blocks,
        "is_moderation_blocked": data.get(pair, {}).get(user_a, {}).get("blocked", False)
    }

def get_warnings(sender_id, receiver_id):
    data = _read_mod()
    return data.get(_pair_key(sender_id, receiver_id), {}).get(sender_id, {}).get("warnings", 0)
