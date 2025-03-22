"""
Reasoning selector module for the Chain of Draft MCP server.
Handles choosing between CoD and CoT approaches.
"""

from complexity import ComplexityEstimator

class ReasoningSelector:
    """
    Selects the most appropriate reasoning approach (CoD or CoT)
    based on problem characteristics and historical performance.
    """
    
    def __init__(self, analytics_service):
        """Initialize with analytics service for performance data."""
        self.analytics = analytics_service
        
        # Preferences for when to use which approach
        self.default_preferences = {
            # Format: domain -> criteria
            "math": {
                "complexity_threshold": 7,  # Use CoT for problems with complexity above this
                "accuracy_threshold": 0.85  # Use CoT if CoD accuracy falls below this
            },
            "code": {
                "complexity_threshold": 8,
                "accuracy_threshold": 0.9
            },
            "physics": {
                "complexity_threshold": 7,
                "accuracy_threshold": 0.85
            },
            "chemistry": {
                "complexity_threshold": 7,
                "accuracy_threshold": 0.85
            },
            "biology": {
                "complexity_threshold": 6,
                "accuracy_threshold": 0.85
            },
            "logic": {
                "complexity_threshold": 6,
                "accuracy_threshold": 0.9
            },
            "puzzle": {
                "complexity_threshold": 7,
                "accuracy_threshold": 0.85
            },
            # Default for any domain
            "default": {
                "complexity_threshold": 6,
                "accuracy_threshold": 0.8
            }
        }
    
    async def select_approach(self, problem, domain, complexity_score=None):
        """
        Select whether to use CoD or CoT for this problem.
        
        Args:
            problem: The problem text
            domain: Problem domain (math, code, logic, etc.)
            complexity_score: Pre-computed complexity score (optional)
            
        Returns:
            Tuple of (approach, reason) where approach is "CoD" or "CoT"
        """
        # Get domain-specific preferences
        prefs = self.default_preferences.get(domain.lower(), self.default_preferences["default"])
        
        # If complexity score not provided, estimate it
        if complexity_score is None:
            estimator = ComplexityEstimator()
            complexity_score = await estimator.estimate_complexity(problem, domain)
        
        # Check if complexity exceeds threshold
        if complexity_score > prefs["complexity_threshold"]:
            return "CoT", f"Problem complexity ({complexity_score}) exceeds threshold ({prefs['complexity_threshold']})"
        
        # Check historical accuracy for this domain with CoD
        domain_performance = await self.analytics.get_performance_by_domain(domain)
        cod_accuracy = next((p["accuracy"] for p in domain_performance 
                           if p["approach"] == "CoD"), None)
        
        if cod_accuracy is not None and cod_accuracy < prefs["accuracy_threshold"]:
            return "CoT", f"Historical accuracy with CoD ({cod_accuracy:.2f}) below threshold ({prefs['accuracy_threshold']})"
        
        # Default to CoD for efficiency
        return "CoD", "Default to Chain-of-Draft for efficiency"
    
    def update_preferences(self, domain, complexity_threshold=None, accuracy_threshold=None):
        """Update preferences for a specific domain."""
        if domain not in self.default_preferences:
            self.default_preferences[domain] = self.default_preferences["default"].copy()
            
        if complexity_threshold is not None:
            self.default_preferences[domain]["complexity_threshold"] = complexity_threshold
            
        if accuracy_threshold is not None:
            self.default_preferences[domain]["accuracy_threshold"] = accuracy_threshold
    
    def get_preferences(self, domain=None):
        """Get current preferences for all domains or a specific domain."""
        if domain:
            return self.default_preferences.get(domain, self.default_preferences["default"])
        return self.default_preferences


def create_cod_prompt(problem, domain, max_words_per_step, examples=None):
    """
    Create a Chain of Draft prompt for the LLM.
    
    Args:
        problem: The problem to solve
        domain: Domain for context (math, logic, common-sense, etc.)
        max_words_per_step: Maximum words per reasoning step
        examples: Optional list of few-shot examples
        
    Returns:
        Dictionary with system and user prompts
    """
    system_prompt = f"""
    You are an expert problem solver using Chain of Draft reasoning.
    Think step by step, but only keep a minimum draft for each thinking step, 
    with {max_words_per_step} words at most per step.
    Return the answer at the end after '####'.
    """
    
    # Add domain-specific context
    if domain.lower() == "math":
        system_prompt += "\nUse mathematical notation to keep steps concise."
    elif domain.lower() == "code":
        system_prompt += "\nUse pseudocode or short code snippets when appropriate."
    elif domain.lower() == "physics":
        system_prompt += "\nUse equations and physical quantities with units."
        
    # Add examples if provided
    example_text = ""
    if examples:
        for example in examples:
            example_text += f"\nProblem: {example['problem']}\nSolution:\n{example['reasoning']}\n####\n{example['answer']}\n"
    
    user_prompt = f"Problem: {problem}"
    
    return {
        "system": system_prompt,
        "user": example_text + "\n" + user_prompt if example_text else user_prompt
    }


def create_cot_prompt(problem, domain, examples=None):
    """
    Create a Chain of Thought prompt for the LLM.
    
    Args:
        problem: The problem to solve
        domain: Domain for context (math, logic, common-sense, etc.)
        examples: Optional list of few-shot examples
        
    Returns:
        Dictionary with system and user prompts
    """
    system_prompt = """
    Think step by step to answer the following question.
    Return the answer at the end of the response after a separator ####.
    """
    
    # Add domain-specific context
    if domain.lower() == "math":
        system_prompt += "\nMake sure to show all mathematical operations clearly."
    elif domain.lower() == "code":
        system_prompt += "\nBe detailed about algorithms and implementation steps."
    elif domain.lower() == "physics":
        system_prompt += "\nExplain physical principles and equations in detail."
        
    # Add examples if provided
    example_text = ""
    if examples:
        for example in examples:
            example_text += f"\nProblem: {example['problem']}\nSolution:\n{example['reasoning']}\n####\n{example['answer']}\n"
    
    user_prompt = f"Problem: {problem}"
    
    return {
        "system": system_prompt,
        "user": example_text + "\n" + user_prompt if example_text else user_prompt
    }
