export interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
}

export interface CommentsProps {
  spotId: number;
}