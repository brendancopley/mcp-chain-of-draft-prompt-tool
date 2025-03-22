"""
Example database management for the Chain of Draft MCP server.
Stores and retrieves example problems and solutions.
"""

import os
from sqlalchemy import create_engine, Column, Integer, String, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Example(Base):
    """Database model for storing reasoning examples."""
    __tablename__ = 'examples'
    
    id = Column(Integer, primary_key=True)
    problem = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=False)
    answer = Column(String, nullable=False)
    domain = Column(String, nullable=False)
    approach = Column(String, nullable=False)  # "CoD" or "CoT"
    meta_data = Column(JSON, nullable=True)  # Changed from metadata to avoid SQLAlchemy reserved keyword


class ExampleDatabase:
    """Manages a database of reasoning examples for few-shot prompting."""
    
    def __init__(self, db_path=None):
        """Initialize the example database with a connection."""
        if db_path is None:
            # Default to SQLite in the current directory
            db_path = os.environ.get("COD_EXAMPLES_DB", "cod_examples.db")
            
        self.engine = create_engine(f"sqlite:///{db_path}")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        
        # Initialize with some examples if empty
        self._ensure_examples_exist()
    
    def _ensure_examples_exist(self):
        """Check if examples exist and seed the database if empty."""
        session = self.Session()
        count = session.query(Example).count()
        session.close()
        
        if count == 0:
            self._load_initial_examples()
    
    def _load_initial_examples(self):
        """Load initial examples into the database."""
        # Add some basic examples across domains
        examples = [
            # Math example (CoT)
            {
                "problem": "Jason had 20 lollipops. He gave Denny some lollipops. Now Jason has 12 lollipops. How many lollipops did Jason give to Denny?",
                "reasoning": "Let's think through this step by step:\n1. Initially, Jason had 20 lollipops.\n2. After giving some to Denny, Jason now has 12 lollipops.\n3. To find out how many lollipops Jason gave to Denny, we need to calculate the difference between the initial number of lollipops and the remaining number.\n4. We can set up a simple subtraction problem: Initial number of lollipops - Remaining number of lollipops = Lollipops given to Denny\n5. Putting in the numbers: 20 - 12 = Lollipops given to Denny\n6. Solving the subtraction: 20 - 12 = 8",
                "answer": "8 lollipops",
                "domain": "math",
                "approach": "CoT"
            },
            # Math example (CoD)
            {
                "problem": "Jason had 20 lollipops. He gave Denny some lollipops. Now Jason has 12 lollipops. How many lollipops did Jason give to Denny?",
                "reasoning": "Initial: 20 lollipops\nRemaining: 12 lollipops\nGave away: 20-12=8 lollipops",
                "answer": "8 lollipops",
                "domain": "math",
                "approach": "CoD"
            },
            # Logic example (CoT)
            {
                "problem": "A coin is heads up. John flips the coin. Mary flips the coin. Paul flips the coin. Susan does not flip the coin. Is the coin still heads up?",
                "reasoning": "Let's track the state of the coin through each flip:\n1. Initially, the coin is heads up.\n2. John flips the coin, so it changes from heads to tails.\n3. Mary flips the coin, so it changes from tails to heads.\n4. Paul flips the coin, so it changes from heads to tails.\n5. Susan does not flip the coin, so it remains tails.\nTherefore, the coin is tails up, which means it is not still heads up.",
                "answer": "No",
                "domain": "logic",
                "approach": "CoT"
            },
            # Logic example (CoD)
            {
                "problem": "A coin is heads up. John flips the coin. Mary flips the coin. Paul flips the coin. Susan does not flip the coin. Is the coin still heads up?",
                "reasoning": "H→J flips→T\nT→M flips→H\nH→P flips→T\nT→S no flip→T\nFinal: tails",
                "answer": "No",
                "domain": "logic",
                "approach": "CoD"
            },
            # Physics example (CoT)
            {
                "problem": "A car accelerates from 0 to 60 mph in 5 seconds. What is its acceleration in mph/s?",
                "reasoning": "Let's solve this problem step by step:\n1. We know the initial velocity is 0 mph.\n2. The final velocity is 60 mph.\n3. The time taken is 5 seconds.\n4. Acceleration is the rate of change of velocity with respect to time.\n5. Using the formula: acceleration = (final velocity - initial velocity) / time\n6. Substituting the values: acceleration = (60 mph - 0 mph) / 5 seconds\n7. Simplifying: acceleration = 60 mph / 5 seconds = 12 mph/s",
                "answer": "12 mph/s",
                "domain": "physics",
                "approach": "CoT"
            },
            # Physics example (CoD)
            {
                "problem": "A car accelerates from 0 to 60 mph in 5 seconds. What is its acceleration in mph/s?",
                "reasoning": "a = Δv/Δt\na = (60-0)/5\na = 12 mph/s",
                "answer": "12 mph/s",
                "domain": "physics",
                "approach": "CoD"
            }
        ]
        
        # Add examples to database
        session = self.Session()
        try:
            for example in examples:
                session.add(Example(**example))
            session.commit()
        finally:
            session.close()
    
    async def get_examples(self, domain, approach="CoD", limit=3):
        """Get examples for a specific domain and approach."""
        session = self.Session()
        try:
            examples = session.query(Example).filter_by(
                domain=domain, approach=approach
            ).limit(limit).all()
            
            return [
                {
                    "problem": ex.problem,
                    "reasoning": ex.reasoning,
                    "answer": ex.answer,
                    "domain": ex.domain,
                    "approach": ex.approach
                }
                for ex in examples
            ]
        finally:
            session.close()
    
    async def add_example(self, problem, reasoning, answer, domain, approach="CoD", metadata=None):
        """Add a new example to the database."""
        session = self.Session()
        try:
            example = Example(
                problem=problem,
                reasoning=reasoning,
                answer=answer,
                domain=domain,
                approach=approach,
                meta_data=metadata
            )
            session.add(example)
            session.commit()
            return example.id
        finally:
            session.close()
    
    async def transform_cot_to_cod(self, cot_example, max_words_per_step=5):
        """Transform a CoT example into CoD format with word limit per step."""
        # Extract steps from CoT
        steps = self._extract_reasoning_steps(cot_example["reasoning"])
        
        # Transform each step to be more concise
        cod_steps = []
        for step in steps:
            # This could use an LLM to summarize, or rules-based approach
            cod_step = self._summarize_step(step, max_words_per_step)
            cod_steps.append(cod_step)
        
        # Create CoD version
        return {
            "problem": cot_example["problem"],
            "reasoning": "\n".join(cod_steps),
            "answer": cot_example["answer"],
            "domain": cot_example["domain"],
            "approach": "CoD"
        }
    
    def _extract_reasoning_steps(self, reasoning):
        """Extract individual reasoning steps from CoT reasoning."""
        # Simple approach: split by numbered steps or line breaks
        if any(f"{i}." in reasoning for i in range(1, 10)):
            # Numbered steps
            import re
            steps = re.split(r'\d+\.', reasoning)
            return [s.strip() for s in steps if s.strip()]
        else:
            # Split by line
            return [s.strip() for s in reasoning.split('\n') if s.strip()]
    
    def _summarize_step(self, step, max_words):
        """Summarize a reasoning step to meet the word limit."""
        # For now, just truncate - in production, would use an LLM to summarize
        words = step.split()
        if len(words) <= max_words:
            return step
        
        # Simple heuristic: keep first few words focusing on calculation/operation
        return " ".join(words[:max_words])
    
    async def get_example_count_by_domain(self):
        """Get count of examples by domain and approach."""
        session = self.Session()
        try:
            from sqlalchemy import func
            results = session.query(
                Example.domain,
                Example.approach,
                func.count(Example.id).label("count")
            ).group_by(Example.domain, Example.approach).all()
            
            return [
                {
                    "domain": r[0],
                    "approach": r[1],
                    "count": r[2]
                }
                for r in results
            ]
        finally:
            session.close()
