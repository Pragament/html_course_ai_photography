import os
import json
import sys

def create_project_structure(folder_name, second_name):
    """
    Create a folder structure with the provided names.
    
    Args:
        folder_name: Name for the main folder
        second_name: Name for the JSON file in the chapters folder
    """
    
    # Create main folder
    try:
        os.makedirs(folder_name, exist_ok=True)
        print(f"Created folder: {folder_name}")
    except Exception as e:
        print(f"Error creating folder {folder_name}: {e}")
        return
    
    # Create structure.json in main folder
    structure_data = {
        "project_name": folder_name,
        "created_with": "Python script",
        "chapters_folder": "chapters"
    }
    
    structure_file = os.path.join(folder_name, "structure.json")
    try:
        with open(structure_file, 'w', encoding='utf-8') as f:
            json.dump(structure_data, f, indent=2, ensure_ascii=False)
        print(f"Created file: {structure_file}")
    except Exception as e:
        print(f"Error creating structure.json: {e}")
        return
    
    # Create chapters folder
    chapters_folder = os.path.join(folder_name, "chapters")
    try:
        os.makedirs(chapters_folder, exist_ok=True)
        print(f"Created folder: {chapters_folder}")
    except Exception as e:
        print(f"Error creating chapters folder: {e}")
        return
    
    # Create JSON file in chapters folder with second name
    chapter_data = {
        "chapter_name": second_name,
        "content": "",
        "metadata": {
            "created": True
        }
    }
    
    chapter_file = os.path.join(chapters_folder, f"{second_name}.json")
    try:
        with open(chapter_file, 'w', encoding='utf-8') as f:
            json.dump(chapter_data, f, indent=2, ensure_ascii=False)
        print(f"Created file: {chapter_file}")
    except Exception as e:
        print(f"Error creating {second_name}.json: {e}")
        return
    
    print(f"\nProject structure created successfully!")
    print(f"Location: {os.path.abspath(folder_name)}")

def main():
    # Get parameters from command line arguments
    if len(sys.argv) < 3:
        print("Usage: python script.py <folder_name> <second_name>")
        print("\nExample: python script.py my_project chapter1")
        sys.exit(1)
    
    folder_name = sys.argv[1]
    second_name = sys.argv[2]
    
    create_project_structure(folder_name, second_name)

if __name__ == "__main__":
    main()