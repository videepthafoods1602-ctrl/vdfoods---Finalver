import pandas as pd
import os

excel_path = r'd:\VDF_Foods\vdfoods---Finalver\Final_VideepthaProductssss.xlsx'

if not os.path.exists(excel_path):
    print(f"File not found: {excel_path}")
else:
    try:
        df = pd.read_excel(excel_path, sheet_name='All Products Mapping')
        print("COLUMNS_FOUND:")
        print(df.columns.tolist())
        print("\nFIRST_5_ROWS:")
        print(df.head())
    except Exception as e:
        print(f"ERROR_READING_EXCEL: {e}")
