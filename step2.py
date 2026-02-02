import json
import os
import sys

def restructure_json(input_dir, output_filename):
    """Restructure JSON without modifying content"""
    
    # Construct paths
    input_path = f"{input_dir}/chapters/{output_filename}.json"
    output_path = f"{input_dir}/structure.json"
    
    # Read input
    try:
        with open(input_path, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in input file: {e}")
        sys.exit(1)
    
    # Create output structure (topic names remain exactly as in input)
    output = {
        "courseId": f"math-{data['id']}",
        "chapters": [{
            "id": data["id"],
            "title": data["title"],
            "order": 1,
            "topics": [
                {
                    "id": topic["id"],
                    "title": topic["title"],  # No modification
                    "order": i + 1
                }
                for i, topic in enumerate(data["subtopics"])
            ]
        }]
    }
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Write output
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"Created: {output_path}")
    print("Topic titles preserved exactly as in input file.")

if __name__ == "__main__":
    # Check commandline arguments
    if len(sys.argv) != 3:
        print("Usage: python fix.py <input_directory> <output_filename_without_extension>")
        print("Example: python fix.py math-mensuration-classes-6-7-8 mensuration-classes-6-7-8")
        sys.exit(1)
    
    input_dir = sys.argv[1]
    output_filename = sys.argv[2]
    
    restructure_json(input_dir, output_filename)