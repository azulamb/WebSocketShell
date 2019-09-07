# WebSocketShell

[English](./README.md)

## 警告

このサーバーはコマンドを外部から実行し放題で大変危険です。

## 準備

```sh
npm i
```

## 実行

```sh
npm run start
```

### デバッグモード

```sh
npm run debug
```

環境変数 `NODE_ENV` に `debug` を設定して通常起動しても効果があります。

ただし、設定ファイル `config.json` にデバッグモード関連の値が設定されている場合は、そちらを優先します。

## 設定

`config.json` という名前で設定ファイルを作る事ができます。

* server
  * debug
    * boolean
    * trueでデバッグモード。
    * ここに値が入っている場合、環境変数によるデバッグモード指定は無効化されます。
* push

## ブラウザ

URLのパラメーターを使って設定が可能です。

### モード

* `debug`
  * 開発者モードのコンソールにログを出力するようになります。

### lines = 1024

表示する最大行数を指定できます。
省略した場合は1024です。

## 開発

### 開発準備

Typescriptを使っています。インストールしていない場合は以下コマンドでインストールしてください。

```sh
npm i typescript
```

### ビルド

VisualStudio codeで `vscode.code-workspace` を開き、 `tsc build` でビルド可能です。

npmを使って以下のようにも可能です。

```sh
npm run build
```
