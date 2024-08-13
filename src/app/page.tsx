import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const HomeClient = dynamic(() => import('./page.client'), { ssr: false })

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeClient />
    </Suspense>
  )
}