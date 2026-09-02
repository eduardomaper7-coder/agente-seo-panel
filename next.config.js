/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfkit (dependencia de @react-pdf/renderer) carga sus fuentes estándar
  // (Helvetica, etc.) con un require() dinámico que el rastreador de
  // archivos de Vercel no detecta solo — sin esto, la función serverless
  // del informe falla con "Cannot find module .../standard-fonts/Helvetica.cjs".
  experimental: {
    outputFileTracingIncludes: {
      // pdfkit necesita sus fuentes estándar (Helvetica, etc.) aunque no las
      // usemos directamente — algún fallback interno las referencia — y el
      // informe rediseñado embebe la tipografía Inter y el logo oficial de
      // Aibe Technologies desde disco (más fiable en una función serverless
      // que depender de una petición de red a mitad de la generación).
      "/api/informes/generar": [
        "./node_modules/pdfkit/js/standard-fonts/**/*",
        "./public/brand/**/*",
        "./public/fonts/**/*",
      ],
    },
  },
};

module.exports = nextConfig;
