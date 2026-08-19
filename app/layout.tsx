import "./globals.css"

export const metadata = {
  title: "미루지말자",
  description: "부모와 자녀가 함께 쓰는 미션형 클라우드 다이어리",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
