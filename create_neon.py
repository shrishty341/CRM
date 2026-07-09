"""Create Neon PostgreSQL project and output connection string."""
import json
import urllib.request
import urllib.error

TOKEN = "71KXWwl1BIYz6lrKXau1Lewr5yPy6KBZKcR-iwFD_Qs.nHM6RG2jipYacgOfSidMw5Jvdg3og9u4YZ-96Lnf1Iw"
ORG_ID = "org-frosty-brook-43841280"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json",
    "Neon-Org-Id": ORG_ID,
}

# Create project
payload = json.dumps({"project": {"name": "crm-hcp", "region_id": "aws-ap-south-1"}}).encode()
req = urllib.request.Request(
    "https://console.neon.tech/api/v2/projects",
    data=payload,
    headers=headers,
    method="POST",
)

try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        project = result.get("project", {})
        conn_uris = result.get("connection_uris", [])
        pid = project.get("id")
        print(f"PROJECT_ID={pid}")
        if conn_uris:
            uri = conn_uris[0].get("connection_uri", "")
            if uri and "sslmode" not in uri:
                uri += "?sslmode=require"
            print(f"DATABASE_URL={uri}")
        else:
            print("ERROR: No connection URI returned")
            print(f"FULL_RESPONSE={json.dumps(result, indent=2)[:1000]}")
except urllib.error.HTTPError as e:
    error_body = e.read().decode()
    print(f"ERROR: HTTP {e.code}: {error_body}")
    
    # If it already exists, try to list and find it
    if e.code == 409 or "already exists" in error_body.lower():
        print("Project may already exist. Trying to list...")
        list_req = urllib.request.Request(
            "https://console.neon.tech/api/v2/projects",
            headers=headers,
        )
        with urllib.request.urlopen(list_req) as list_resp:
            projects = json.loads(list_resp.read()).get("projects", [])
            for p in projects:
                if p.get("name") == "crm-hcp":
                    pid = p.get("id")
                    print(f"PROJECT_ID={pid}")
                    # Get connection details
                    detail_req = urllib.request.Request(
                        f"https://console.neon.tech/api/v2/projects/{pid}",
                        headers=headers,
                    )
                    with urllib.request.urlopen(detail_req) as detail_resp:
                        detail = json.loads(detail_resp.read())
                        proj = detail.get("project", {})
                        branches = proj.get("branches", [])
                        if branches:
                            bid = branches[0].get("id")
                            ep_req = urllib.request.Request(
                                f"https://console.neon.tech/api/v2/projects/{pid}/branches/{bid}/endpoints",
                                headers=headers,
                            )
                            with urllib.request.urlopen(ep_req) as ep_resp:
                                eps = json.loads(ep_resp.read()).get("endpoints", [])
                                if eps:
                                    host = eps[0].get("host")
                                    db = proj.get("name", "crm-hcp")
                                    uri = f"postgresql://neondb:neondb@{host}/{db}?sslmode=require"
                                    print(f"DATABASE_URL={uri}")
                    break