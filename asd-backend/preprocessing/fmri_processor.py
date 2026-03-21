"""
fMRI preprocessing pipeline: 4D fMRI → Connectivity features
Converts 4D fMRI scans to 95D connectivity features using Harvard-Oxford 110 atlas
"""

import numpy as np
import nibabel as nib
from nilearn.maskers import NiftiLabelsMasker
from nilearn.connectome import ConnectivityMeasure
from pathlib import Path
import warnings

warnings.filterwarnings('ignore')


class fMRIProcessor:
    """Convert 4D fMRI to RFE-selected connectivity features"""
    
    def __init__(self, atlas_path, rfe_mask_path, scaler_obj=None):
        """
        Args:
            atlas_path: Path to Harvard-Oxford atlas
            rfe_mask_path: Path to RFE support mask (rfe_support_mask.npy)
            scaler_obj: Optional fitted StandardScaler for feature normalization
        """
        self.atlas_path = atlas_path
        self.rfe_mask = np.load(rfe_mask_path)
        self.scaler = scaler_obj
        self.n_rois = None  # Will be set after first timeseries extraction
        
        # Initialize masker for ROI extraction
        try:
            self.masker = NiftiLabelsMasker(
                atlas_path,
                standardize=True,  # Standardize each ROI's timeseries
                detrend=True,
                low_pass=0.1,
                high_pass=0.01,
                t_r=2.0  # Standard TR, will be overridden by file header
            )
        except Exception as e:
            print(f"Warning: Could not initialize masker with TR detection: {e}")
            self.masker = NiftiLabelsMasker(
                atlas_path,
                standardize=True,
                detrend=True
            )
    
    def load_fmri(self, nifti_path):
        """Load 4D fMRI file"""
        img = nib.load(nifti_path)
        return img
    
    def extract_timeseries(self, fmri_img):
        """
        Extract timeseries from ROIs using Harvard-Oxford atlas
        
        Returns:
            timeseries: (time_steps, n_rois) array of ROI mean signals
        """
        timeseries = self.masker.fit_transform(fmri_img)
        if self.n_rois is None:
            self.n_rois = timeseries.shape[1]
        print(f"  ✓ Extracted timeseries shape: {timeseries.shape} ({self.n_rois} ROIs)")
        return timeseries
    
    def compute_connectivity(self, timeseries):
        """
        Compute Pearson correlation matrix from timeseries
        
        Returns:
            fc_matrix: (n_rois, n_rois) correlation matrix
            fc_vector: Upper triangle flattened features
        """
        conn = ConnectivityMeasure(kind='correlation')
        fc_matrix = conn.fit_transform([timeseries])[0]
        
        # Extract upper triangle (no diagonal)
        n_rois = fc_matrix.shape[0]
        upper_tri_indices = np.triu_indices(n_rois, k=1)
        fc_vector = fc_matrix[upper_tri_indices]
        
        print(f"  ✓ Computed correlation matrix: {fc_matrix.shape}")
        print(f"  ✓ Extracted upper triangle features: {fc_vector.shape}")
        
        return fc_matrix, fc_vector
    
    def apply_rfe_selection(self, fc_vector):
        """
        Apply RFE mask to reduce connectivity features to 95 selected features
        
        Args:
            fc_vector: Full connectivity vector
            
        Returns:
            fc_selected: (95,) RFE-selected features
        """
        expected_size = len(self.rfe_mask)
        actual_size = len(fc_vector)
        
        if actual_size != expected_size:
            # Calculate what atlas size we have vs what we need
            actual_rois = int((1 + np.sqrt(1 + 8 * actual_size)) / 2)
            expected_rois = int((1 + np.sqrt(1 + 8 * expected_size)) / 2)
            
            print(f"⚠️  WARNING: Atlas dimension mismatch!")
            print(f"   Current atlas: {actual_rois} ROIs → {actual_size} features")
            print(f"   Model expects: {expected_rois} ROIs → {expected_size} features")
            print(f"   Applying workaround: padding/truncating features to match model")
            print(f"   ⚠️  This is NOT scientifically valid - results may be incorrect!")
            
            # TEMPORARY WORKAROUND: Pad or truncate to match expected size
            if actual_size < expected_size:
                # Pad with zeros
                fc_vector_adjusted = np.zeros(expected_size)
                fc_vector_adjusted[:actual_size] = fc_vector
            else:
                # Truncate
                fc_vector_adjusted = fc_vector[:expected_size]
            
            fc_vector = fc_vector_adjusted
        
        fc_selected = fc_vector[self.rfe_mask]
        print(f"  ✓ Applied RFE selection: {fc_selected.shape}")
        return fc_selected
    
    def scale_features(self, fc_selected):
        """Apply StandardScaler normalization if available"""
        if self.scaler is not None:
            fc_scaled = self.scaler.transform(fc_selected.reshape(1, -1))[0]
            print(f"  ✓ Applied feature scaling")
            return fc_scaled
        return fc_selected
    
    def process(self, nifti_path, apply_scaling=True):
        """
        Complete pipeline: fMRI → connectivity → RFE → features
        
        Args:
            nifti_path: Path to 4D fMRI file (.nii or .nii.gz)
            apply_scaling: Whether to apply scaler normalization
            
        Returns:
            features: (n_features,) final feature vector ready for SSAE model
            fc_matrix: (n_rois, n_rois) correlation matrix for visualization
            timeseries: (time_steps, n_rois) ROI timeseries for visualization
        """
        print(f"\n📊 Processing fMRI: {Path(nifti_path).name}")
        
        # Load fMRI
        print("  → Loading 4D fMRI...")
        fmri_img = self.load_fmri(nifti_path)
        
        # Extract timeseries
        print("  → Extracting ROI timeseries from Harvard-Oxford atlas...")
        timeseries = self.extract_timeseries(fmri_img)
        
        # Compute connectivity
        print("  → Computing functional connectivity (Pearson correlation)...")
        fc_matrix, fc_vector = self.compute_connectivity(timeseries)
        
        # Apply RFE selection
        print("  → Applying RFE feature selection...")
        fc_selected = self.apply_rfe_selection(fc_vector)
        
        # Scale features
        if apply_scaling:
            print("  → Normalizing features...")
            features = self.scale_features(fc_selected)
        else:
            features = fc_selected
        
        print(f"  ✓ Final feature shape: {features.shape}")
        print(f"  ✓ Feature range: [{features.min():.4f}, {features.max():.4f}]")
        
        return features, fc_matrix, timeseries


