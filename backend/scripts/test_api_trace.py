import urllib.request
import urllib.error
import json

def test_endpoint(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode("utf-8")
            return resp.status, json.loads(data)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return e.code, err_body
    except Exception as e:
        return 0, str(e)

# 1. Test without token
status, body = test_endpoint("http://localhost:8000/api/verification/requests")
print(f"No token -> Status: {status}, Response: {body}")

# 2. Get admin token
login_data = json.dumps({"email": "admin@kivora.demo", "password": "Password123!"}).encode("utf-8")
req_login = urllib.request.Request("http://localhost:8000/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req_login) as resp:
    admin_auth = json.loads(resp.read().decode("utf-8"))
    admin_token = admin_auth.get("access_token")

print(f"Logged in admin, token obtained (len: {len(admin_token)})")

# 3. Test verification requests with admin token
status, body = test_endpoint("http://localhost:8000/api/verification/requests", admin_token)
print(f"Admin token -> Status: {status}, Record count: {len(body) if isinstance(body, list) else body}")

# 4. Test creators endpoint (public / no token needed)
status, body = test_endpoint("http://localhost:8000/api/creators")
print(f"Creators (no token) -> Status: {status}, Record count: {len(body) if isinstance(body, list) else body}")

# 5. Test creators endpoint with admin token
status, body = test_endpoint("http://localhost:8000/api/creators", admin_token)
print(f"Creators (admin token) -> Status: {status}, Record count: {len(body) if isinstance(body, list) else body}")
