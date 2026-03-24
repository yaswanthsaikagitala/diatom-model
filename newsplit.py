import os
import shutil

# ORIGINAL dataset (DO NOT TOUCH)
base_path = r"C:\Users\Yaswanth\Downloads\diatom-classification\UDE Diatoms in the Wild 2024-Subset_n100\UDE Diatoms in the Wild 2024-Subset_n100\Top10_classes"

# NEW dataset (will be created)
output_base = r"C:\Users\Yaswanth\Downloads\diatom-classification\dataset"

splits = ["train", "val", "test"]

# Create main folders
for split in splits:
    os.makedirs(os.path.join(output_base, split), exist_ok=True)

# Copy data
for class_name in os.listdir(base_path):
    class_path = os.path.join(base_path, class_name)

    if not os.path.isdir(class_path):
        continue

    for split in splits:
        src = os.path.join(class_path, split)
        dst = os.path.join(output_base, split, class_name)

        if not os.path.exists(src):
            continue

        os.makedirs(dst, exist_ok=True)

        for file in os.listdir(src):
            shutil.copy(
                os.path.join(src, file),
                os.path.join(dst, file)
            )

print("✅ Done! Original dataset untouched. New dataset ready.")