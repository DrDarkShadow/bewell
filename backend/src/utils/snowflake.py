import time
import threading
from config.settings import settings

class SnowflakeGenerator:
    """
    Twitter Snowflake ID Generator
    Generates unique 64-bit IDs roughly ordered by time.
    
    Structure (64 bits):
    - 1 bit: Unused (sign bit)
    - 41 bits: Timestamp (milliseconds since epoch)
    - 5 bits: Datacenter ID (0-31)
    - 5 bits: Worker ID (0-31)
    - 12 bits: Sequence (0-4095)
    """
    
    def __init__(self, worker_id: int = 1, datacenter_id: int = 1):
        # Constants
        self.worker_id_bits = 5
        self.datacenter_id_bits = 5
        self.sequence_bits = 12
        
        # Max values
        self.max_worker_id = -1 ^ (-1 << self.worker_id_bits) # 31
        self.max_datacenter_id = -1 ^ (-1 << self.datacenter_id_bits) # 31
        self.max_sequence = -1 ^ (-1 << self.sequence_bits) # 4095
        
        # Shift amounts
        self.worker_id_shift = self.sequence_bits
        self.datacenter_id_shift = self.sequence_bits + self.worker_id_bits
        self.timestamp_shift = self.sequence_bits + self.worker_id_bits + self.datacenter_id_bits
        
        # Epoch (2025-01-01) - Adjustable
        self.twepoch = 1735689600000 
        
        # Validation
        if worker_id > self.max_worker_id or worker_id < 0:
            raise ValueError(f"Worker ID must be between 0 and {self.max_worker_id}")
        if datacenter_id > self.max_datacenter_id or datacenter_id < 0:
            raise ValueError(f"Datacenter ID must be between 0 and {self.max_datacenter_id}")
            
        self.worker_id = worker_id
        self.datacenter_id = datacenter_id
        self.sequence = 0
        self.last_timestamp = -1
        self.lock = threading.Lock()

    def _current_timestamp(self):
        return int(time.time() * 1000)

    def next_id(self) -> int:
        """Generate next unique ID"""
        with self.lock:
            timestamp = self._current_timestamp()
            
            if timestamp < self.last_timestamp:
                raise Exception("Clock moved backwards! Refusing to generate id")
            
            if self.last_timestamp == timestamp:
                self.sequence = (self.sequence + 1) & self.max_sequence
                if self.sequence == 0:
                    # Sequence exhausted, wait for next millisecond
                    while timestamp <= self.last_timestamp:
                        timestamp = self._current_timestamp()
            else:
                self.sequence = 0
            
            self.last_timestamp = timestamp
            
            # Construct ID via bitwise OR
            new_id = ((timestamp - self.twepoch) << self.timestamp_shift) | \
                     (self.datacenter_id << self.datacenter_id_shift) | \
                     (self.worker_id << self.worker_id_shift) | \
                     self.sequence
                     
            return new_id

# Initialize Global Generator
# Get worker_id from settings (env var)
generator = SnowflakeGenerator(worker_id=settings.WORKER_ID)

def generate_id() -> int:
    """Helper function to get next ID"""
    return generator.next_id()