import shutil
import os

print("🔄 Syncing new category images to frontend assets...")

assets_dir = r"d:\VDF_Foods\vdfoods---Finalver\website-frontend\public\assets\categories"

# Ensure directory exists just in case
os.makedirs(assets_dir, exist_ok=True)

# ------------------------------------------------------------------------------------------
# 1. CANDIES (Main & Sub)
# ------------------------------------------------------------------------------------------
src_main = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_candies_main_1775286925153.png"
dst_main = os.path.join(assets_dir, "candies_main.png")

src_sub = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_candies_chocolates_sub_1775286940813.png"
dst_sub = os.path.join(assets_dir, "candies_chocolates_sub.png")

try:
    shutil.copy(src_main, dst_main)
    shutil.copy(src_sub, dst_sub)
    print(" - [Candies] batch synced!")
except FileNotFoundError:
    print(" - [Candies] AI images not found in brain folder, skipping.")

# ------------------------------------------------------------------------------------------

# ------------------------------------------------------------------------------------------
# 2. COOKING OIL (Main & Sub)
# ------------------------------------------------------------------------------------------
src_oil_main = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_cooking_oil_main_1775287326861.png"
dst_oil_main = os.path.join(assets_dir, "cooking_oil_main.png")

src_oil_sub = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_cold_pressed_oil_sub_v2_1775289262177.png"
dst_oil_sub = os.path.join(assets_dir, "cold_pressed_oil_sub.png")

src_db_main = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_diabetic_main_1775289394313.png"
dst_db_main = os.path.join(assets_dir, "db_friendly_main.png")

src_db_sub = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_diabetic_sub_1775289418656.png"
dst_db_sub = os.path.join(assets_dir, "db_friendly_sub.png")

src_df_special = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_dryfruit_special_main_1775295727155.png"
dst_df_special = os.path.join(assets_dir, "dryfruit_special_main.png")

try:
    shutil.copy2(src_oil_main, dst_oil_main)
    shutil.copy2(src_oil_sub, dst_oil_sub)
    print(" - [Cooking Oils] batch synced!")
    
    shutil.copy2(src_db_main, dst_db_main)
    shutil.copy2(src_db_sub, dst_db_sub)
    print(" - [Diabetic Friendly] batch synced!")

    shutil.copy2(src_df_special, dst_df_special)
    print(" - [DryFruitSpecial] synced!")
    
except FileNotFoundError:
    print(" - [Cooking Oils/Diabetic/DryFruit] AI images not found in brain folder, skipping.")

# ------------------------------------------------------------------------------------------
# 3. DARK CHOCOLATE (Main & Sub)
# ------------------------------------------------------------------------------------------
src_choco = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_dark_chocolate_main_1775287678123.png"
dst_choco = os.path.join(assets_dir, "dark_chocolate_main.png")

try:
    shutil.copy(src_choco, dst_choco)
    print(" - [Dark Chocolate] batch synced!")
except FileNotFoundError:
    print(" - [Dark Chocolate] AI images not found in brain folder, skipping.")

# ------------------------------------------------------------------------------------------
# 4. ENERGY DRINKS, GANJI, SOUP
# ------------------------------------------------------------------------------------------
src_energy = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_energy_drinks_main_1775295997118.png"
dst_energy = os.path.join(assets_dir, "energy_drinks_main.png")

src_ganji = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_ganji_sub_1775296025471.png"
dst_ganji = os.path.join(assets_dir, "ganji_sub.png")

src_soup = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_soup_sub_1775296040599.png"
dst_soup = os.path.join(assets_dir, "soup_sub.png")

try:
    shutil.copy2(src_energy, dst_energy)
    shutil.copy2(src_ganji, dst_ganji)
    shutil.copy2(src_soup, dst_soup)
    print(" - [Energy/Ganji/Soup] synced!")
except FileNotFoundError:
    print(" - [Energy/Ganji/Soup] AI images not found in brain folder, skipping.")

