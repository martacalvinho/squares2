import { ScrollArea } from "../ui/scroll-area";
import { User } from "lucide-react";
import { Comment } from "@/types/comment";
import { formatTimeAgo } from "@/utils/commentUtils";

interface CommentListProps {
  comments: Comment[];
  isLoading: boolean;
}

export const CommentList = ({ comments, isLoading }: CommentListProps) => {
  console.log('CommentList received comments:', comments);

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading comments...</p>;
  }

  if (comments.length === 0) {
    return <p className="text-center text-gray-500">No comments yet. Be the first to comment!</p>;
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {comments.map((comment) => {
          console.log('Rendering comment:', comment);
          return (
            <div
              key={comment.id}
              className="p-3 rounded-lg bg-gradient-to-r from-crypto-dark/80 to-crypto-dark/60 border border-crypto-primary/10"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 hidden md:block">
                  <User className="w-4 h-4 text-crypto-primary/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-crypto-primary text-sm md:text-base truncate">
                      {comment.user_id ? `${comment.user_id.slice(0, 6)}...${comment.user_id.slice(-4)}` : 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1 break-words">{comment.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};