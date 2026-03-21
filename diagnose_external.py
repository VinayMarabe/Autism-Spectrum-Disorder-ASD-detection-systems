import pandas as pd
import numpy as np
from pathlib import Path
import sys

DATA_DIR = Path("C:/Users/Lenovo/OneDrive/Desktop/ASD_Project/data")

# 1. Check metadata
meta_path = DATA_DIR / "missing_subjects_metadata_filled.csv"
print(f"Metadata path exists: {meta_path.exists()}")
meta = pd.read_csv(meta_path)
print(f"Columns: {meta.columns.tolist()}")
print(f"Shape: {meta.shape}")
print(f"First 5 FILE_NAME: {meta['FILE_NAME'].head(5).tolist()}")

# 2. Check NIfTI files
nii_dir = DATA_DIR / "all_nii"
print(f"\nall_nii dir exists: {nii_dir.exists()}")
if nii_dir.exists():
    sample_files = list(nii_dir.iterdir())[:5]
    print(f"Sample files in all_nii: {[f.name for f in sample_files]}")

existing = sum(1 for fn in meta["FILE_NAME"] if (nii_dir / str(fn)).exists())
missing = len(meta) - existing
print(f"NIfTI found: {existing}, missing: {missing}")

if missing > 0 and existing == 0:
    # Show first FILE_NAME and compare with actual files
    fn0 = meta["FILE_NAME"].iloc[0]
    print(f"\nExpected path: {nii_dir / str(fn0)}")
    # Try to find a close match
    actual_files = [f.name for f in nii_dir.iterdir()] if nii_dir.exists() else []
    fn0_str = str(fn0)
    matches = [f for f in actual_files if fn0_str[:10] in f or fn0_str[-10:] in f]
    print(f"Possible matches in all_nii: {matches[:5]}")

# 3. Check atlas paths
ATLASES_DIR = DATA_DIR / "atlases"
paths = {
    "AAL.nii.gz": ATLASES_DIR / "AAL3" / "AAL3v1_1mm.nii.gz",
    "AAL.nii": ATLASES_DIR / "AAL3" / "AAL3v1_1mm.nii",
    "Schaefer": ATLASES_DIR / "schaefer_2018" / "Schaefer2018_400Parcels_7Networks_order_FSLMNI152_2mm.nii.gz",
    "HarvardOxford": ATLASES_DIR / "HarvardOxford" / "HarvardOxford" / "HarvardOxford-cort-maxprob-thr25-2mm.nii.gz",
}
print("\nAtlas paths:")
for name, p in paths.items():
    print(f"  {name}: {p.exists()} -> {p}")

# 4. Check fmri_features directory
print("\nfmri_features:")
for atlas in ["AAL", "Schaefer", "HarvardOxford"]:
    d = DATA_DIR / "fmri_features" / atlas
    if d.exists():
        files = [f.name for f in d.iterdir()]
        print(f"  {atlas}: {files}")
    else:
        print(f"  {atlas}: DIR NOT FOUND")
