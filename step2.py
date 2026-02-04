import json
import os
import sys
import re

def split_and_restructure(input_dir, combined_chapter_file):
    """Split combined chapter file and restructure for separate classes"""
    
    # Construct paths
    chapters_dir = os.path.join(input_dir, "chapters")
    input_path = os.path.join(chapters_dir, combined_chapter_file)
    structure_path = os.path.join(input_dir, "structure.json")
    
    # Extract subject name from filename (e.g., "geometry" from "geometry-classes-6-7-8.json")
    subject_match = re.match(r'^(.+)-classes-6-7-8\.json$', combined_chapter_file)
    if not subject_match:
        print(f"Error: Filename should follow pattern: <subject>-classes-6-7-8.json")
        print(f"Got: {combined_chapter_file}")
        sys.exit(1)
    
    subject = subject_match.group(1)  # e.g., "geometry", "algebra", "mensuration"
    
    # Read combined chapter file
    try:
        with open(input_path, 'r') as f:
            combined_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in input file: {e}")
        sys.exit(1)
    
    # Read structure file
    try:
        with open(structure_path, 'r') as f:
            structure_data = json.load(f)
    except FileNotFoundError:
        print(f"Warning: Structure file not found, creating new one: {structure_path}")
        structure_data = {"courseId": f"math-{subject}-classes-6-7-8"}
    
    # Categorize subtopics by class
    class6_topics = []
    class7_topics = []
    class8_topics = []
    
    for topic in combined_data.get("subtopics", []):
        topic_id = topic["id"]
        if "class6" in topic_id or "grade6" in topic_id:
            class6_topics.append(topic)
        elif "class7" in topic_id or "grade7" in topic_id:
            class7_topics.append(topic)
        elif "class8" in topic_id or "grade8" in topic_id:
            class8_topics.append(topic)
    
    # Create class-specific chapter files
    class_chapters = []
    subject_titles = {}
    
    # Default generic descriptions if subject not in dictionary
    default_titles = {
        "class6": f"{subject.capitalize()} Explorer: Class 6 - Begin Your Journey! 📚✨",
        "class7": f"{subject.capitalize()} Explorer: Class 7 - Deep Dive into Concepts! 🌊📊",
        "class8": f"{subject.capitalize()} Explorer: Class 8 - Master Level Challenge! 🏆🔷"
    }
    
    # Class 6
    if class6_topics:
        class6_id = f"{subject}-classes-6"
        class6_title = subject_titles.get(subject, default_titles)["class6"]
        
        class6_data = {
            "id": class6_id,
            "title": class6_title,
            "description": f"Begin your {subject} adventure! Discover fundamental concepts through fun activities and real-world examples. Perfect for Class 6 students starting their journey.",
            "practice-quiz": True,
            "subtopics": class6_topics
        }
        
        class6_path = os.path.join(chapters_dir, f"{class6_id}.json")
        with open(class6_path, 'w') as f:
            json.dump(class6_data, f, indent=2)
        print(f"Created: {class6_path}")
        class_chapters.append((class6_id, class6_title, 1))
    
    # Class 7
    if class7_topics:
        class7_id = f"{subject}-classes-7"
        class7_title = subject_titles.get(subject, default_titles)["class7"]
        
        class7_data = {
            "id": class7_id,
            "title": class7_title,
            "practice-quiz": True,
            "description": f"Dive deeper into {subject}! Master intermediate concepts and explore practical applications. Designed for Class 7 students building on foundations.",
            "subtopics": class7_topics
        }
        
        class7_path = os.path.join(chapters_dir, f"{class7_id}.json")
        with open(class7_path, 'w') as f:
            json.dump(class7_data, f, indent=2)
        print(f"Created: {class7_path}")
        class_chapters.append((class7_id, class7_title, 2))
    
    # Class 8
    if class8_topics:
        class8_id = f"{subject}-classes-8"
        class8_title = subject_titles.get(subject, default_titles)["class8"]
        
        class8_data = {
            "id": class8_id,
            "title": class8_title,
            "practice-quiz": True,
            "description": f"Become a {subject} master! Explore advanced concepts and real-world applications. Perfect for Class 8 students preparing for higher-level mathematics.",
            "subtopics": class8_topics
        }
        
        class8_path = os.path.join(chapters_dir, f"{class8_id}.json")
        with open(class8_path, 'w') as f:
            json.dump(class8_data, f, indent=2)
        print(f"Created: {class8_path}")
        class_chapters.append((class8_id, class8_title, 3))
    
    # Update structure.json
    chapters = []
    
    for i, (chapter_id, chapter_title, order) in enumerate(class_chapters):
        # Find topics for this chapter
        chapter_topics = []
        if "classes-6" in chapter_id:
            topics_list = class6_topics
        elif "classes-7" in chapter_id:
            topics_list = class7_topics
        else:  # classes-8
            topics_list = class8_topics
        
        for j, topic in enumerate(topics_list):
            chapter_topics.append({
                "id": topic["id"],
                "title": topic["title"],
                "order": j + 1
            })
        
        chapters.append({
            "id": chapter_id,
            "title": chapter_title,
            "order": order,
            "topics": chapter_topics
        })
    
    # Create new structure
    course_id = structure_data.get("courseId", f"math-{subject}-classes-6-7-8")
    new_structure = {
        "courseId": course_id,
        "chapters": chapters
    }
    
    # Write updated structure
    with open(structure_path, 'w') as f:
        json.dump(new_structure, f, indent=2)
    
    print(f"\nUpdated: {structure_path}")
    
    # Backup original combined file (optional)
    backup_path = input_path.replace(".json", "_combined_backup.json")
    with open(backup_path, 'w') as f:
        json.dump(combined_data, f, indent=2)
    print(f"Backup of original created: {backup_path}")
    
    # Optionally, move or delete original file after successful split
    # Uncomment the next line if you want to delete the original
    # os.remove(input_path)
    # print(f"Removed original combined file: {input_path}")
    
    return {
        "subject": subject,
        "class6_count": len(class6_topics),
        "class7_count": len(class7_topics),
        "class8_count": len(class8_topics),
        "chapters_created": len(class_chapters)
    }

