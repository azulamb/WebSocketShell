# WebSocketShell

[日本語はこちら](./README_JA.md)

## Wraning

This is very dangerous system.
You can exec command in Web site.

## Prepare

```sh
npm i
```

## Run

```sh
npm run start
```

### Debug mode

```sh
npm run debug
```

or set environment variable `NODE_ENV` to `debug` .

( Disable debug mode set debug value in `config.json` . )

## Config

You can prepare config file.

File name is `config.json` .

* server
  * debug
    * boolean
    * true is debug mode.
    * false is no debug mode if you set NODE_ENV = debug.
* push

## Browser

You can configured with URL params.

### mode

* `debug`
  * Output debug log in console.

### lines = 1024

You can set show lines.
Default 1024.

## Develop

### Prepare(build)

Need typescript.

```sh
npm i typescript
```

### build

Open `vscode.code-workspace` with VisualStudio code and `tsc build`

or

```sh
npm run build
```
