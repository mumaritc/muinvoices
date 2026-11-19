"""Build visual contact sheets and inspect each composition's long print output."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tools'))
import pymupdf as fitz

root = Path('output/playwright/matrix')
ids = ['pure','clean-line','monochrome','air','executive','ledger','blue-office','structured','formal','gradient-edge','bold-header','split-panel','accent-bar','studio','geometric','editorial','color-block','signature','luxury-gold','elegant-serif','arabic-classic','arabic-modern','arabic-formal','dual-column','saudi-business']
for mode in ['en','ar','bilingual']:
    for batch in range(5):
        doc = fitz.open(); sheet = doc.new_page(width=1600, height=535)
        for index, name in enumerate(ids[batch*5:batch*5+5]):
            rect = fitz.Rect(index*320+8, 25, (index+1)*320-8, 525)
            sheet.insert_text((index*320+10,16), name + ' / ' + mode, fontsize=12)
            sheet.insert_image(rect, filename=str(root / f'{name}-{mode}.png'), keep_proportion=True)
        sheet.get_pixmap().save(str(root / f'contact-{batch}-{mode}.png'))

for path in root.glob('*.pdf'):
    doc = fitz.open(path); text = '\n'.join(p.get_text() for p in doc)
    assert '103500.00' in text if '-long' in path.name else '1035.00' in text, f'{path}: missing total'
    if '-long' in path.name:
        for number in range(1,101):
            assert f'Row-{number} ' in text, f'{path}: missing row {number}'
    if '-pathological' in path.name:
        for marker in ['ROW-START','ROW-END','SECTION-START','SECTION-END']:
            assert marker in text, f'{path}: missing {marker}'
    for index, page in enumerate(doc):
        for word in page.get_text('words'):
            assert word[0] >= 0 and word[1] >= 0 and word[2] <= page.rect.width + 1 and word[3] <= page.rect.height + 1, f'{path}: text outside page {index+1}'
    doc[-1].get_pixmap().save(str(path.with_name(path.stem+'-last.png')))
    print(f'{path.name}: {len(doc)} pages, total and bounds passed')

for batch in range(5):
    doc = fitz.open(); sheet = doc.new_page(width=1600, height=1025)
    for index, name in enumerate(ids[batch*5:batch*5+5]):
        source = fitz.open(root / f'{name}-bilingual-long.pdf')
        for row, page_index in enumerate([0, len(source)-1]):
            x = index*320
            sheet.insert_text((x+8,row*510+15), name + (' / first' if not row else ' / final'), fontsize=11)
            sheet.show_pdf_page(fitz.Rect(x+8,row*510+24,x+312,row*510+505), source, page_index)
    sheet.get_pixmap().save(str(root / f'long-review-{batch}.png'))
