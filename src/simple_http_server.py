#!/usr/bin/env python3
"""
Simple HTTP server that responds to /solve endpoint with a mock ChainOfDraftResponse.
This provides a simple implementation for testing purposes.
"""

import json
import http.server
import socketserver
import sys

# Mock response for the /solve endpoint
MOCK_RESPONSE = {
    "reasoning_steps": "Step 1: Identify the first 10 prime numbers.\nStep 2: Add them together.\nStep 3: Calculate the sum.",
    "final_answer": "The sum of the first 10 prime numbers (2, 3, 5, 7, 11, 13, 17, 19, 23, 29) is 129.",
    "approach": "CoD",
    "word_limit": 8,
    "token_count": 75,
    "execution_time_ms": 1050,
    "complexity": 3,
    "stats": {
        "word_limit": 8,
        "token_count": 75,
        "execution_time_ms": 1050,
        "complexity": 3
    }
}

# Create custom request handler
class ChainOfDraftHTTPHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/solve':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            print(f"Received request: {post_data.decode('utf-8')}")
            
            # Send a successful response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(MOCK_RESPONSE).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))
    
    def do_GET(self):
        if self.path == '/health':
            # Health check endpoint
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    PORT = 3000
    
    print(f"Starting HTTP server on http://localhost:{PORT}")
    
    # Create and start the server
    with socketserver.TCPServer(("", PORT), ChainOfDraftHTTPHandler) as server:
        print(f"Server running on port {PORT}")
        server.serve_forever() 