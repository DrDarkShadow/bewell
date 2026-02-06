import time

class SnowflakeGenerator:
    """
    Twitter-style Snowflake ID
    64-bit unique ID generator
    """
    def __init__(self, worker_id=1):
        self.epoch = 1704067200000  # Jan 1, 2024 milliseconds
        self.worker_id = worker_id & 0x1F  # 5 bits (max 32 workers)
        self.sequence = 0
        self.last_timestamp = -1
    
    def generate(self):
        timestamp = int(time.time() * 1000)  # Current time in ms
        
        if timestamp < self.last_timestamp:
            raise Exception("Clock moved backwards!")
        
        if timestamp == self.last_timestamp:
            # Same millisecond - increment sequence
            self.sequence = (self.sequence + 1) & 0xFFF
            if self.sequence == 0:
                # Sequence overflow - wait next ms
                while timestamp <= self.last_timestamp:
                    timestamp = int(time.time() * 1000)
        else:
            self.sequence = 0
        
        self.last_timestamp = timestamp
        
        # Build ID: [timestamp(41 bits)][worker(5)][sequence(12)]
        id_value = ((timestamp - self.epoch) << 22) | (self.worker_id << 12) | self.sequence
        return id_value

# Global instance
_generator = SnowflakeGenerator(worker_id=1)

def generate_id():
    """Generate new Snowflake ID"""
    return _generator.generate()