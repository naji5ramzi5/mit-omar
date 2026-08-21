type ToastType = 'success' | 'error';

function showToast(message: string, type: ToastType) {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.textContent = message;
  el.style.position = 'fixed';
  el.style.top = '20px';
  el.style.left = '50%';
  el.style.transform = 'translateX(-50%)';
  el.style.zIndex = '99999';
  el.style.padding = '12px 22px';
  el.style.borderRadius = '12px';
  el.style.color = '#fff';
  el.style.fontWeight = '700';
  el.style.fontSize = '14px';
  el.style.fontFamily = 'system-ui, sans-serif';
  el.style.boxShadow = '0 12px 30px rgba(0,0,0,0.25)';
  el.style.direction = 'rtl';
  el.style.maxWidth = '90vw';
  el.style.textAlign = 'center';
  el.style.background = type === 'success' ? 'linear-gradient(135deg,#E85D26,#DC3545)' : '#dc2626';
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, 2800);
  });
}

export const toast = {
  success: (m: string) => showToast(m, 'success'),
  error: (m: string) => showToast(m, 'error'),
};
