import sys
import os

# Ensure backend root is on sys.path so modules (models, services, routes) import cleanly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
