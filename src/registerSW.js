// Service Worker Registration for PWA
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// PWA Install Prompt
let deferredPrompt;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show install banner automatically for better visibility
    showInstallBanner();
  });
}

export function showInstallBanner() {
  // Remove any existing install banners
  const existingBanner = document.getElementById('pwa-install-banner');
  if (existingBanner) {
    existingBanner.remove();
  }
  
  // Create install banner
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-banner-content">
      <div class="pwa-banner-icon">
        <img src="/icons/logo.svg" alt="AI Worker Plus" width="48" height="48" />
      </div>
      <div class="pwa-banner-text">
        <h4>Install AI Worker Plus</h4>
        <p>Add to your home screen for quick access and enhanced experience</p>
      </div>
      <button class="pwa-install-btn" id="pwa-install-button">Install</button>
      <button class="pwa-close-btn" id="pwa-close-button">✕</button>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #pwa-install-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #0F172A, #1E293B);
      color: white;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      border-bottom: 2px solid #8B5CF6;
      transform: translateY(-100%);
      animation: slideIn 0.5s forwards;
    }
    
    @keyframes slideIn {
      to {
        transform: translateY(0);
      }
    }
    
    .pwa-banner-content {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .pwa-banner-icon {
      flex-shrink: 0;
    }
    
    .pwa-banner-icon img {
      border-radius: 12px;
    }
    
    .pwa-banner-text {
      flex: 1;
      padding: 0 12px;
    }
    
    .pwa-banner-text h4 {
      margin: 0 0 4px 0;
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    .pwa-banner-text p {
      margin: 0;
      font-size: 0.9rem;
      color: #CBD5E1;
    }
    
    .pwa-install-btn {
      background: linear-gradient(135deg, #8B5CF6, #0EA5E9);
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.3s ease;
    }
    
    .pwa-install-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
    }
    
    .pwa-close-btn {
      background: transparent;
      color: #94A3B8;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      flex-shrink: 0;
      font-size: 1.2rem;
      transition: all 0.3s ease;
    }
    
    .pwa-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    @media (max-width: 768px) {
      .pwa-banner-content {
        flex-wrap: wrap;
      }
      
      .pwa-banner-text {
        order: 3;
        flex: 0 0 100%;
        padding: 12px 0 0 0;
      }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(banner);
  
  // Add event listeners
  document.getElementById('pwa-install-button').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      banner.remove();
    }
  });
  
  document.getElementById('pwa-close-button').addEventListener('click', () => {
    banner.remove();
  });
}

export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}