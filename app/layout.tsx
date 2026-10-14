import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'FARO · Revisión de vencimientos',description:'Agente académico con inventario sintético, fuentes verificables y revisión humana.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
