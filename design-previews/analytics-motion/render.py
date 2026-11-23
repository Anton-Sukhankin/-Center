"""Рендер пяти зацикленных эскизов для обсуждения, не часть приложения."""
from pathlib import Path
from math import cos, sin, pi, exp
from PIL import Image, ImageDraw, ImageFont

out = Path(__file__).parent
scale = 3
W, H = 440, 152
blue, gray, ink = (32, 112, 219), (210, 219, 230), (35, 48, 68)
paper = (255, 255, 255)
font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 16 * scale)
tau = 2 * pi
def mix(a, b, k):
    return tuple(round(x + (y-x)*k) for x,y in zip(a,b))
def draw_frame(style, t):
    im = Image.new("RGB", (W*scale,H*scale), paper)
    d = ImageDraw.Draw(im)
    def coords(p): return tuple(round(v*scale) for v in p)
    def line(points, color, width=2):
        d.line([coords(p) for p in points], fill=color, width=round(width*scale), joint="curve")
    def rect(box,r,color,edge=None):
        d.rounded_rectangle(coords(box),radius=round(r*scale),fill=color,outline=edge,width=scale)
    def dot(x,y,r,color):
        d.ellipse(coords((x-r,y-r,x+r,y+r)),fill=color)
    def pulse(p): return (.5+.5*cos(tau*(t-p)))**4
    if style == 0:  # Связи между событиями
        nodes=[(157,40),(161,74),(207,53),(251,31),(257,78),(287,53)]
        for k,(a,b) in enumerate([(0,2),(1,2),(2,3),(2,4),(3,5),(4,5)]):
            x,y=nodes[a]; u,v=nodes[b]
            line([(x,y),(u,v)],mix(gray,blue,pulse(k*.13)*.68))
            f=(t-k*.13)%1
            dot(x+(u-x)*f,y+(v-y)*f,2,mix(gray,blue,sin(pi*f)**2))
        for k,(x,y) in enumerate(nodes):
            dot(x,y,5 if k==2 else 4,mix(gray,blue,pulse(k*.1)))
            dot(x,y,2,paper)
    elif style == 1:  # Чтение реестра
        for k in range(4):
            y=29+k*16; a=pulse(k*.19)
            rect((153,y-3,159,y+3),2,mix(gray,blue,a))
            rect((168,y-2,168+[64,91,74,85][k],y+2),2,mix(gray,blue,a*.7))
            rect((270,y-2,283,y+2),2,mix(gray,blue,a*.45))
        y=28+50*(.5-.5*cos(tau*t))
        line([(146,y+5),(291,y+5)],(165,198,239),1)
    elif style == 2:  # Сопоставление рядов
        xs=[147,175,204,232,262,292]; y1=[65,60,65,45,48,31]; y2=[76,69,72,62,58,49]
        line(list(zip(xs,y2)),gray); line(list(zip(xs,y1)),(99,152,221))
        f=(.5-.5*cos(tau*t))*(len(xs)-1); i=min(int(f),len(xs)-2); k=f-i
        def at(a):return a[i]*(1-k)+a[i+1]*k
        x=at(xs); a=at(y1); b=at(y2)
        line([(x,a),(x,b)],blue);dot(x,b,3,blue);dot(x,a,5,blue);dot(x,a,2,paper)
    elif style == 3:  # Матрица совпадений
        for r in range(4):
            for c in range(7):
                x=169+c*15; y=25+r*15
                a=pulse(c*.11+r*.08)
                color=mix((232,237,244),blue,a*(.92 if (r+c)%3==0 else .35))
                rect((x,y,x+10,y+10),3,color)
    else:  # Сведение в вывод
        for k in range(3):
            y=31+23*k
            path=[(151,y),(184,y),(207,54),(226,54)]
            line(path,mix(gray,blue,pulse(k*.17)*.7))
            dot(151,y,3,mix(gray,blue,pulse(k*.17)))
            f=((t-k*.17)%1)*3; i=int(f); a,b=path[i:i+2]; f-=i
            dot(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,2.3,mix(gray,blue,.8))
        rect((226,32,289,77),6,(247,250,254),(192,207,227))
        for i,w in enumerate([33,43,23]):
            rect((235,42+i*10,235+w,45+i*10),1.5,mix(gray,blue,pulse(.5+i*.12)*.7))
    d.text(coords((220,116)), "Идёт анализ выбранных событий…",anchor="mm",font=font,fill=ink)
    return im.resize((W,H),Image.Resampling.LANCZOS)

for style,name in enumerate(["links","register","comparison","matrix","synthesis"]):
    frames=[draw_frame(style,i/60) for i in range(60)]
    palette=frames[0].quantize(colors=192)
    frames=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
    target=out/(name+".gif")
    frames[0].save(target,save_all=True,append_images=frames[1:],duration=50,loop=0,optimize=False)
    with Image.open(target) as gif:
        assert gif.n_frames>50 and gif.info["loop"]==0
        print(name,gif.size,gif.n_frames)
