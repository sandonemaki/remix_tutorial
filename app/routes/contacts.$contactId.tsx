import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { ContactRecord, getContact, updateContact } from "../data";
import { FunctionComponent } from "react";


export const loader = async ({
  params,
}: LoaderFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const contact = await getContact(params.contactId);
  if (!contact) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ contact });
};

export const action = async ({
  params,
  request,
}: ActionFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const formData = await request.formData();
  // 連絡先を更新
  return updateContact(params.contactId, {
    favorite: formData.get("favorite") === "true",
  });
};


// ユーザーが /contacts/[id] のようなURLにアクセスすると、Remixのルーターがこのルートに対応するコンポーネントを探します
// ルートがマッチすると、Remixは自動的にこのファイルの default export である Contact 関数をレンダリングします。
// レンダリングの前に、同じファイル内の loader 関数が実行され、そのデータが Contact 関数内で useLoaderData フックを通じて利用可能になります。
export default function Contact() {
  const {contact} = useLoaderData<typeof loader>();
  // const contact = {
  //   first: "Your",
  //   last: "Name",
  //   avatar: "https://placecats.com/200/200",
  //   twitter: "your_handle",
  //   notes: "Some notes",
  //   favorite: true,
  // };

  return (
    <div id="contact">
      <div>
        <img
          alt={`${contact.first} ${contact.last} avatar`}
          key={contact.avatar}
          src={contact.avatar}
        />
      </div>

      <div>
        <h1>
          {contact.first || contact.last ? (
            <>
              {contact.first} {contact.last}
            </>
          ) : (
            <i>No Name</i>
          )}{" "}
          <Favorite contact={contact} />
        </h1>

        {contact.twitter ? (
          <p>
            <a
              href={`https://twitter.com/${contact.twitter}`}
            >
              {contact.twitter}
            </a>
          </p>
        ) : null}

        {contact.notes ? <p>{contact.notes}</p> : null}

        <div>
          <Form action="edit">
            <button type="submit">Edit</button>
          </Form>

          <Form
            action="destroy"
            method="post"
            onSubmit={(event) => {
              const response = confirm(
                "Please confirm you want to delete this record."
              );
              if (!response) {
                event.preventDefault();
              }
            }}
          >
            <button type="submit">Delete</button>
          </Form>
        </div>
      </div>
    </div>
  );
}

// Favoriteコンポーネントがcontactオブジェクトを受け取り、その中のfavoriteプロパティのみを使用する
const Favorite: FunctionComponent<{
  // contactオブジェクトがfavoriteプロパティのみを持つことを指定
  contact: Pick<ContactRecord, "favorite">;
}> = ({ contact }) => {
  const fetcher = useFetcher();
  const favorite = contact.favorite;

  return (
    // ページ遷移を引き起こさずにフォームを送信するためfetcher.Formを使用
    // actionを呼び出し、その後すべてのデータが自動的に再検証されます。エラーも同様にキャッチされます
    // Formとの違いは、ナビゲーションではないため、URLは変更されず、履歴スタックも影響を受けません。
    <fetcher.Form method="post">
      <button
        aria-label={
          favorite
            ? "Remove from favorites"
            : "Add to favorites"
        }
        name="favorite"
        value={favorite ? "false" : "true"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
};

