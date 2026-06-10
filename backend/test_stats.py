import sys
import os

# Add the directory to sys.path so we can import app and db
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from utils.dashboard_stats import get_dashboard_full_stats

with app.app_context():
    try:
        stats = get_dashboard_full_stats()
        print("Success")
    except Exception as e:
        import traceback
        traceback.print_exc()
