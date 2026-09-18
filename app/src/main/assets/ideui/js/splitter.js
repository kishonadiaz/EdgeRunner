const drawer = document.getElementById('drawer');
const splitter = document.getElementById('splitter');

if (drawer && splitter) {
    const MIN = 170;
    const MAX = 460;
    const STEP = 16;

    const clamp = px => Math.max(MIN, Math.min(MAX, px));

    const setWidth = px => {
        const w = clamp(px);
        drawer.style.width = w + 'px';
        splitter.setAttribute('aria-valuenow', String(Math.round(w)));
        return w;
    };

    let startX = 0;
    let startW = 0;

    const onMove = event => {
        setWidth(startW + (event.clientX - startX));
    };

    const onUp = event => {
        splitter.releasePointerCapture(event.pointerId);
        splitter.removeEventListener('pointermove', onMove);
        splitter.removeEventListener('pointerup', onUp);
        splitter.removeEventListener('pointercancel', onUp);
        document.body.classList.remove('dragging');
    };

    splitter.addEventListener('pointerdown', event => {
        startX = event.clientX;
        startW = drawer.getBoundingClientRect().width;

        // Capture keeps the drag alive even if the ray drifts off the strip.
        splitter.setPointerCapture(event.pointerId);
        splitter.addEventListener('pointermove', onMove);
        splitter.addEventListener('pointerup', onUp);
        splitter.addEventListener('pointercancel', onUp);
        document.body.classList.add('dragging');
        event.preventDefault();
    });

    splitter.addEventListener('keydown', event => {
        const w = drawer.getBoundingClientRect().width;
        if (event.key === 'ArrowLeft') setWidth(w - STEP);
        else if (event.key === 'ArrowRight') setWidth(w + STEP);
        else if (event.key === 'Home') setWidth(MIN);
        else if (event.key === 'End') setWidth(MAX);
        else return;
        event.preventDefault();
    });

    splitter.addEventListener('dblclick', () => setWidth(250));
}