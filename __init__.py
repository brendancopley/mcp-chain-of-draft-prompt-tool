"""
Chain of Draft (CoD) MCP Server.

This package implements the Chain of Draft reasoning approach
as described in the paper "Chain of Draft: Thinking Faster by Writing Less".
"""

from .analytics import AnalyticsService
from .complexity import ComplexityEstimator
from .examples import ExampleDatabase
from .format import FormatEnforcer
from .reasoning import ReasoningSelector, create_cod_prompt, create_cot_prompt
from .client import ChainOfDraftClient

__version__ = "0.1.0"
