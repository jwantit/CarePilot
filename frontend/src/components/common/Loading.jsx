import { Loader2 } from "lucide-react";

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2
        className="animate-spin border-4 border-cp-border border-t-teal-400 rounded-full"
        size={40}
      />
      <p className="text-cp-muted text-sm font-mono">로딩 중...</p>
    </div>
  );
}

export default Loading;


