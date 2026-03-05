import json
import os
from typing import List, Dict, Any

class JSONStorage:
    def __init__(self, file_path: str):
        self.file_path = file_path
        if not os.path.exists(self.file_path):
            with open(self.file_path, 'w') as f:
                json.dump([], f)

    def read(self) -> List[Dict[str, Any]]:
        with open(self.file_path, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []

    def write(self, data: List[Dict[str, Any]]):
        with open(self.file_path, 'w') as f:
            json.dump(data, f, indent=4)

    def append(self, item: Dict[str, Any]):
        data = self.read()
        data.append(item)
        self.write(data)

users_db = JSONStorage("backend/data/users.json")
messages_db = JSONStorage("backend/data/messages.json")
