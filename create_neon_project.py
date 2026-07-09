"""Create Neon PostgreSQL project."""
import json
import urllib.request
import urllib.error

TOKEN = "71KXWwl1BIYz6lrKXau1Lewr5yPy6KBZKcR-iwFD_Qs.nHM6RG2jipYacgOfSidMw5Jvdg3og9u4YZ-96Lnf1Iw"
ORG_ID = "org-frosty-brook-43841280"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json",
}

# List existing projects
req = urllib.request.Request("https://console.neon.tech/api/v2/projects", headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        projects = data.get("projects", [])
        print(f"Found {len(projects)} project(s):")
        for p in projects:
            print(f"  Name: {p['name']}, ID: {p['id']}")
        
        # Check if our project exists
        existing = [p for p in projects if p["name"] == "crm-hcp"]
        if existing:
            pid = existing[0]["id"]
            print(f"\nProject 'crm-hcp' already exists with ID: {pid}")
            
            # Get connection details
            detail = urllib.request.Request(
                f"https://console.neon.tech/api/v2/projects/{pid}",
                headers=headers,
            )
            with urllib.request.urlopen(detail) as dresp:
                proj_data = json.loads(dresp.read())
                proj = proj_data.get("project", {})
                branches = proj.get("branches", [])
                if branches:
                    bid = branches[0].get("id")
                    ep_url = f"https://console.neon.tech/api/v2/projects/{pid}/branches/{bid}/endpoints"
                    ep_req = urllib.request.Request(ep_url, headers=headers)
                    with urllib.request.urlopen(ep_req) as ep_resp:
                        eps = json.loads(ep_resp.read()).get("endpoints", [])
                        if eps:
                            host = eps[0].get("host")
                            db = proj.get("name", "crm-hcp")
                            uri = f"postgresql://neondb:neondb@{host}/{db}?sslmode=require"
                            print(f"Connection URI: {uri}")
                            print(f"\nRun this to update .env:")
                            print(f'  DATABASE_URL="{uri}"')
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"Error {e.code}: {body[:500]}")