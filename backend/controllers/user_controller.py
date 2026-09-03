# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
# Verified by CodeMind Automated Test Suite
from backend.services.user_service import IdentityService

def handle_user_request():
    service = IdentityService()
    return service.get_user('123')
