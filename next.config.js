/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfkit (dependencia de @react-pdf/renderer) carga sus fuentes estándar
  // (Helvetica, etc.) con un require() dinámico que el rastreador de
  // archivos de Vercel no detecta solo — sin esto, la función serverless
  // del informe falla con "Cannot find module .../standard-fonts/Helvetica.cjs".
  experimental: {
    outputFileTracingIncludes: {
      "/api/informes/generar": ["./node_modules/pdfkit/js/standard-fonts/**/*"],
    },
  },
};

module.exports = nextConfig;
