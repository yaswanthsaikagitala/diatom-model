import os
from collections import Counter

# ✅ Update this path if needed (copy directly from File Explorer to avoid typos)
dataset_path = r"C:\Users\Yaswanth\Downloads\diatom-classification\UDE Diatoms in the Wild 2024-Subset_n100\UDE Diatoms in the Wild 2024-Subset_n100\train"

# Get all class folders
class_folders = [f for f in os.listdir(dataset_path) if os.path.isdir(os.path.join(dataset_path, f))]

# Count images in each folder
class_counts = {}
for folder in class_folders:
    folder_path = os.path.join(dataset_path, folder)
    images = [img for img in os.listdir(folder_path) if img.lower().endswith(('.png', '.jpg', '.jpeg'))]
    class_counts[folder] = len(images)

# Get top 10 classes
top10 = Counter(class_counts).most_common(10)

print("Top 10 classes with highest frequency:")
for cls, count in top10:
    print(f"{cls}: {count} images")
