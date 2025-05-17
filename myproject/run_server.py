import os
import sys
import subprocess
import time

def run_command(command):
    process = subprocess.Popen(command, shell=True)
    process.wait()
    return process.returncode

def main():
    # Apply migrations
    print("Applying migrations...")
    if run_command("python manage.py migrate") != 0:
        print("Error applying migrations")
        sys.exit(1)
    
    # Create superuser
    print("Creating superuser...")
    if run_command("python manage.py create_superuser") != 0:
        print("Error creating superuser")
        sys.exit(1)
    
    # Start server
    print("Starting server...")
    print("Server will be available at http://0.0.0.0:8000")
    print("Superuser credentials:")
    print("Username: admin")
    print("Password: admin")
    print("\nPress Ctrl+C to stop the server")
    
    # Run server
    run_command("python manage.py runserver 0.0.0.0:8000")

if __name__ == "__main__":
    main() 