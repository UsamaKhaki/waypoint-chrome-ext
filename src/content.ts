// Content script — injected into every webpage

let paletteFrame: HTMLIFrameElement | null = null;
let isOpen = false;

function createFrame() {
  const frame = document.createElement('iframe');
  frame.src = chrome.runtime.getURL('palette.html');
  frame.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:100vw',
    'height:100vh',
    'border:none',
    'z-index:2147483647',
    'background:transparent',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity 0.15s ease',
  ].join(';');
  frame.allow = 'clipboard-write';
  document.documentElement.appendChild(frame);
  return frame;
}

function openPalette() {
  if (!paletteFrame) paletteFrame = createFrame();
  paletteFrame.style.pointerEvents = 'all';
  paletteFrame.style.opacity = '1';
  paletteFrame.contentWindow?.postMessage({ type: 'WAYPOINT_OPEN' }, '*');
  isOpen = true;
}

function closePalette() {
  if (!paletteFrame) return;
  paletteFrame.style.pointerEvents = 'none';
  paletteFrame.style.opacity = '0';
  paletteFrame.contentWindow?.postMessage({ type: 'WAYPOINT_CLOSE' }, '*');
  isOpen = false;
}

document.addEventListener(
  'keydown',
  (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) closePalette();
      else openPalette();
    }
    if (e.key === 'Escape' && isOpen) {
      closePalette();
    }
  },
  true
);

window.addEventListener('message', (e) => {
  if (e.data?.type === 'WAYPOINT_PALETTE_CLOSE') closePalette();
});
