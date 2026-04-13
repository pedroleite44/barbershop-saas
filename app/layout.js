import "./globals.css"; // ✅ ADICIONADO: Importação dos estilos globais para remover as bordas
import { Providers } from "@/components/Providers"; // Importe o componente

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, backgroundColor: 'black' }}>
        {/* Envolva o conteúdo com o Providers */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}