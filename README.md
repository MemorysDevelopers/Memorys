# Memorys

## はじめに
こちらは、個々のアイデアからより洗練されたアイデアを生み出すためのアプリ「Memorys」を開発していくためのリポジトリになります。
一緒に楽しく開発していきましょう♪

## 開発環境
### まずは、ローカルPCに開発するための環境を整えます
具体的には、**XAMPP**と呼ばれるツールをダウンロード・インストールする事のみとなります。

ダウンロード先：[https://www.apachefriends.org/jp/download.html](https://www.apachefriends.org/jp/download.html)

※ダウンロード方法については、こちらの記事が参考になります。[https://www.webdesignleaves.com/pr/plugins/xampp_01.html](https://www.webdesignleaves.com/pr/plugins/xampp_01.html)

## Git利用方法
### こちらの記事が勉強になります。
[https://tracpath.com/bootcamp/learning_git_firststep.html](https://tracpath.com/bootcamp/learning_git_firststep.html)

[https://tech-blog.rakus.co.jp/entry/20200529/git](https://tech-blog.rakus.co.jp/entry/20200529/git)

[https://backlog.com/ja/git-tutorial/intro/01/](https://backlog.com/ja/git-tutorial/intro/01/)

※詰まった場合は、Fukudaまで聞いてください♪

### １．コマンドを用いて、より開発者っぽい画面で操作したい場合（CUI）

#### ネット上にあるリポジトリからローカルPCへクローンを作成する
```
git clone https://github.com/MemorysDevelopers/Memorys.git
```

#### ローカル環境のソースコードに対して、他のメンバーがアップしたコードを落としてくる
```
git pull origin develop
```
※developの部分は、対象リポジトリ毎に異なる

#### ローカル環境のソースコードの更新状態を閲覧する
```
git status
```

#### ローカル環境のコミット履歴を確認する
```
git log
```

#### ローカル環境のソースコードをコミットする準備を行う
```
git add .
```
※.の部分は、コミットしたいファイルを指定するための部分となる。.は全てのファイルをコミットに含めるという意味

#### ローカル環境にて、更新したコードのコミットを行う
```
git commit -m "コミットメッセージ"
```
※"コミットメッセージ"には、できるだけ更新内容がわかるようにメッセージを記載する

#### ローカル環境のソースコードをみんなが見える場所へアップする
```
git push origin develop
```
※developの部分は、対象リポジトリ毎に異なる