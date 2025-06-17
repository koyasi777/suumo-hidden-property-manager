# SUUMO物件非表示マネージャ 🏠

## 📌 概要

**SUUMO賃貸** の「建物ごとに表示」検索結果ページに「非表示」ボタンを追加し、  
気になる物件を一時的に一覧から隠すことができるユーザースクリプトです。

- 🧹 一覧から不要な物件をワンクリックで非表示に
- 🔄 非表示物件はモーダルUIからいつでも復活可能
- 💾 記録はローカルストレージに保存され、次回表示時も有効

---

## ⚙️ インストール方法

1. お使いのブラウザに **[Violentmonkey](https://violentmonkey.github.io/)** または **[Tampermonkey](https://www.tampermonkey.net/)** を導入
2. 以下のリンクからスクリプトをインストール  
   👉 [このスクリプトをインストールする](https://raw.githubusercontent.com/koyasi777/suumo-hidden-property-manager/main/suumo-hidden-property-manager.user.js)

---

## 💡 主な機能

- SUUMOの「建物ごとに表示」検索結果に「非表示」ボタンを追加
- 非表示対象はローカルストレージで保存（永続）
- 復活機能付きの管理UI（モーダル）を提供
- 全リセットボタンあり（確認ダイアログ付き）
- スタイリッシュで日本語フォントにも対応したUIデザイン

---

## 🖼 対応ページ

```
https://suumo.jp/jj/chintai/ichiran/FR*
```

このスクリプトは**「建物ごとに表示」**形式の検索結果に対応しています。  
「部屋ごとに表示」形式では動作しませんのでご注意ください。

---

## 🌐 英語版説明（for international users）

Hide unwanted rental listings in SUUMO (Japanese real estate portal) from the **grouped-by-building** search results view.  
You can manage hidden properties via a stylish modal and restore them anytime.

- LocalStorage-based hidden item management  
- Modal UI for restore and bulk reset  
- No server or GM_* APIs needed

---

## 📜 ライセンス

MIT License

---

> 不要な物件をサクッと非表示、あとで復活もOK。  
> SUUMOの物件探しをもっと快適に！
