"""
Script to create a Neon PostgreSQL project and update the backend .env file.
"""
import json
import os
import urllib.request
import urllib.error

# Neon API configuration
ACCESS_TOKEN = "71KXWwl1BIYz6lrKXau1Lewr5yPy6KBZKcR-iwFD_Qs.nHM6RG2jipYacgOfSidMw5Jvdg3og9u4YZ-96Lnf1Iw"
API_BASE = "https://console.neon.tech/api/v2"
PROJECT_NAME = "crm-hcp"
REGION = "aws-ap-south-1"
ORG_ID = "org-frosty-brook-43841280"
ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", ".env")


def make_api_request(method, path, data=None):
    """Make a request to the Neon API."""
    url = f"{API_BASE}{path}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Accept": "application/json",
    }
    
    if ORG_ID:
        headers["Neon-Org-Id"] = ORG_ID
    
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"API Error {e.code}: {error_body}")
        raise


def create_project():
    """Create a new Neon project."""
    print(f"Creating Neon project '{PROJECT_NAME}' in {REGION}...")
    
    payload = {
        "project": {
            "name": PROJECT_NAME,
            "region_id": REGION,
        }
    }
    
    result = make_api_request("POST", "/projects", payload)
    project = result.get("project", {})
    connection_uris = result.get("connection_uris", [])
    
    project_id = project.get("id")
    print(f"Project created! ID: {project_id}")
    
    conn_string = None
    if connection_uris:
        conn_string = connection_uris[0].get("connection_uri")
    
    return project_id, conn_string


def get_connection_string(project_id):
    """Get the connection string for an existing project."""
    # Get project details with branches and endpoints
    result = make_api_request("GET", f"/projects/{project_id}")
    project = result.get("project", {})
    
    # Check connection_uris from the project creation response
    connection_uris = result.get("connection_uris", [])
    if connection_uris:
        uri = connection_uris[0].get("connection_uri")
        if uri:
            # Add sslmode=require for Neon
            if "sslmode" not in uri:
                uri += "?sslmode=require"
            return uri
    
    # Fallback: construct from database and host
    database = project.get("name", PROJECT_NAME)
    branches = project.get("branches", [])
    if branches:
        branch_id = branches[0].get("id")
        endpoints_result = make_api_request(
            "GET", f"/projects/{project_id}/branches/{branch_id}/endpoints"
        )
        endpoints = endpoints_result.get("endpoints", [])
        if endpoints:
            host = endpoints[0].get("host")
            return f"postgresql://neondb:neondb@{host}/{database}?sslmode=require"
    
    return None


def update_env_file(conn_string):
    """Update the backend .env file with the Neon connection string."""
    if not os.path.exists(ENV_FILE):
        print(f"Error: {ENV_FILE} not found!")
        return False
    
    with open(ENV_FILE, "r") as f:
        content = f.read()
    
    # Replace the DATABASE_URL
    import re
    if "?" in conn_string:
        new_content = re.sub(
            r"DATABASE_URL=.*",
            f"DATABASE_URL={conn_string}",
            content
        )
        # Also update individual connection params
        new_content = re.sub(
            r"DATABASE_HOST=.*",
            f"DATABASE_HOST={conn_string.split('@')[1].split(':')[0].split('?')[0]}",
            new_content
        )
        new_content = re.sub(
            r"DATABASE_USER=.*",
            "DATABASE_USER=neondb",
            new_content
        )
        new_content = re.sub(
            r"DATABASE_PASSWORD=.*",
            "DATABASE_PASSWORD=neondb",
            new_content
        )
    else:
        new_content = re.sub(
            r"DATABASE_URL=.*",
            f"DATABASE_URL={conn_string}",
            content
        )
    
    with open(ENV_FILE, "w") as f:
        f.write(new_content)
    
    print(f"✅ Updated {ENV_FILE} with Neon connection string!")
    return True


def main():
    """Main setup function."""
    print("=" * 60)
    print("Neon PostgreSQL Database Setup")
    print(f"Organization: {ORG_ID}")
    print("=" * 60)
    
    # Check if project already exists
    try:
        projects_result = make_api_request("GET", "/projects")
        existing_projects = projects_result.get("projects", [])
        
        for proj in existing_projects:
            if proj.get("name") == PROJECT_NAME:
                print(f"Project '{PROJECT_NAME}' already exists!")
                project_id = proj.get("id")
                conn_string = get_connection_string(project_id)
                if conn_string:
                    update_env_file(conn_string)
                    print(f"\n✅ Neon database ready!")
                    print(f"   Project ID: {project_id}")
                    print(f"   Connection: {conn_string[:50]}...")
                else:
                    print(f"⚠️  Could not retrieve connection string")
                return
    except Exception as e:
        print(f"Error checking projects: {e}")
    
    # Create new project
    try:
        project_id, conn_string = create_project()
        
        if not conn_string:
            print("Fetching connection string from project details...")
            conn_string = get_connection_string(project_id)
        
        if conn_string:
            update_env_file(conn_string)
            print(f"\n✅ Neon database created and configured!")
            print(f"   Project ID: {project_id}")
            print(f"   Dashboard: https://console.neon.tech/projects/{project_id}")
        else:
            print(f"\n⚠️  Project created but couldn't retrieve connection string.")
            print(f"   Project ID: {project_id}")
            print("   Please get the connection string from Neon Console.")
    
    except Exception as e:
        print(f"\n❌ Failed: {e}")
        print("\nTo set up manually:")
        print("1. Go to https://console.neon.tech")
        print("2. Create a new project called 'crm-hcp'")
        print("3. Copy the connection string")
        print("4. Update DATABASE_URL in backend/.env")


if __name__ == "__main__":
    main()