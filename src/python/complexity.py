"""
Complexity estimation module for the Chain of Draft MCP server.
Analyzes problems to determine appropriate word limits.
"""

class ComplexityEstimator:
    """
    Estimates the complexity of a problem to determine appropriate word limits
    for Chain of Draft reasoning steps.
    """
    
    def __init__(self):
        """Initialize with domain-specific complexity rules."""
        # Base complexity rules - default word limits per domain
        self.domain_base_limits = {
            "math": 6,
            "logic": 5,
            "common_sense": 4,
            "physics": 7,
            "chemistry": 6,
            "biology": 5,
            "code": 8,
            "puzzle": 5,
            "general": 5
        }
        
        # Keywords that might indicate complexity
        self.complexity_indicators = {
            "math": [
                "integral", "derivative", "equation", "proof", "theorem", "calculus",
                "matrix", "vector", "linear algebra", "probability", "statistics",
                "geometric series", "differential", "polynomial", "factorial"
            ],
            "logic": [
                "if and only if", "necessary condition", "sufficient", "contradiction",
                "syllogism", "premise", "fallacy", "converse", "counterexample",
                "logical equivalence", "negation", "disjunction", "conjunction"
            ],
            "code": [
                "recursion", "algorithm", "complexity", "optimization", "function",
                "class", "object", "inheritance", "polymorphism", "data structure",
                "binary tree", "hash table", "graph", "dynamic programming"
            ],
            "physics": [
                "quantum", "relativity", "momentum", "force", "acceleration",
                "energy", "thermodynamics", "electric field", "magnetic field",
                "potential", "entropy", "wavelength", "frequency"
            ],
            "chemistry": [
                "reaction", "molecule", "compound", "element", "equilibrium",
                "acid", "base", "oxidation", "reduction", "catalyst", "isomer"
            ],
            "biology": [
                "gene", "protein", "enzyme", "cell", "tissue", "organ", "system",
                "metabolism", "photosynthesis", "respiration", "homeostasis"
            ],
            "puzzle": [
                "constraint", "sequence", "pattern", "rules", "probability",
                "combination", "permutation", "optimal", "strategy"
            ]
        }
    
    async def estimate_complexity(self, problem, domain="general"):
        """
        Estimate the complexity of a problem based on its characteristics.
        Returns a recommended word limit per step.
        """
        # Start with base word limit for domain
        base_limit = self.domain_base_limits.get(domain.lower(), 5)
        
        # Analyze problem length - longer problems often need more detailed reasoning
        length_factor = min(len(problem.split()) / 50, 2)  # Cap at doubling
        
        # Check for complexity indicators
        indicator_count = 0
        indicators = self.complexity_indicators.get(domain.lower(), [])
        for indicator in indicators:
            if indicator.lower() in problem.lower():
                indicator_count += 1
        
        indicator_factor = min(1 + (indicator_count * 0.2), 1.8)  # Cap at 80% increase
        
        # Count the number of question marks - might indicate multi-part problems
        question_factor = 1 + (problem.count("?") * 0.2)
        
        # Simple complexity analysis based on sentence structure
        sentences = [s for s in problem.split(".") if s.strip()]
        words_per_sentence = len(problem.split()) / max(len(sentences), 1)
        sentence_complexity_factor = min(words_per_sentence / 15, 1.5)  # Complex sentences
        
        # Special domain-specific adjustments
        domain_factor = 1.0
        if domain.lower() == "math" and any(term in problem.lower() for term in ["prove", "proof", "theorem"]):
            domain_factor = 1.3  # Proofs need more explanation
        elif domain.lower() == "code" and any(term in problem.lower() for term in ["implement", "function", "algorithm"]):
            domain_factor = 1.2  # Code implementations need more detail
        
        # Combine factors - take the maximum impact factor
        impact_factor = max(length_factor, indicator_factor, question_factor, 
                           sentence_complexity_factor, domain_factor)
        
        # Apply the impact factor to the base limit
        adjusted_limit = round(base_limit * impact_factor)
        
        # Cap at reasonable bounds
        return max(3, min(adjusted_limit, 10))
    
    def analyze_problem(self, problem, domain="general"):
        """
        Provide a detailed analysis of problem complexity factors.
        Useful for debugging and understanding complexity estimates.
        """
        base_limit = self.domain_base_limits.get(domain.lower(), 5)
        
        # Word count analysis
        word_count = len(problem.split())
        length_factor = min(word_count / 50, 2)
        
        # Indicator analysis
        indicators = self.complexity_indicators.get(domain.lower(), [])
        found_indicators = [ind for ind in indicators if ind.lower() in problem.lower()]
        indicator_count = len(found_indicators)
        indicator_factor = min(1 + (indicator_count * 0.2), 1.8)
        
        # Question mark analysis
        question_count = problem.count("?")
        question_factor = 1 + (question_count * 0.2)
        
        # Sentence complexity
        sentences = [s for s in problem.split(".") if s.strip()]
        words_per_sentence = word_count / max(len(sentences), 1)
        sentence_complexity_factor = min(words_per_sentence / 15, 1.5)
        
        return {
            "domain": domain,
            "base_limit": base_limit,
            "word_count": word_count,
            "length_factor": length_factor,
            "indicator_count": indicator_count,
            "found_indicators": found_indicators,
            "indicator_factor": indicator_factor,
            "question_count": question_count,
            "question_factor": question_factor,
            "sentence_count": len(sentences),
            "words_per_sentence": words_per_sentence,
            "sentence_complexity_factor": sentence_complexity_factor,
            "estimated_complexity": max(3, min(round(base_limit * max(length_factor, indicator_factor, question_factor, sentence_complexity_factor)), 10))
        }
