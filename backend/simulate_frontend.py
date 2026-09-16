import requests

base_url = "http://127.0.0.1:8000"

# Register a student
print("Registering...")
res = requests.post(f"{base_url}/auth/register", json={
    "email": "teststudent_api2@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "Student",
    "role": "student"
})

# Login
print("Logging in...")
res = requests.post(f"{base_url}/auth/login", data={
    "username": "teststudent_api2@example.com",
    "password": "password123"
})
token = res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

# Get scenarios
print("Getting scenarios...")
res = requests.get(f"{base_url}/scenario/", headers=headers)
scenarios = res.json()
print("Scenarios:", scenarios)

if scenarios:
    s_id = scenarios[0]["id"]
    print(f"Starting attempt for scenario id: {s_id}")
    res = requests.post(f"{base_url}/chat/start", headers=headers, json={"scenario_id": s_id})
    print("Start attempt response:", res.status_code, res.text)
else:
    print("No scenarios found")
