import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default es 1mb — el formulario de nuevo alquiler sube hasta 3 fotos en un solo submit.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
