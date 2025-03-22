"""
Format enforcement module for the Chain of Draft MCP server.
Ensures reasoning steps adhere to the word limit.
"""

import re

class FormatEnforcer:
    """
    Enforces the Chain of Draft format by ensuring reasoning steps
    adhere to the specified word limit.
    """
    
    def __init__(self):
        """Initialize with patterns for detecting reasoning steps."""
        # Patterns for identifying different step formats
        self.step_pattern = re.compile(
            r'(\d+\.\s*|Step\s+\d+:|\n-\s+|\n\*\s+|•\s+|^\s*-\s+|^\s*\*\s+)',
            re.MULTILINE
        )
    
    def enforce_word_limit(self, reasoning, max_words_per_step):
        """
        Enforce word limit per reasoning step.
        
        Args:
            reasoning: The reasoning text to process
            max_words_per_step: Maximum number of words allowed per step
            
        Returns:
            Processed reasoning with enforced word limits
        """
        # Split into steps
        steps = self._split_into_steps(reasoning)
        
        # Process each step
        enforced_steps = []
        for step in steps:
            enforced_step = self._enforce_step(step, max_words_per_step)
            enforced_steps.append(enforced_step)
        
        # Combine back
        return "\n".join(enforced_steps)
    
    def _split_into_steps(self, reasoning):
        """Split reasoning text into individual steps."""
        # Try to detect step formatting
        if self.step_pattern.search(reasoning):
            # Extract steps with their markers
            parts = []
            current_part = ""
            lines = reasoning.split('\n')
            
            for line in lines:
                # If this is a new step, store the previous part and start a new one
                if self.step_pattern.match(line) or re.match(r'^\s*\d+\.', line):
                    if current_part:
                        parts.append(current_part)
                    current_part = line
                else:
                    # Otherwise add to current part
                    if current_part:
                        current_part += "\n" + line
                    else:
                        current_part = line
            
            # Add the last part
            if current_part:
                parts.append(current_part)
                
            return parts if parts else [reasoning]
        else:
            # If no clear step markers, split by lines
            return [line.strip() for line in reasoning.split('\n') if line.strip()]
    
    def _enforce_step(self, step, max_words):
        """Enforce word limit on a single reasoning step."""
        words = step.split()
        
        # If already within limit, return as is
        if len(words) <= max_words:
            return step
        
        # Extract step number/marker if present
        match = re.match(r'^(\d+\.\s*|Step\s+\d+:|\s*-\s+|\s*\*\s+|•\s+)', step)
        marker = match.group(0) if match else ""
        content = step[len(marker):].strip() if marker else step
        
        # Truncate content words
        content_words = content.split()
        truncated = " ".join(content_words[:max_words])
        
        # Reassemble with marker
        return f"{marker}{truncated}"
    
    def analyze_adherence(self, reasoning, max_words_per_step):
        """
        Analyze how well the reasoning adheres to word limits.
        
        Args:
            reasoning: The reasoning text to analyze
            max_words_per_step: Maximum number of words allowed per step
            
        Returns:
            Dictionary with adherence metrics
        """
        steps = self._split_into_steps(reasoning)
        
        # Count words in each step, excluding markers
        step_counts = []
        for step in steps:
            # Extract step number/marker if present
            match = re.match(r'^(\d+\.\s*|Step\s+\d+:|\s*-\s+|\s*\*\s+|•\s+)', step)
            marker = match.group(0) if match else ""
            content = step[len(marker):].strip() if marker else step
            
            # Count words in content
            step_counts.append(len(content.split()))
        
        # Calculate adherence metrics
        adherence = {
            "total_steps": len(steps),
            "steps_within_limit": sum(1 for count in step_counts if count <= max_words_per_step),
            "average_words_per_step": sum(step_counts) / len(steps) if steps else 0,
            "max_words_in_any_step": max(step_counts) if steps else 0,
            "adherence_rate": sum(1 for count in step_counts if count <= max_words_per_step) / len(steps) if steps else 1.0,
            "step_counts": step_counts
        }
        
        return adherence
    
    def format_to_numbered_steps(self, reasoning):
        """Format reasoning into consistently numbered steps."""
        steps = self._split_into_steps(reasoning)
        
        # Convert to numbered steps
        numbered_steps = []
        for i, step in enumerate(steps, 1):
            # Remove any existing markers
            match = re.match(r'^(\d+\.\s*|Step\s+\d+:|\s*-\s+|\s*\*\s+|•\s+)', step)
            if match:
                content = step[len(match.group(0)):].strip()
            else:
                content = step.strip()
                
            # Add numbered step format
            numbered_steps.append(f"{i}. {content}")
        
        return "\n".join(numbered_steps)
