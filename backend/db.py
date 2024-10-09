from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, Float, TIMESTAMP, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"  # Change this to your DB URL

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Provider(Base):
    __tablename__ = 'providers'

    id = Column(Integer, primary_key=True, unique=True, nullable=False, autoincrement=True)
    name = Column(String, nullable=False)
    is_exchange = Column(Boolean, nullable=False)
    is_bookmaker = Column(Boolean, nullable=False)
    meta = Column(JSON, nullable=True)

    event_id = Column(Integer, ForeignKey('events.id'), nullable=False)
    events = relationship("Event", back_populates="providers")


class Outcome(Base):
    __tablename__ = 'outcomes'

    id = Column(Integer, primary_key=True, unique=True, nullable=False, autoincrement=True)
    name = Column(String, nullable=False)
    verbose_name = Column(String, nullable=True)
    is_home = Column(Boolean, nullable=True)
    is_away = Column(Boolean, nullable=True)
    meta = Column(JSON, nullable=True)

    provider_id = Column(Integer, ForeignKey('providers.id'), nullable=False)
    provider = relationship("Provider", foreign_keys=[provider_id], backref='provider_outcomes')

    event_id = Column(Integer, ForeignKey('events.id'), nullable=False)
    event = relationship("Event", back_populates="outcomes")

    market = relationship("Market",uselist=False, back_populates="outcome")


    matched_outcome_id = Column(Integer, ForeignKey('matched_outcomes.id'), nullable=True)
    matched_outcome = relationship("MatchedOutcome", back_populates="outcomes")


class Market(Base):
    __tablename__ = 'markets'

    id = Column(Integer, primary_key=True, unique=True, nullable=False, autoincrement=True)
    outcome_id = Column(Integer, ForeignKey('outcomes.id'), nullable=False)
    event_id = Column(Integer, ForeignKey('events.id'), nullable=False)
    odds = Column(Float, nullable=False)
    name = Column(String, nullable=False)
    meta = Column(JSON, nullable=True)

    outcome = relationship("Outcome", back_populates="market")
    event = relationship("Event", back_populates="markets")


class Event(Base):
    __tablename__ = 'events'

    id = Column(Integer, primary_key=True, unique=True, nullable=False, autoincrement=True)
    name = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    last_updated = Column(String, nullable=False)
    competition = Column(String, nullable=True)
    meta = Column(JSON, nullable=True)
    matched = Column(Boolean, nullable=False)

    providers = relationship("Provider", back_populates="events",cascade="all, delete-orphan")

    markets = relationship("Market", back_populates="event",cascade="all, delete-orphan")
    outcomes = relationship("Outcome", back_populates="event",cascade="all, delete-orphan")


class MatchedOutcome(Base):
    __tablename__ = 'matched_outcomes'
    id = Column(Integer, primary_key=True, unique=True, nullable=False, autoincrement=True)

    outcomes = relationship("Outcome", back_populates="matched_outcome",cascade="all, delete-orphan")
