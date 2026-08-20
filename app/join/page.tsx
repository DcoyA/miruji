import type { Metadata } from "next";
import JoinClient from "./JoinClient";

export const metadata: Metadata = {
  title: "미루지말자 초대장이 도착했어요",
  description: "가족, 친구와 함께 할 일을 나눠보세요. 링크를 눌러 초대를 확인하세요!",
  openGraph: {
    title: "미루지말자 초대장이 도착했어요",
    description: "가족, 친구와 함께 할 일을 나눠보세요. 링크를 눌러 초대를 확인하세요!",
    images: ["/invite-og-image.png"],
  },
};

export default function JoinPage() {
  return <JoinClient />;
}
