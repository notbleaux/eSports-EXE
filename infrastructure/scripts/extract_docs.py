#!/usr/bin/env python3
"""
Extract text from legacy documents for analysis.
"""
import zipfile
import xml.etree.ElementTree as ET
import re
import os

def extract_docx_text(path):
    """Extract text from a .docx file."""
    try:
        with zipfile.ZipFile(path, 'r') as zip_ref:
            xml_content = zip_ref.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        # Extract text from all w:t elements
        texts = []
        for elem in root.iter():
            if elem.tag.endswith('t'):
                if elem.text:
                    texts.append(elem.text)
        
        return ' '.join(texts)
    except Exception as e:
        return f"[Error extracting DOCX: {e}]"

def extract_pdf_text_simple(path):
    """Simple PDF text extraction (fallback)."""
    try:
        with open(path, 'rb') as f:
            content = f.read().decode('latin-1', errors='ignore')
        # Extract readable text
        text = re.findall(r'\(([^)]+)\)', content)
        return ' '.join(text)
    except Exception as e:
        return f"[Error extracting PDF: {e}]"

# Extract from all documents
downloads_dir = "/root/openclaw/kimi/downloads"

# Map files to their IDs
files = {
    "axiom_critical_review": "19cb7319-e8a2-8c7e-8000-0000f2c6672f_Axiom_Comprehensive_Critical_Review_v2.docx",
    "febrrr_radiantx": "19cb731a-0992-8df1-8000-0000e2a84a19_FEBRRR_RadiantX_Repository_Assessment.docx",
    "kcritr_esports": "19cb7319-e962-8db0-8000-0000e1595519_KCRITR_Esports_Analytics_Review_CRIT_Report.docx",
    "mdfv0_overview": "19cb731a-3712-874f-8000-00002c8e2dc9_MDFv0-Project_Overview_wHistorical.docx",
    "axiom_draft": "19cb731a-6b72-810a-8000-000044a49e1e_Axiom_20Esports_20Manager_20-_20Draft_20Document_20Ver.A000.001.pdf.pdf",
    "axiom_strategy": "19cb731a-a9a2-8f59-8000-0000a2c4a84a_Axiom_20Esports_20Manager_20Game_20-_20Strategy_20_20Simulation_20Systems.pdf.pdf",
    "tactical_map": "19cb731a-50a2-8e33-8000-0000d9526feb_Tactical_Map_MultiLayer_Resource_Master_Execution_Plan.pdf"
}

results = {}
for name, filename in files.items():
    path = os.path.join(downloads_dir, filename)
    if filename.endswith('.docx'):
        results[name] = extract_docx_text(path)
    else:
        results[name] = extract_pdf_text_simple(path)
    print(f"=== {name} ===")
    print(results[name][:2000] if results[name] else "[No content]")
    print("\n" + "="*60 + "\n")
