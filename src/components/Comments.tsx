import { MessageCircle } from "lucide-react";
import { toast } from "./ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/integrations/wallet/use-account";
import { CommentForm } from "./comments/CommentForm";
import { CommentList } from "./comments/CommentList";

interface CommentsProps {
  isMobile?: boolean;
}

export const Comments = ({ isMobile = false }: CommentsProps) => {
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  
  console.log('Comments component wallet state:', { address, isConnected });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', isMobile ? 'mobile' : 'desktop'],
    queryFn: async () => {
      if (!isConnected || !address) {
        console.log('Not fetching comments - not connected');
        return [];
      }

      console.log('Fetching general comments');

      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, updated_at, user_id')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: "Error loading comments",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      console.log('Fetched comments:', data);
      return data || [];
    },
    enabled: isConnected && !!address,
    retry: false,
    refetchOnWindowFocus: false
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log('Starting comment mutation with wallet state:', { address, isConnected });
      
      if (!isConnected) {
        console.error('Wallet not connected');
        throw new Error("Please connect your wallet first");
      }

      if (!address) {
        console.error('No wallet address available');
        throw new Error("Must be connected to post a comment");
      }

      const commentData = {
        content,
        user_id: address,
        updated_at: new Date().toISOString()
      };
      
      console.log('Attempting to save comment with data:', commentData);

      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select('*')
        .single();
      
      if (error) {
        console.error('Supabase error posting comment:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(error.message);
      }
      
      console.log('Successfully saved comment with data:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', isMobile ? 'mobile' : 'desktop'] });
      toast({
        title: "Comment posted!",
        description: "Your comment has been added to the discussion.",
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (!isConnected || !address) {
    return (
      <div className="w-full h-full bg-crypto-dark/50 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-crypto-primary" />
          <h3 className="text-lg font-semibold text-crypto-primary">Comments</h3>
        </div>
        <p className="text-center text-gray-500">Please connect your wallet to view and post comments.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-crypto-dark/50 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-crypto-primary" />
        <h3 className="text-lg font-semibold text-crypto-primary">Comments</h3>
      </div>

      <CommentForm 
        addCommentMutation={addCommentMutation}
        spotExists={true}
      />

      <CommentList 
        comments={comments}
        isLoading={isLoading}
      />
    </div>
  );
};