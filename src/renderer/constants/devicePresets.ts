export interface DevicePreset {
  id: string
  name: string
  category: 'desktop' | 'tablet' | 'mobile'
  width: number
  height: number
}

export const DEVICE_PRESETS: DevicePreset[] = [
  // Desktop
  { id: 'macbook-air-13', name: 'MacBook Air 13"', category: 'desktop', width: 1440, height: 900 },
  { id: 'macbook-pro-14', name: 'MacBook Pro 14"', category: 'desktop', width: 1512, height: 982 },
  { id: 'macbook-pro-16', name: 'MacBook Pro 16"', category: 'desktop', width: 1728, height: 1117 },
  { id: 'desktop-1080p', name: 'Desktop 1080p', category: 'desktop', width: 1920, height: 1080 },
  { id: 'desktop-1440p', name: 'Desktop 1440p', category: 'desktop', width: 2560, height: 1440 },
  // Tablet
  { id: 'ipad-mini', name: 'iPad Mini', category: 'tablet', width: 768, height: 1024 },
  { id: 'ipad-air', name: 'iPad Air', category: 'tablet', width: 820, height: 1180 },
  { id: 'ipad-pro-11', name: 'iPad Pro 11"', category: 'tablet', width: 834, height: 1194 },
  { id: 'ipad-pro-13', name: 'iPad Pro 13"', category: 'tablet', width: 1024, height: 1366 },
  // Mobile
  { id: 'iphone-se', name: 'iPhone SE', category: 'mobile', width: 375, height: 667 },
  { id: 'iphone-14', name: 'iPhone 14', category: 'mobile', width: 390, height: 844 },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', category: 'mobile', width: 393, height: 852 },
  { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', category: 'mobile', width: 430, height: 932 },
  { id: 'pixel-8', name: 'Pixel 8', category: 'mobile', width: 412, height: 915 },
  { id: 'galaxy-s24', name: 'Galaxy S24', category: 'mobile', width: 360, height: 780 },
]
