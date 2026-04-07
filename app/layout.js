export const metadata = {
  title: "BarberSaaS - Sistema de Agendamento",
  description: "Sistema de agendamento para barbearias",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body style={{
        margin: 0,
        backgroundColor: "#0A0A0A",
        color: "#fff",
        fontFamily: "Arial, sans-serif"
      }}>
        {children}
      </body>
    </html>
  );
}
