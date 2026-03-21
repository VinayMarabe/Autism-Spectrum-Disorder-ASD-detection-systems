import pandas as pd
import numpy as np
from pathlib import Path
import traceback

DATA_DIR = Path("C:/Users/Lenovo/OneDrive/Desktop/ASD_Project/data")

# Check shapes of X_fc.npy for each atlas
atlas_order = ["AAL", "Schaefer", "HarvardOxford"]
X_dev_full = {}
for atlas in atlas_order:
    X = np.load(DATA_DIR / "fmri_features" / atlas / "X_fc.npy")
    X_dev_full[atlas] = X
    print(f"{atlas} X_fc.npy shape: {X.shape}")

expected_dims = {atlas: X_dev_full[atlas].shape[1] for atlas in atlas_order}
print("Expected dims:", expected_dims)

# Now try extracting one subject
from nilearn.maskers import NiftiLabelsMasker

ATLASES_DIR = DATA_DIR / "atlases"
ATLAS_NII_PATHS = {
    "AAL": ATLASES_DIR / "AAL3" / "AAL3v1_1mm.nii.gz",
    "Schaefer": ATLASES_DIR / "schaefer_2018" / "Schaefer2018_400Parcels_7Networks_order_FSLMNI152_2mm.nii.gz",
    "HarvardOxford": ATLASES_DIR / "HarvardOxford" / "HarvardOxford" / "HarvardOxford-cort-maxprob-thr25-2mm.nii.gz",
}

print("\nInitializing maskers...")
maskers = {}
for atlas, atlas_path in ATLAS_NII_PATHS.items():
    maskers[atlas] = NiftiLabelsMasker(
        labels_img=str(atlas_path),
        standardize=True,
        detrend=True,
        low_pass=0.1,
        high_pass=0.01,
        t_r=2.0,
        verbose=0,
    )
    print(f"  {atlas} masker created OK")

# Test on first subject
meta = pd.read_csv(DATA_DIR / "missing_subjects_metadata_filled.csv")
nii_dir = DATA_DIR / "all_nii"
first_fn = meta["FILE_NAME"].iloc[0]
nii_path = nii_dir / str(first_fn)
print(f"\nTesting subject: {nii_path}")

for atlas in atlas_order:
    try:
        ts = maskers[atlas].fit_transform(str(nii_path))
        print(f"  {atlas} ts shape: {ts.shape}")
        fc = np.corrcoef(ts.T)
        print(f"  {atlas} fc shape: {fc.shape}")
        vec = fc[np.triu_indices(fc.shape[0], k=1)]
        print(f"  {atlas} vec length: {vec.shape[0]} (expected: {expected_dims[atlas]})")
        if vec.shape[0] != expected_dims[atlas]:
            print(f"  MISMATCH! Got {vec.shape[0]} but expected {expected_dims[atlas]}")
    except Exception as e:
        print(f"  {atlas} EXCEPTION: {type(e).__name__}: {e}")
        traceback.print_exc()