def validate_split(input_dir, subject):
    """Validate that the split was successful"""
    
    chapters_dir = os.path.join(input_dir, "chapters")
    structure_path = os.path.join(input_dir, "structure.json")
    
    print("\n" + "="*50)
    print("VALIDATION RESULTS:")
    print("="*50)
    
    # Check if all expected files exist
    expected_files = [
        f"{subject}-classes-6.json",
        f"{subject}-classes-7.json", 
        f"{subject}-classes-8.json"
    ]
    
    for filename in expected_files:
        filepath = os.path.join(chapters_dir, filename)
        if os.path.exists(filepath):
            print(f"✓ {filename} exists")
        else:
            print(f"⚠ {filename} not found (may not have topics for this class)")
    
    # Check structure file
    if os.path.exists(structure_path):
        with open(structure_path, 'r') as f:
            structure = json.load(f)
        
        print(f"\nstructure.json has {len(structure['chapters'])} chapters:")
        for chapter in structure['chapters']:
            print(f"  - {chapter['id']}: {len(chapter['topics'])} topics")
    else:
        print("✗ structure.json missing")

if __name__ == "__main__":
    # Check commandline arguments
    if len(sys.argv) != 3:
        print("Usage: python split_chapters.py <course_directory> <combined_chapter_file>")
        print("Example: python split_chapters.py math-geometry-classes-6-7-8 geometry-classes-6-7-8.json")
        print("Example: python split_chapters.py math-algebra-classes-6-7-8 algebra-classes-6-7-8.json")
        print("\nThis will:")
        print("  1. Split the combined chapter file into separate class files")
        print("  2. Create appropriate structure.json with separate chapters")
        print("  3. Keep original file as backup")
        sys.exit(1)
    
    input_dir = sys.argv[1]
    combined_file = sys.argv[2]
    
    # Ensure chapters directory exists
    chapters_dir = os.path.join(input_dir, "chapters")
    if not os.path.exists(chapters_dir):
        print(f"Error: Directory not found: {chapters_dir}")
        print(f"Please ensure the directory structure exists: {input_dir}/chapters/")
        sys.exit(1)
    
    # Check if input file exists
    input_path = os.path.join(chapters_dir, combined_file)
    if not os.path.exists(input_path):
        print(f"Error: Combined chapter file not found: {input_path}")
        sys.exit(1)
    
    # Perform split and restructuring
    result = split_and_restructure(input_dir, combined_file)
    
    # Validate
    validate_split(input_dir, result["subject"])
    
    # Summary
    print("\n" + "="*50)
    print("SPLIT COMPLETE!")
    print("="*50)
    print(f"Subject: {result['subject']}")
    print(f"Class 6 topics: {result['class6_count']}")
    print(f"Class 7 topics: {result['class7_count']}")
    print(f"Class 8 topics: {result['class8_count']}")
    print(f"Total chapters created: {result['chapters_created']}")
    print("\nNext steps:")
    print("  1. Review the generated chapter files in the 'chapters' directory")
    print("  2. Check structure.json for proper ordering")
    print("  3. Update any course metadata if needed")