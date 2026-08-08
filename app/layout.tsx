import "./globals.css"

export const metadata = {
  title: "미루지말자",
  description: "부모와 자녀가 함께 쓰는 미션형 클라우드 다이어리",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
