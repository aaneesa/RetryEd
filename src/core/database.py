import os
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    """
    Handles MongoDB connection and operations for storing generated assets.
    """
    def __init__(self, uri: str = None, db_name: str = "retryed_db"):
        self.uri = uri or os.getenv("MONGO_URI")
        if not self.uri:
            raise ValueError("MONGO_URI not found in environment variables. Please set your MongoDB Cluster URI in .env")
        
        try:
            # Initialize MongoDB client
            self.client = MongoClient(self.uri)
            # Ping to confirm connection
            self.client.admin.command('ping')
            print("✅ Successfully connected to MongoDB Cluster.")
        except ConnectionFailure as e:
            print(f"❌ Could not connect to MongoDB: {e}")
            raise e
            
        self.db = self.client.get_database(db_name)
        
        # 1. Collection for Mind Maps
        self.mindmaps_collection = self.db.get_collection("mindmaps")
        
        # 2. Collection for Lecture Deliverables
        self.deliverables_collection = self.db.get_collection("lecture_deliverables")

    def save_mindmap(self, mermaid_code: str, raw_text: str = None, topic: str = "General") -> str:
        """
        Stores a generated mindmap into the 'mindmaps' collection.
        
        Args:
            mermaid_code: The generated Mermaid syntax string.
            raw_text: The source text used to generate the mindmap (optional).
            topic: A descriptive topic or title.
            
        Returns:
            The stringified ObjectId of the inserted document.
        """
        document = {
            "topic": topic,
            "mermaid_code": mermaid_code,
            "raw_source_text": raw_text,
            "created_at": datetime.utcnow()
        }
        result = self.mindmaps_collection.insert_one(document)
        return str(result.inserted_id)

    def save_lecture_deliverable(self, curriculum_data: dict, topic: str = "General") -> str:
        """
        Stores the generated curriculum/lessons into the 'lecture_deliverables' collection.
        
        Args:
            curriculum_data: The JSON/dictionary output from the curriculum pipeline.
            topic: A descriptive topic or title.
            
        Returns:
            The stringified ObjectId of the inserted document.
        """
        document = {
            "topic": topic,
            "curriculum": curriculum_data,
            "created_at": datetime.utcnow()
        }
        result = self.deliverables_collection.insert_one(document)
        return str(result.inserted_id)
        
    def get_mindmaps(self, limit: int = 10) -> list:
        """Retrieves recently stored mindmaps."""
        return list(self.mindmaps_collection.find().sort("created_at", -1).limit(limit))
        
    def get_lecture_deliverables(self, limit: int = 10) -> list:
        """Retrieves recently stored lecture deliverables."""
        return list(self.deliverables_collection.find().sort("created_at", -1).limit(limit))
