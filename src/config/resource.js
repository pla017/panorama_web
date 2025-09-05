const isProd = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;
// 生产走同源 /files，经由 Vercel 重写至源站，避免 Mixed Content；开发使用 Vite 代理
const base = isProd ? '/files' : '/proxy/check/report/8005/files';

let config = {
  file1: `${base}/1_.xml`,
  mesh: `${base}/mesh.ply`,
  meshImage: `${base}/mesh0.png`,
  sparsePoint: `${base}/sparse_point.ply`,
  video: `${base}/stitched_output.mp4`,
  image: `${base}/20250827-184023.jpg`,
};

export default config;
