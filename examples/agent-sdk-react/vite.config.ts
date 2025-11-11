import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  if (command === 'build') {
    // Configuration for 'npm run build'
    return {
      plugins: [react()],
      base: '/examples/agent-sdk-react/dist', // Your subfolder name
    }
  } else {
    // Configuration for 'npm run dev'
    return {
      plugins: [react()],
      // No 'base' is specified, so it defaults to '/'
    }
  }
})