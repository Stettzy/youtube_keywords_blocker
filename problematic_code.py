#!/usr/bin/env python3
"""
A sample Python file with intentional issues for the code review bot to detect.
"""
import os
import sys
import json
import random  # Unused import

# Global variable - often discouraged
GLOBAL_COUNTER = 0

def badly_named_function(a, b, c):  # Poor parameter names
    """This function has various issues."""
    global GLOBAL_COUNTER
    GLOBAL_COUNTER += 1
    
    # Unused variable
    unused_variable = "This variable is never used"
    
    # Magic number
    if a > 42:
        return b + c
    else:
        # No else needed here
        return b - c

# Too long line that exceeds typical PEP 8 length recommendations and will likely trigger a line length warning from pylint
very_long_variable_name_that_is_hard_to_read_and_definitely_exceeds_the_recommended_line_length = "This is a very long string that makes this line even longer"

class BadClass:  # Missing docstring
    def __init__(self, x):
        self.x = x
        # Attribute defined outside __init__
        
    def some_method(self):
        # 'self' not used - could be a static method
        print("This method doesn't use self")
        
    def another_method(self, param):
        self.y = param  # Attribute defined outside __init__
        
        # Redefining built-in
        id = 12345
        return id * self.y
    
    def complex_method(self, a, b, c, d, e):  # Too many parameters
        """This method is too complex."""
        result = 0
        # Overly complex code with deep nesting
        for i in range(a):
            for j in range(b):
                for k in range(c):
                    if i > j:
                        if j > k:
                            if i % 2 == 0:
                                if j % 2 == 0:
                                    result += i * j * k
        return result

# Security issue - hardcoded password
PASSWORD = "supersecretpassword123"

def authenticate(username, password):
    """Authenticate a user."""
    if password == PASSWORD:
        return True
    return False

# Inconsistent return statements
def inconsistent_returns(value):
    if value > 0:
        return "Positive"
    elif value < 0:
        return -1  # Should return a string for consistency
    # Missing return for value == 0

# Function that can raise exceptions but doesn't handle them
def risky_operation(filename):
    f = open(filename, 'r')  # No try/except or with statement
    content = f.read()
    f.close()
    return content

if __name__ == "__main__":
    # Unused variables in main block
    x = 10
    y = 20
    badly_named_function(1, 2, 3)
    
    # Create and use instance of BadClass
    obj = BadClass(5)
    obj.another_method(10)