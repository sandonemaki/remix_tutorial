import type {
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";

import { useEffect } from "react";

import {
  Form,
  NavLink,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";


import appStylesHref from "./app.css?url";
import { createEmptyContact, getContacts } from "./data";

export const action = async () => {
  const contact = await createEmptyContact();
  return redirect(`/contacts/${contact.id}/edit`)
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

// データを読み込むために使用する API は 2 つあります。l
// loader と useLoaderData です。まず、ルートルートに loader 関数を生成してエクスポートし、その後データをレンダリングします。
export const loader = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  // ユーザーが入力した検索クエリを取得
  const q = url.searchParams.get("q");
  const contacts = await getContacts(q);
  // loader から q を返し、それを入力のデフォルト値として設定する
  return json({ contacts, q });
};



export default function App() {
  // loaderからの戻り値
  const { contacts, q } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  // 何も起こっていない場合、navigation.locationはundefinedになりますが、
  // ユーザーがナビゲートすると、データの読み込み中に次の場所が設定されます。
  // その後、location.searchを使用して、ユーザーが検索しているかどうかを確認します。
  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has(
      "q"
    );

  useEffect(() => {
    const searchField = document.getElementById("q");
    if (searchField instanceof HTMLInputElement) {
      searchField.value = q || "";
    }
  }, [q]);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="sidebar">
          <h1>Remix Contacts</h1>
          
          <div>
            <Form
              id="search-form"
              onChange={(event) => {
                // 最初の検索かどうかを簡単に確認した後、置き換えるかどうかを決定
                // 最初の検索では新しいエントリが追加されますが、それ以降のキーストロークはすべて現在のエントリを置き換えます。
                // 検索を削除するために7回戻るボタンをクリックする代わりに、ユーザーは1回戻るボタンをクリックするだけで済みます。
                
                // currentTargetは、イベントがアタッチされているDOMノード（form）
                const isFirstSearch = q === null;
                submit(event.currentTarget, {
                  replace: !isFirstSearch,
                });
              }}
              role="search"
            >
              <input
                id="q"
                aria-label="Search contacts"
                className={searching ? "loading" : ""}
                // loaderからの戻り値をデフォルトの値に設定
                defaultValue={q || ""}
                placeholder="Search"
                type="search"
                name="q"
              />
              <div
                id="search-spinner"
                aria-hidden
                hidden={!searching} 
              />
            </Form>
            <Form method="post">
              <button type="submit">New</button>
            </Form>
          </div>
          <nav>
            {contacts.length ? (
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <NavLink
                      className={({ isActive, isPending }) =>
                        isActive
                          ? "active"
                          : isPending
                          ? "pending"
                          : ""
                      }
                      
                      to={`contacts/${contact.id}`}
                    >
                      {contact.first || contact.last ? (
                        <>
                          {contact.first} {contact.last}
                        </>
                      ) : (
                        <i>名前なし</i>
                      )}{" "}
                      {contact.favorite ? (
                        <span>★</span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i>連絡先がありません</i>
              </p>
            )}
          </nav>
          {/* <nav>
            <ul>
              <li>
              <Link to={`/contacts/1`}>Your Name</Link>
              </li>
              <li>
              <Link to={`/contacts/2`}>Your Friend</Link>
              </li>
            </ul>
          </nav> */}
        </div>
        {/* loading クラスが適用されるのは detail divのみ */}
        <div 
          className={
            navigation.state === "loading" && !searching
              ? "loading"
              : ""
          }
          id='detail'
        >
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
