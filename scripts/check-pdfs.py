"""Inspect Chromium print fixtures; optional dev tool: pip install pymupdf."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tools'))
import pymupdf

for path in Path('output/playwright').glob('*.pdf'):
    if path.name.startswith('zatca-'):
        continue
    doc = pymupdf.open(path)
    text = '\n'.join(page.get_text() for page in doc)
    assert text.strip(), f'{path}: no selectable text'
    assert 'Export backup' not in text, f'{path}: editor chrome printed'
    if path.name.startswith('editor-'):
        for marker in ['Custom heading', 'Custom closing', 'Custom invoice', 'Synthetic layout seller', 'Synthetic buyer', '115.00']:
            assert marker in text, f'{path}: missing {marker}'
        assert 'From' not in text, f'{path}: hidden seller caption printed'
    if '-100' in path.name:
        assert '1000.00' in text, f'{path}: total missing'
        if '-ar-' not in path.name:
            for number in range(1, 101):
                assert f'Row-{number} ' in text, f'{path}: row {number} missing'
    if 'stress' in path.name:
        for marker in ['ROW-START', 'ROW-END', 'SECTION-START', 'SECTION-END', '10.00']:
            assert marker in text, f'{path}: {marker} lost'
    for index, page in enumerate(doc):
        assert abs(page.rect.width - 595.28) < 2 and abs(page.rect.height - 841.89) < 2
        for word in page.get_text('words'):
            assert word[0] >= 0 and word[1] >= 0 and word[2] <= page.rect.width + 1 and word[3] <= page.rect.height + 1, f'{path}: text outside page {index+1}'
    doc[0].get_pixmap().save(str(path.with_suffix('.png')))
    if path.name == 'pure-qr.pdf':
        doc[0].get_pixmap(matrix=pymupdf.Matrix(3,3)).save(str(path.with_name('pure-qr-scan.png')))
    doc[-1].get_pixmap().save(str(path.with_name(path.stem + '-last.png')))
    print(f'{path.name}: {len(doc)} A4 pages, text/bounds checks passed')
