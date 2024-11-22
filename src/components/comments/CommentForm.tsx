import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { UseMutationResult } from "@tanstack/react-query";

interface CommentFormProps {
  addCommentMutation: UseMutationResult<any, Error, string, unknown>;
  spotExists: boolean;
}

export const CommentForm = ({ addCommentMutation, spotExists }: CommentFormProps) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
    setNewComment('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <Textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Add to the discussion..."
        className="mb-2 w-full"
      />
      <Button 
        type="submit" 
        disabled={!newComment.trim() || addCommentMutation.isPending || !spotExists}
        className="w-full md:w-auto"
      >
        {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
      </Button>
    </form>
  );
};