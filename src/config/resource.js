const isProd = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;
// 生产走同源 /files（Vercel 重写到线上），开发走本地 public/Out
const base = isProd ? '/files' : '/Out';

let config = {
  file1: `${base}/1_.xml`,
  mesh: `${base}/mesh.ply`,
  meshImage: `${base}/mesh0.png`,
  sparsePoint: `${base}/sparse_point.ply`,
  video: `${base}/stitched_output.mp4`,
  image: `${base}/20250827-184023.jpg`,
};

export default config;
