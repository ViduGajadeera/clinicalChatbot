from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Float, JSON
from sqlalchemy.orm import relationship
import datetime
import uuid

from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False) # 'lecturer' or 'student'
    
    attempts = relationship("Attempt", back_populates="student", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="uploaded_by")

class Document(Base):
    __tablename__ = "documents"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    uploaded_by_id = Column(String(36), ForeignKey("users.id"))
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    uploaded_by = relationship("User", back_populates="documents")
    scenarios = relationship("Scenario", back_populates="document", cascade="all, delete-orphan")

class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    scenario_id = Column(String(100), unique=True, index=True, nullable=False) # E.g. "SC001"
    document_id = Column(String(36), ForeignKey("documents.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    document = relationship("Document", back_populates="scenarios")
    questions = relationship("Question", back_populates="scenario", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(100), unique=True, index=True, nullable=False) # E.g. "Q1"
    scenario_id = Column(String(36), ForeignKey("scenarios.id"))
    question_text = Column(Text, nullable=False)
    expected_answer = Column(Text, nullable=False)
    media = Column(JSON, default=list) # List of media URLs or filenames
    
    scenario = relationship("Scenario", back_populates="questions")

class Attempt(Base):
    __tablename__ = "attempts"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("users.id"))
    scenario_id = Column(String(36), ForeignKey("scenarios.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    student = relationship("User", back_populates="attempts")
    scenario = relationship("Scenario")
    messages = relationship("ChatMessage", back_populates="attempt", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    attempt_id = Column(String(36), ForeignKey("attempts.id"))
    sender = Column(String(50), nullable=False) # 'user' or 'bot'
    message_text = Column(Text, nullable=False)
    media_url = Column(String(255), nullable=True) # If bot sends an image
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    attempt = relationship("Attempt", back_populates="messages")
