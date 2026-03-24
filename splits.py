import os
import shutil

# ✅ Dataset root (contains train/val/test)
base_path = r"C:\Users\Yaswanth\Downloads\diatom-classification\UDE Diatoms in the Wild 2024-Subset_n100\UDE Diatoms in the Wild 2024-Subset_n100"

top_classes = [
    "Achnanthidium minutissimum",
    "Discostella pseudostelligera",
    "Amphora pediculus",
    "Achnanthidium jackii",
    "Navicula gregaria",
    "Navicula lanceolata",
    "Nitzschia soratensis",
    "Planothidium lanceolatum",
    "Nitzschia dissipata",
    "Cocconeis placentula"
]

splits = ["train", "val", "test"]

# ✅ Destination folder
output_path = os.path.join(base_path, "Top10_classes")
os.makedirs(output_path, exist_ok=True)

for split in splits:
    split_path = os.path.join(base_path, split)
    print(f"Checking split: {split_path}")
    for cls in top_classes:
        src_folder = os.path.join(split_path, cls)
        if os.path.exists(src_folder):
            print(f"  Found class folder: {src_folder}")
            # Create destination subfolder for this class and split
            dest_folder = os.path.join(output_path, cls, split)
            os.makedirs(dest_folder, exist_ok=True)

            for img in os.listdir(src_folder):
                if img.lower().endswith(('.png', '.jpg', '.jpeg')):
                    src_file = os.path.join(src_folder, img)
                    dest_file = os.path.join(dest_folder, img)
                    shutil.copy(src_file, dest_file)
        else:
            print(f"  ❌ Class folder not found: {src_folder}")

print("✅ Copy complete. Check:", output_path)