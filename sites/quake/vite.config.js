import { defineConfig } from 'vite'

/**
 * 子路径部署：产物装配进整站 site/quake/，挂 japan.ouuut.com/quake/。
 * base './' 让产物引用全相对，根部署与子路径双兼容。
 */
export default defineConfig({
  base: './',
})
