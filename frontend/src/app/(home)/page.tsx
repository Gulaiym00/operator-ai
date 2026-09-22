import { Suspense } from "react";
import ChatAI from "@/components/pages/chatAI/ChatAI";

// ChatAI читает ?c=<id> через useSearchParams — ему нужна Suspense-граница
const page = () => {
  return (
    <Suspense fallback={null}>
      <ChatAI />
    </Suspense>
  );
};

export default page;
