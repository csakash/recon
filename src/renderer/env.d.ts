import type { ReconAPI } from '../preload/index'

declare global {
  interface Window {
    recon: ReconAPI
  }
}
