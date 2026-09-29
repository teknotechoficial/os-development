import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './ui';

export interface ImageCropperProps {
    src: string;
    onCancel: () => void;
    onConfirm: (croppedDataUrl: string) => void;
}

const VIEW = 280;
const OUTPUT = 160;

interface Geo {
    loaded: boolean;
    natW: number;
    natH: number;
    coverScale: number;
    zoom: number;
    offX: number;
    offY: number;
}

interface DragState {
    pointerId: number;
    startX: number;
    startY: number;
    offX: number;
    offY: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const ImageCropper: React.FC<ImageCropperProps> = ({ src, onCancel, onConfirm }) => {
    const [image, setImage] = React.useState<HTMLImageElement | null>(null);
    const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(null);
    const [coverScale, setCoverScale] = React.useState(1);
    const [zoom, setZoom] = React.useState(1);
    const [offX, setOffX] = React.useState(0);
    const [offY, setOffY] = React.useState(0);

    const geoRef = React.useRef<Geo>({
        loaded: false,
        natW: 0,
        natH: 0,
        coverScale: 1,
        zoom: 1,
        offX: 0,
        offY: 0,
    });
    const imageRef = React.useRef<HTMLImageElement | null>(null);
    const dragRef = React.useRef<DragState | null>(null);
    const cancelRef = React.useRef(onCancel);
    const confirmRef = React.useRef(onConfirm);

    React.useEffect(() => {
        cancelRef.current = onCancel;
        confirmRef.current = onConfirm;
    });

    React.useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, []);

    React.useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') cancelRef.current();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    React.useEffect(() => {
        let disposed = false;
        const next = new Image();

        setImage(null);
        setNatural(null);
        imageRef.current = null;
        geoRef.current.loaded = false;

        next.onload = () => {
            if (disposed) return;
            const natW = next.naturalWidth;
            const natH = next.naturalHeight;
            if (!natW || !natH) {
                cancelRef.current();
                return;
            }
            const scale = Math.max(VIEW / natW, VIEW / natH);
            const state: Geo = {
                loaded: true,
                natW,
                natH,
                coverScale: scale,
                zoom: 1,
                offX: (VIEW - natW * scale) / 2,
                offY: (VIEW - natH * scale) / 2,
            };
            geoRef.current = state;
            imageRef.current = next;
            setImage(next);
            setNatural({ w: natW, h: natH });
            setCoverScale(scale);
            setZoom(1);
            setOffX(state.offX);
            setOffY(state.offY);
        };

        next.onerror = () => {
            if (!disposed) cancelRef.current();
        };

        next.src = src;

        return () => {
            disposed = true;
            next.onload = null;
            next.onerror = null;
        };
    }, [src]);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        const geo = geoRef.current;
        if (!geo.loaded || event.button !== 0) return;
        dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            offX: geo.offX,
            offY: geo.offY,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const geo = geoRef.current;
        const scale = geo.coverScale * geo.zoom;
        const nextX = clamp(drag.offX + (event.clientX - drag.startX), VIEW - geo.natW * scale, 0);
        const nextY = clamp(drag.offY + (event.clientY - drag.startY), VIEW - geo.natH * scale, 0);
        geo.offX = nextX;
        geo.offY = nextY;
        setOffX(nextX);
        setOffY(nextY);
    };

    const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handleZoom = (value: number) => {
        const geo = geoRef.current;
        if (!geo.loaded) return;
        const prevScale = geo.coverScale * geo.zoom;
        const centerX = (VIEW / 2 - geo.offX) / prevScale;
        const centerY = (VIEW / 2 - geo.offY) / prevScale;
        const nextScale = geo.coverScale * value;
        geo.zoom = value;
        geo.offX = clamp(VIEW / 2 - centerX * nextScale, VIEW - geo.natW * nextScale, 0);
        geo.offY = clamp(VIEW / 2 - centerY * nextScale, VIEW - geo.natH * nextScale, 0);
        setZoom(value);
        setOffX(geo.offX);
        setOffY(geo.offY);
    };

    const handleConfirm = () => {
        const source = imageRef.current;
        const geo = geoRef.current;
        if (!source || !geo.loaded) {
            cancelRef.current();
            return;
        }
        const scale = geo.coverScale * geo.zoom;
        const srcSize = VIEW / scale;
        const sx = -geo.offX / scale;
        const sy = -geo.offY / scale;
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT;
        canvas.height = OUTPUT;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            cancelRef.current();
            return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, sx, sy, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
        confirmRef.current(canvas.toDataURL('image/jpeg', 0.85));
    };

    const scale = coverScale * zoom;

    return createPortal(
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px] flex items-center justify-center p-4 animate-fade-in"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-[#10233E] border border-[#1C3557] rounded-2xl w-full max-w-lg shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] animate-scale-in"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="p-6 border-b border-[#16294A] flex items-start justify-between gap-4">
                    <div>
                        <h2 className="font-display text-lg uppercase tracking-[0.1em] text-white">ACOMODAR IMAGEN</h2>
                        <p className="text-xs text-[#5B7295] uppercase tracking-[0.15em] mt-1">Ajusta el encuadre de tu foto</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Cerrar"
                        className="p-2 rounded-xl text-[#8FA6C4] hover:bg-[#14294A] hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    <div
                        className="relative w-[280px] h-[280px] rounded-full overflow-hidden mx-auto ring-2 ring-[#1877E8]/60 bg-[#0C1E36] select-none cursor-grab active:cursor-grabbing"
                        style={{ touchAction: 'none' }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerEnd}
                        onPointerCancel={handlePointerEnd}
                    >
                        {image && natural ? (
                            <img
                                src={src}
                                alt=""
                                draggable={false}
                                onDragStart={(event) => event.preventDefault()}
                                className="absolute max-w-none select-none"
                                style={{
                                    left: offX,
                                    top: offY,
                                    width: natural.w * scale,
                                    height: natural.h * scale,
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-[#5B7295]">
                                Cargando...
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 p-5 border-t border-[#16294A]">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-[11px] uppercase tracking-[0.15em] text-[#8FA6C4] shrink-0">Zoom</span>
                        <input
                            type="range"
                            min={1}
                            max={4}
                            step={0.01}
                            value={zoom}
                            disabled={!image}
                            onChange={(event) => handleZoom(Number(event.target.value))}
                            aria-label="Zoom"
                            className="flex-1 min-w-0 accent-[#1877E8] disabled:opacity-40 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="secondary" size="sm" onClick={onCancel}>
                            CANCELAR
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleConfirm}>
                            APLICAR
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageCropper;
