from pathlib import Path
import pypdfium2 as pdfium
ROOT=Path(__file__).resolve().parents[1]
for path in (ROOT/'entregas').rglob('*.pdf'):
 out=ROOT/'qa'/path.stem;out.mkdir(parents=True,exist_ok=True)
 doc=pdfium.PdfDocument(str(path))
 for index,page in enumerate(doc):
  image=page.render(scale=1.4).to_pil();image.save(out/f'pagina-{index+1}.png')
 print(path.stem,len(doc))
