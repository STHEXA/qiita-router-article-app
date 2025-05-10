import { useEffect, useRef } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { Article, type ArticleJson } from "~/domain/Article";
import type { Route } from "../+types/root";

async function fetchArticles(keywords?: string) {
  const query = keywords
    ? `user:Sicut_study+title:${keywords}`
    : "user:Sicut_study";

  const res = await fetch(
    `https://qiita.com/api/v2/items?page=1&per_page=20&query=${query}`,
    {
      headers: {
        Authorization: `Bearer b2ae6b758c9e6fb87f07ac5d111f4e5de565e9d0`,
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
    <div className="flex-1 sm:ml-64">
      <div>
        <fetcher.Form method="post" ref={formRef}>
          <input type="text" name="keywords" />
          <button type="submit" name="_action" value="search">
            Submit
          </button>
        </fetcher.Form>
      </div>
      <div>
        {articles.map((article) => (
          <div key={article.url}>
            <p>{article.title}</p>
            <fetcher.Form method="post">
              <input
                type="hidden"
                name="title"
                value={article.title}
                readOnly
              />
              <button type="submit" name="_action" value="like">
                ★
              </button>
            </fetcher.Form>
          </div>
        ))}
      </div>
    </div>
  );
}
