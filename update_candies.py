import shutil
import os

print("Copying new category images to frontend assets...")

# Paths
assets_dir = r"d:\VDF_Foods\vdfoods---Finalver\website-frontend\public\assets\categories"

src_main = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_candies_main_1775286925153.png"
dst_main = os.path.join(assets_dir, "candies_main.png")

src_sub = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_candies_chocolates_sub_1775286940813.png"
dst_sub = os.path.join(assets_dir, "candies_chocolates_sub.png")

# Copy
shutil.copy(src_main, dst_main)
shutil.copy(src_sub, dst_sub)

print("✅ Images updated successfully! Frontend hot-reloading will catch them automatically.")
