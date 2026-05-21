# /src/notebooks/

This directory contains all Jupyter notebooks used for data cleaning, transformation, combination, analysis, and validation across all project iterations.

---

## Quick Reference

| Notebook | Iteration | Purpose | Input | Output |
|---|---|---|---|---|
| `barrier_profiling.ipynb` | 1 | Analyse digital barriers by age group | ADII CSVs | Analysis outputs / charts |
| `gap_analysis.ipynb` | 1 | Digital inclusion gap analysis across demographics | ADII CSVs | Analysis outputs / charts |
| `service_usage.ipynb` | 1 | Online service usage patterns by age | ADII CSVs | `service_usage.csv` |
| `AIHW_AgeCare_ServiceList.ipynb` | 3 | Clean and validate AIHW aged care dataset | `Service-List-2025-Australia.xlsx` | `cleaned_AIHW_ServiceList.csv` |
| `combine_libraries.ipynb` | 3 | Combine 5 state library datasets into one | 5 state library files | `cleaned_Libraries_ALL.csv` |
| `combine_local_help.ipynb` | 3 | Merge AIHW + libraries into master dataset | Both cleaned CSVs | `Combined_LocalHelp_ALL.csv` |


---

## Notebooks — Detailed Description

---

### `barrier_profiling.ipynb`
**Iteration 1 — Exploratory Analysis**

Profiles digital barriers reported by older Australians using ADII 2025 data. Examines which barriers (cost, confidence, relevance, access) are most prevalent in the 65+ and 75+ cohorts relative to the national average. Outputs are used to justify the platform's feature prioritisation.

**Input:** ADII cleaned CSVs from `src/data/clean_data/`
**Output:** Charts and summary statistics (used in reports and presentations)
**Key libraries:** pandas, matplotlib, seaborn

---

### `gap_analysis.ipynb`
**Iteration 1 — Exploratory Analysis**

Quantifies the digital inclusion gap between older Australians and the national average across all three ADII dimensions: affordability, access, and digital ability. Applies the Hindsight → Insight → Foresight framework documented in the Data Management Plan (Section 7).

**Input:** ADII cleaned CSVs from `src/data/clean_data/`
**Output:** Charts and gap summary tables (used in iteration reports)
**Key libraries:** pandas, matplotlib

---

### `service_usage.ipynb`
**Iteration 1 — Exploratory Analysis**

Analyses online service usage rates (Medicare, myGov, banking, etc.) by age group to identify which services older Australians are least confident using. Findings directly informed the Digital Services Directory (Epic 1) content priorities.

**Input:** ADII source data
**Output:** `src/data/clean_data/service_usage.csv`
**Key libraries:** pandas, matplotlib

---

### `AIHW_AgeCare_ServiceList.ipynb`
**Iteration 3 — Data Cleaning**

Cleans the AIHW Aged Care Service List (30 June 2025) for use in Epic 3 — Find Local Digital Help. This is the primary cleaning notebook for the AIHW dataset.

**Cleaning steps applied:**
- Skip 2 metadata rows; use row 3 as header
- Drop "2024–25 Australian Government Funding" column
- Remove 2 Innovative Pool records (no physical venue)
- Convert postcode from int → string
- Fix Restorative Care Places space-string placeholders → 0
- Fill 1 null Home Care Places value → 0
- Strip whitespace from all string columns

**Input:** `src/data/raw_data/Service-List-2025-Australia.xlsx`
**Output:** `src/data/clean_data/cleaned_AIHW_ServiceList.csv` (5,376 records × 24 columns)
**Key libraries:** pandas

> ⚠️ Note: A checkpoint version exists in `.ipynb_checkpoints/`. Always run the main notebook, not the checkpoint.

---

### `combine_libraries.ipynb`
**Iteration 3 — Data Combination**

Combines library location datasets from five Australian states (VIC, QLD, TAS, WA, SA) into a single standardised file. Each state source required different cleaning steps before combination.

**Cleaning steps by state:**

| State | Source Format | Key Steps |
|---|---|---|
| VIC + QLD | CSV (pre-combined) | Fixed 263 null library names using suburb + "Library" fallback |
| TAS | CSV (converted from GeoJSON) | Reverse-geocoded 46 missing postcodes via pgeocode nearest-neighbour |
| WA | CSV | Standardised column names, stripped whitespace |
| SA | XLSX | Manually sourced opening hours for 17 metro branches via council websites; mapped via phone-keyed lookup dictionary |

**Combination method:** Union join (`pd.concat`) — not a merge. Datasets represent different venue types, not the same venues.

**Input:**
- `src/data/raw_data/all_library_services_combined.csv`
- `src/data/raw_data/cleaned_Libraries_TAS.csv`
- `src/data/raw_data/WA_Libraries.csv`
- `src/data/raw_data/SA_LibraryLocations.xlsx`

**Output:** `src/data/clean_data/cleaned_Libraries_ALL.csv` (835 records)

**State breakdown:** VIC (281), WA (233), SA (156), QLD (119), TAS (46)

**Key libraries:** pandas, pgeocode, numpy

---

### `combine_local_help.ipynb`
**Iteration 3 — Master Pipeline**

The final combining notebook. Merges the AIHW aged care dataset and the combined library dataset into the master output file that powers Epic 3. Also runs coordinate validation and duplicate detection.

**Pipeline sections:**

| Section | Purpose |
|---|---|
| 1–3 | Load and inspect both input files |
| 4 | Standardise schema to 11 columns |
| 5 | Map AIHW care types → human-readable venue_type labels |
| 6 | Apply phone and opening hours fallback logic |
| 7 | Union join (pd.concat) |
| 8 | Export `Combined_LocalHelp_ALL.csv` |
| 9 | Null check and schema validation |
| 10 | Coordinate validation via Haversine distance vs pgeocode postcode centroids |
| 11 | Duplicate detection (exact, logical, coordinate) |

**Fallback logic applied:**

| Situation | Value |
|---|---|
| AIHW — no phone | `"Phone number not available"` |
| AIHW — no opening hours | `"Opening hours not available"` |
| Library — has phone, no hours | `"Please call to confirm opening hours"` |
| Library — no phone, no hours | `"Opening hours not available"` |

**Validation results (last run):**
- Coordinate flags: 4,372 records flagged > 50km — all confirmed correct (remote postcode centroids, island territories)
- Exact duplicates found: 78 → removed
- Final record count: 6,133

**Input:**
- `src/data/clean_data/cleaned_AIHW_ServiceList.csv`
- `src/data/clean_data/cleaned_Libraries_ALL.csv`

**Output:** `src/data/clean_data/Combined_LocalHelp_ALL.csv` (6,133 records)

**Key libraries:** pandas, pgeocode, numpy

---

## Running Order

When regenerating the Epic 3 dataset from scratch, run notebooks in this order:

```
1. AIHW_AgeCare_ServiceList.ipynb
2. combine_libraries.ipynb
3. combine_local_help.ipynb
```

ADII analysis notebooks (barrier_profiling, gap_analysis, service_usage) are independent and can be run in any order.

---

## Environment Setup

```bash
pip install pandas pgeocode numpy openpyxl jupyter matplotlib seaborn
```

Python 3.10+ required. All notebooks were developed and tested on Python 3.12.

---

## Checkpoint Files

The `.ipynb_checkpoints/` folder is auto-generated by Jupyter and contains auto-saved versions of notebooks. These are **not** the canonical versions — always run from the root notebook files, not from checkpoints. The checkpoints folder is included in `.gitignore`.

