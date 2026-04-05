import pandas as pd
import os

path = r'd:\VDF_Foods\vdfoods---Finalver\Categories_Product_List.xlsx'
if os.path.exists(path):
    try:
        df = pd.read_excel(path, sheet_name='All Products Mapping')
        print("COLUMNS FOUND:", df.columns.tolist())
        print("FIRST 5 ROWS:")
        print(df.head(5).to_string())
    except Exception as e:
        print(f"ERROR reading sheet: {str(e)}")
        # If the sheet name is wrong, list all sheet names
        try:
             xl = pd.ExcelFile(path)
             print("AVAILBLE SHEETS:", xl.sheet_names)
        except Exception as e2:
             print(f"FATAL ERROR: {str(e2)}")
else:
    print(f"FILE NOT FOUND: {path}")
