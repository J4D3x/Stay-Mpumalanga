import './globals.css';
import { Nav } from '@/components/Nav';
export const metadata={title:'StayMpumalanga | Student Accommodation',description:'Find, compare and apply for student accommodation in Mpumalanga.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Nav/>{children}<footer><div><strong>StayMpumalanga</strong><span> Student accommodation made easier.</span></div><small>© 2026 StayMpumalanga</small></footer></body></html>}
