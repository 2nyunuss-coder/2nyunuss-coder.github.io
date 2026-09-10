"""Rasterize the same geometric Y marks used by the repository's SVG icons."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
for arcade,folder in [(False,ROOT/'icons'),(True,ROOT/'arcade/icons')]:
    folder.mkdir(parents=True,exist_ok=True)
    im=Image.new('RGB',(1024,1024),'#101a30' if arcade else '#07101f')
    draw=ImageDraw.Draw(im)
    if arcade:
        draw.rounded_rectangle((160,160,864,864),radius=180,fill='#d7f46e')
        points=[(151,154),(207,154),(256,239),(305,154),(361,154),(280,285),(280,361),(232,361),(232,285)]
    else:
        points=[(114,118),(192,118),(256,230),(320,118),(398,118),(290,292),(290,394),(222,394),(222,292)]
    draw.polygon([(x*2,y*2) for x,y in points],fill='#182a3e' if arcade else '#4ea1ff')
    for size in [180,192,512]:
        im.resize((size,size),Image.Resampling.LANCZOS).save(folder/f'icon-{size}.png',optimize=True)
