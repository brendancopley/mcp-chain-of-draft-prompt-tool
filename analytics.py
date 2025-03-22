"""
Analytics service for the Chain of Draft MCP server.
Tracks performance metrics for different reasoning approaches.
"""

import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

Base = declarative_base()

class InferenceRecord(Base):
    """Database model for tracking inference performance."""
    __tablename__ = 'inference_records'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    problem_id = Column(String)
    problem_text = Column(String)
    domain = Column(String)
    approach = Column(String)  # "CoD" or "CoT"
    word_limit = Column(Integer)
    tokens_used = Column(Integer)
    execution_time_ms = Column(Float)
    reasoning_steps = Column(String)
    answer = Column(String)
    expected_answer = Column(String, nullable=True)
    is_correct = Column(Integer, nullable=True)  # 1=correct, 0=incorrect, null=unknown
    meta_data = Column(JSON, nullable=True)  # Changed from metadata to meta_data to avoid SQLAlchemy reserved keyword


class AnalyticsService:
    """Service for tracking and analyzing inference performance."""
    
    def __init__(self, db_url=None):
        """Initialize the analytics service with a database connection."""
        if db_url is None:
            # Default to SQLite in the current directory
            db_url = os.environ.get("COD_DB_URL", "sqlite:///cod_analytics.db")
            
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
    
    async def record_inference(self, problem, domain, approach, word_limit, 
                              tokens_used, execution_time, reasoning, answer, 
                              expected_answer=None, metadata=None):
        """Record a new inference with performance metrics."""
        session = self.Session()
        try:
            # Simple hash function for problem ID
            problem_id = str(abs(hash(problem)) % (10 ** 10))
            
            record = InferenceRecord(
                problem_id=problem_id,
                problem_text=problem,
                domain=domain,
                approach=approach,
                word_limit=word_limit,
                tokens_used=tokens_used,
                execution_time_ms=execution_time,
                reasoning_steps=reasoning,
                answer=answer,
                expected_answer=expected_answer,
                is_correct=self._check_correctness(answer, expected_answer) if expected_answer else None,
                meta_data=metadata
            )
            session.add(record)
            session.commit()
            return record.id
        finally:
            session.close()
    
    def _check_correctness(self, answer, expected_answer):
        """Check if an answer is correct."""
        # Basic string comparison - could be improved with more sophisticated matching
        if not answer or not expected_answer:
            return None
            
        return 1 if answer.strip().lower() == expected_answer.strip().lower() else 0
    
    async def get_performance_by_domain(self, domain=None):
        """Get performance statistics by domain."""
        session = self.Session()
        try:
            query = session.query(
                InferenceRecord.domain,
                InferenceRecord.approach,
                func.avg(InferenceRecord.tokens_used).label("avg_tokens"),
                func.avg(InferenceRecord.execution_time_ms).label("avg_time"),
                func.avg(InferenceRecord.is_correct).label("accuracy"),
                func.count(InferenceRecord.id).label("count")
            ).group_by(InferenceRecord.domain, InferenceRecord.approach)
            
            if domain:
                query = query.filter(InferenceRecord.domain == domain)
                
            results = query.all()
            return [
                {
                    "domain": r.domain,
                    "approach": r.approach,
                    "avg_tokens": r.avg_tokens,
                    "avg_time_ms": r.avg_time,
                    "accuracy": r.accuracy if r.accuracy is not None else None,
                    "count": r.count
                }
                for r in results
            ]
        finally:
            session.close()
    
    async def get_token_reduction_stats(self):
        """Calculate token reduction statistics for CoD vs CoT."""
        session = self.Session()
        try:
            domains = session.query(InferenceRecord.domain).distinct().all()
            results = []
            
            for domain_row in domains:
                domain = domain_row[0]
                
                # Get average tokens for CoD and CoT approaches in this domain
                cod_avg = session.query(func.avg(InferenceRecord.tokens_used)).filter(
                    InferenceRecord.domain == domain,
                    InferenceRecord.approach == "CoD"
                ).scalar() or 0
                
                cot_avg = session.query(func.avg(InferenceRecord.tokens_used)).filter(
                    InferenceRecord.domain == domain,
                    InferenceRecord.approach == "CoT"
                ).scalar() or 0
                
                if cot_avg > 0:
                    reduction_percentage = (1 - (cod_avg / cot_avg)) * 100
                else:
                    reduction_percentage = 0
                    
                results.append({
                    "domain": domain,
                    "cod_avg_tokens": cod_avg,
                    "cot_avg_tokens": cot_avg,
                    "reduction_percentage": reduction_percentage
                })
                
            return results
        finally:
            session.close()
            
    async def get_accuracy_comparison(self):
        """Compare accuracy between CoD and CoT approaches."""
        session = self.Session()
        try:
            domains = session.query(InferenceRecord.domain).distinct().all()
            results = []
            
            for domain_row in domains:
                domain = domain_row[0]
                
                # Get accuracy for CoD and CoT approaches in this domain
                cod_accuracy = session.query(func.avg(InferenceRecord.is_correct)).filter(
                    InferenceRecord.domain == domain,
                    InferenceRecord.approach == "CoD",
                    InferenceRecord.is_correct.isnot(None)
                ).scalar()
                
                cot_accuracy = session.query(func.avg(InferenceRecord.is_correct)).filter(
                    InferenceRecord.domain == domain,
                    InferenceRecord.approach == "CoT",
                    InferenceRecord.is_correct.isnot(None)
                ).scalar()
                
                results.append({
                    "domain": domain,
                    "cod_accuracy": cod_accuracy,
                    "cot_accuracy": cot_accuracy,
                    "accuracy_difference": (cod_accuracy - cot_accuracy) if cod_accuracy and cot_accuracy else None
                })
                
            return results
        finally:
            session.close()
