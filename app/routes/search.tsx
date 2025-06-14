import { useEffect, useRef } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { Article, type ArticleJson } from "~/domain/Article";
import type { Route } from "../+types/root";
import BlogCardWithFavorite from "~/components/BlogCardWithFavorite";
import { SearchIcon } from "lucide-react";
import { motion } from "motion/react";

async function fetchArticles(keywords?: string) {
  const query = keywords
    ? `user:Sicut_study+title:${keywords}`
    : "user:Sicut_study";

  const token = process.env.QIITA_API_TOKEN;
  if (!token) {
    throw new Error("QIITA_API_TOKEN is not set in environment variables.");
  }

  const res = await fetch(
    `https://qiita.com/api/v2/items?page=1&per_page=20&query=${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const articlesJson: ArticleJson[] = await res.json();
  const articles = articlesJson.map(
    (articleJson) =>
      new Article(
        articleJson.title,
        articleJson.url,
        articleJson.likes_count,
        articleJson.stocks_count,
        articleJson.created_at
      )
  );
  return { articles };
}

export async function loader({ params }: Route.LoaderArgs) {
  const { articles } = await fetchArticles();
  return { articles };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const { _action } = Object.fromEntries(formData);

  switch (_action) {
    case "search": {
      const keywords = formData.get("keywords") as string;
      const { articles } = await fetchArticles(keywords);
      return { articles };
    }
    case "like": {
      const title = formData.get("title");
      console.log(`${title}をお気に入り登録しました。`);

      const { articles } = await fetchArticles();
      return { articles };
    }
  }
}

export default function search() {
  const formRef = useRef<HTMLFormElement>(null);
  const fetcher = useFetcher<{ articles: Article[] }>();
  const loader = useLoaderData<{ articles: Article[] }>();
  const articles = fetcher.data?.articles || loader.articles;
  useEffect(() => {
    if (fetcher.state === "idle") {
      formRef.current?.reset();
    }
  }, [fetcher]);
  return (
    <div className="flex sm:ml-64">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <h2 className="mb-6 text-3xl font-bold text-gray-300">記事検索</h2>
        <fetcher.Form
          ref={formRef}
          action="/search"
          method="post"
          className="mb-8 flex"
        >
          <input
            type="text"
            name="keywords"
            placeholder="キーワードを入力..."
            className="flex-grow rounded-l-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            name="_action"
            value="search"
            className="flex items-center rounded-r-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            <SearchIcon className="mr-2 h-5 w-5" />
            検索
          </button>
        </fetcher.Form>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <BlogCardWithFavorite key={article.url} article={article} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