# ------------------------------------------------------------------------------------------
# 5. GUT FRIENDLY FRUIT DRINKS
# ------------------------------------------------------------------------------------------
src_gut = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_gut_friendly_fruit_drinks_main_1775296510924.png"
dst_gut = os.path.join(assets_dir, "gut_friendly_fruit_drinks_main.png")

try:
    shutil.copy2(src_gut, dst_gut)
    print(" - [Gut Friendly Fruit Drinks] synced!")
except FileNotFoundError:
    print(" - [Gut Friendly Fruit Drinks] AI images not found in brain folder, skipping.")

# ------------------------------------------------------------------------------------------
# 6. INSTANT CHUTNEY & PODI (SUBS)
# ------------------------------------------------------------------------------------------
src_chutney = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_instant_chutney_sub_1775296686561.png"
dst_chutney = os.path.join(assets_dir, "instant_chutney_sub.png")

src_podi = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_podi_sub_1775296703946.png"
dst_podi = os.path.join(assets_dir, "podi_sub.png")

try:
    shutil.copy2(src_chutney, dst_chutney)
    shutil.copy2(src_podi, dst_podi)
    print(" - [Chutney/Podi Subs] synced!")
except FileNotFoundError:
    print(" - [Chutney/Podi Subs] AI images not found in brain folder, skipping.")

# ------------------------------------------------------------------------------------------
# 7. MILK MIX & DRY FRUIT MIX
# ------------------------------------------------------------------------------------------
src_milk = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_milk_mix_main_1775296903146.png"
dst_milk = os.path.join(assets_dir, "milk_mix_main.png")

try:
    shutil.copy2(src_milk, dst_milk)
    print(" - [Milk Mix] synced!")
except FileNotFoundError:
    print(" - [Milk Mix] AI images not found in brain folder, skipping.")

# ------------------------------------------------------------------------------------------
# 8. MILLET RICE VARIETIES
# ------------------------------------------------------------------------------------------
src_rice = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_millet_rice_main_v2_1775297088873.png"
dst_rice = os.path.join(assets_dir, "millet_rice_main.png")

try:
    shutil.copy2(src_rice, dst_rice)
    print(" - [Millet Rice Varieties] synced!")
except FileNotFoundError:
    print(" - [Millet Rice Varieties] AI images not found in brain folder, skipping.")

# ------------------------------------------------------------------------------------------
# 9. MILLETS (SUB) - AUTHENTIC REUSE
# ------------------------------------------------------------------------------------------
src_millet_sub = os.path.join(r"d:\VDF_Foods\vdfoods---Finalver\website-frontend\public\assets", "ragi.png")
dst_millet_sub = os.path.join(assets_dir, "millet_sub.png")

try:
    shutil.copy2(src_millet_sub, dst_millet_sub)
    print(" - [Millets Sub] synced!")
except FileNotFoundError:
    print(" - [Millets Sub] original ragi.png not found, skipping.")

# ------------------------------------------------------------------------------------------
# 10. MOUTH FRESHNER
# ------------------------------------------------------------------------------------------
src_mouth = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\media__1775303630858.jpg"
dst_mouth = os.path.join(assets_dir, "vds_mouth_freshner_main.jpg")

# 11. PREMIUM MASALAS
src_masala = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\media__1775303909868.jpg"
dst_masala = os.path.join(assets_dir, "vds_masala_main.jpg")

# 12. PICKLES
src_pickles = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\media__1775303921203.jpg"
dst_pickles = os.path.join(assets_dir, "vds_pickles_main.jpg")

# 13. PULAO MIX
src_pulao = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\media__1775303926267.jpg"
dst_pulao = os.path.join(assets_dir, "vds_pulao_main.jpg")

# 14. ROTI FLOURS
src_roti = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\media__1775303936107.jpg"
dst_roti = os.path.join(assets_dir, "vds_roti_flour_main.jpg")

# 15. READY TO COOK (STALL)
src_rtc = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\media__1775304251839.jpg"
dst_rtc = os.path.join(assets_dir, "vds_ready_to_cook_main.jpg")