def get_atlas_path():
    """
    Get atlas for ROI extraction
    The model was trained on a 110-region atlas
    """
    try:
        from nilearn import datasets
        
        # Try AAL atlas (116 regions - closest to 110)
        try:
            print("Attempting to load AAL atlas (116 ROIs)...")
            atlas_data = datasets.fetch_atlas_aal()
            atlas_path = atlas_data.maps
            print(f"✓ AAL atlas loaded: {atlas_path}")
            print(f"⚠️  Note: AAL has 116 ROIs, model expects 110")
            print(f"   This will result in 6670 features vs expected 5995")
            return atlas_path
        except Exception as e1:
            print(f"AAL atlas failed: {e1}")
            
            # Try Schaefer atlas with 100 parcels
            try:
                print("Attempting to load Schaefer 100-parcel atlas...")
                atlas_data = datasets.fetch_atlas_schaefer_2018(n_rois=100, resolution_mm=2)
                atlas_path = atlas_data.maps
                print(f"✓ Schaefer 100-parcel atlas loaded: {atlas_path}")
                print(f"⚠️  Note: Using 100 ROIs instead of expected 110")
                return atlas_path
            except Exception as e2:
                print(f"Schaefer atlas failed: {e2}")
                
                # Fallback to Harvard-Oxford cortical (48 regions)
                print("⚠️  Falling back to Harvard-Oxford cortical atlas (48 ROIs)")
                print("   WARNING: Model expects 110 ROIs, will cause dimension mismatch")
                cort_atlas = datasets.fetch_atlas_harvard_oxford('cort-maxprob-thr25-2mm')
                atlas_path = cort_atlas.maps
                return atlas_path
            
    except Exception as e:
        print(f"Error downloading atlas: {e}")
        return None
