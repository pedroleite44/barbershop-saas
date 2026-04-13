import { Providers } from "@/components/Providers"; // Importe o componente

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Envolva o conteúdo com o Providers */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