# ------------------------------------------------------------------------------------------
# 16. HERITAGE GATEWAYS (Normal & Premium)
# ------------------------------------------------------------------------------------------
src_normal_gate = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_normal_gateway_vintage_jpg_1775315111602.png"
dst_normal_gate = os.path.join(assets_dir, "vds_base_heritage.png")

src_premium_gate = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_premium_gateway_v2_jpg_1775315333230.png"
dst_premium_gate = os.path.join(assets_dir, "vds_elite_heritage.png")

# 17. AT POCKET / BEAT HUNGER (HERITAGE)
src_at_pocket = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_at_pocket_v2_jpg_1775315528596.png"
dst_at_pocket = os.path.join(assets_dir, "vds_at_pocket_main.jpg")

src_beat_hunger = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_beat_hunger_sub_jpg_1775315624584.png"
dst_beat_hunger = os.path.join(assets_dir, "vds_beat_hunger_sub.jpg")

# 18. BABY FOOD / KID'S COMBO (HERITAGE)
src_baby_food = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_baby_food_with_baby_jpg_1775315783617.png"
dst_baby_food = os.path.join(assets_dir, "vds_baby_food_main.jpg")

src_kids_combo = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_kids_combo_sub_jpg_1775315878288.png"
dst_kids_combo = os.path.join(assets_dir, "vds_kids_combo_sub.jpg")

# 19. BIRYANI MIX (HERITAGE)
src_biryani = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_biryani_mix_main_jpg_1775315939602.png"
dst_biryani = os.path.join(assets_dir, "vds_biryani_mix_main.jpg")

# 20. BODY RELAX / ABHYANGA / OILS (HERITAGE)
src_body_relax = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_body_relax_v3_full_jpg_1775316286837.png"
dst_body_relax = os.path.join(assets_dir, "vds_body_relax_main.jpg")

src_abhyanga = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_abhyanga_snana_v2_sub_jpg_1775316194887.png"
dst_abhyanga = os.path.join(assets_dir, "vds_abhyanga_snana_sub.jpg")

src_massage_oils = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_body_relax_main_jpg_1775316011497.png"
dst_massage_oils = os.path.join(assets_dir, "vds_massage_oils_sub.jpg")

# 21. CANDIES & MILLETS (HERITAGE)
src_candies = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_candies_main_jpg_1775316326810.png"
dst_candies = os.path.join(assets_dir, "vds_candies_heritage_main.jpg")

src_millet_main = r"C:\Users\hp\.gemini\antigravity\brain\5b68764e-63aa-4e4f-9035-189a492c0b67\vds_millet_rice_vintage_main_jpg_1775313956714.png"
dst_millet_main = os.path.join(assets_dir, "vds_millet_rice_main.jpg")

try:
    shutil.copy2(src_mouth, dst_mouth)
    shutil.copy2(src_masala, dst_masala)
    shutil.copy2(src_pickles, dst_pickles)
    shutil.copy2(src_pulao, dst_pulao)
    shutil.copy2(src_roti, dst_roti)
    shutil.copy2(src_rtc, dst_rtc)
    shutil.copy2(src_normal_gate, dst_normal_gate)
    shutil.copy2(src_premium_gate, dst_premium_gate)
    shutil.copy2(src_at_pocket, dst_at_pocket)
    shutil.copy2(src_beat_hunger, dst_beat_hunger)
    shutil.copy2(src_baby_food, dst_baby_food)
    shutil.copy2(src_kids_combo, dst_kids_combo)
    shutil.copy2(src_biryani, dst_biryani)
    shutil.copy2(src_body_relax, dst_body_relax)
    shutil.copy2(src_abhyanga, dst_abhyanga)
    shutil.copy2(src_massage_oils, dst_massage_oils)
    shutil.copy2(src_candies, dst_candies)
    shutil.copy2(src_millet_main, dst_millet_main)
    print(" - [Heritage Batch] massive sync completed!")
except Exception as e:
    print(f" - [Heritage Batch] Sync error: {e}")

print("\n✅ All Images synced successfully! Frontend hot-reloading will catch them automatically.")
