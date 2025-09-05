const isProd = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;
const base = isProd ? 'http://42.193.255.168' : '/proxy';

let config = {
  file1: `${base}/check/report/8005/files/1_.xml`,
  mesh: `${base}/check/report/8005/files/mesh.ply`,
  meshImage: `${base}/check/report/8005/files/mesh0.png`,
  sparsePoint: `${base}/check/report/8005/files/sparse_point.ply`,
  video: `${base}/check/report/8005/files/stitched_output.mp4`,
  image: `${base}/check/report/8005/files/20250827-184023.jpg`,
};

export default config;
