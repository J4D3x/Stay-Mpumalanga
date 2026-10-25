import './globals.css';
import { Nav } from '@/components/Nav';
export const metadata={title:'ResLink | Student Accommodation',description:'Find, compare and apply for student accommodation in Mpumalanga.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Nav/>{children}<footer><div><strong>ResLink</strong><span> Student accommodation made easier.</span></div><small>© 2026 ResLink</small></footer></body></html>}
