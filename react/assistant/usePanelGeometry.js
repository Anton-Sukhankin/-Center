import { useLayoutEffect, useRef, useState } from 'react';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
function bounds() {
    const edge = innerWidth <= 540 ? 12 : 24;
    const top = (document.querySelector('.top-navbar')?.getBoundingClientRect().bottom || 0) + edge;
    return { left:edge, top, right:innerWidth-edge, bottom:innerHeight-edge };
}
function fit(rect, b) {
    const w = Math.max(1, b.right-b.left), h = Math.max(1, b.bottom-b.top);
    const width = clamp(rect.width, Math.min(520,w), Math.min(730,w)), height = clamp(rect.height, Math.min(240,h), h);
    return {width,height,left:clamp(rect.left,b.left,b.right-width),top:clamp(rect.top,b.top,b.bottom-height)};
}
export function usePanelGeometry(open) {
    const [area, setArea] = useState(bounds);
    const [custom, setCustom] = useState(null);
    const [full, setFull] = useState(false);
    const [moving,setMoving] = useState(false);
    const gesture = useRef(null);
    useLayoutEffect(() => {
        if (!open) return;
        const update = () => setArea(bounds());
        update();
        const observer = new ResizeObserver(update);
        const header = document.querySelector('.top-navbar');
        if (header) observer.observe(header);
        window.addEventListener('resize',update);
        return () => { observer.disconnect(); window.removeEventListener('resize',update); gesture.current=null; };
    },[open]);
    const rect = fit(custom || {width:730,height:area.bottom-area.top,left:area.right-Math.min(730,area.right-area.left),top:area.top},area);
    function start(e,edge) {
        if (full || e.button!==0 || e.target.closest('button')) return;
        e.preventDefault();
        gesture.current={edge,rect,x:e.clientX,y:e.clientY,id:e.pointerId};
        e.currentTarget.setPointerCapture(e.pointerId);
        setMoving(true);
    }
    function move(e) {
        const g=gesture.current;
        if (!g || e.pointerId!==g.id) return;
        const r=g.rect, dx=e.clientX-g.x, dy=e.clientY-g.y;
        if (g.edge==='move') {setCustom(fit({...r,left:r.left+dx,top:r.top+dy},area));return;}
        const minW=Math.min(520,area.right-area.left), minH=Math.min(240,area.bottom-area.top);
        let {left,top,width,height}=r;
        if(g.edge.includes('w')) {left=clamp(r.left+dx,Math.max(area.left,r.left+r.width-730),r.left+r.width-minW);width=r.width+r.left-left;}
        if(g.edge.includes('n')) {top=clamp(r.top+dy,area.top,r.top+r.height-minH);height=r.height+r.top-top;}
        if(g.edge==='s') height=clamp(r.height+dy,minH,area.bottom-r.top);
        setCustom({left,top,width,height});
    }
    function end() {gesture.current=null;setMoving(false);}
    function compact() {
        if(custom) {setCustom(null);return;}
        const height=Math.min(rect.height,Math.max(240,Math.round(rect.height/2)));
        setCustom({...rect,height,top:rect.top+rect.height-height});
    }
    return {style:full?{left:0,top:0,width:'100%',height:'100%'}:rect,full,custom,moving,
        compact,toggleFull:()=>setFull(v=>!v),start,events:{onPointerMove:move,onPointerUp:end,onPointerCancel:end,onLostPointerCapture:end}};
}
