import { model, Schema } from "mongoose";

interface Article {
  title: string;
  content: string;
  image: {
    url: string;
    public_id: string;
  };
}

export const articleSchema = new Schema<Article>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true },
);

const ArticleModel = model<Article>("Articles", articleSchema);

export default ArticleModel;
