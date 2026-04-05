import base64
import os

def img_to_base64(path):
    if not os.path.exists(path):
        return None
    with open(path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read())
        return f"data:image/png;base64,{encoded_string.decode('utf-8')}"

normal_path = r"C:\Users\hp\.gemini\antigravity\brain\a0347dae-e73e-4d4c-ab60-d70205ee4bcf\vds_store_boutique_png_1775208001129.png"
premium_path = r"C:\Users\hp\.gemini\antigravity\brain\a0347dae-e73e-4d4c-ab60-d70205ee4bcf\vds_premium_store_luxury_png_1775208014848.png"

normal_b64 = img_to_base64(normal_path)
premium_b64 = img_to_base64(premium_path)

with open("d:\\VDF_Foods\\vdfoods---Finalver\\website-frontend\\src\\shopImages.ts", "w", encoding="utf-8") as f:
    f.write(f"export const NORMAL_SHOP_B64 = '{normal_b64}';\n")
    f.write(f"export const PREMIUM_SHOP_B64 = '{premium_b64}';\n")
    
print("Successfully generated shopImages.ts with Base64 data!")
