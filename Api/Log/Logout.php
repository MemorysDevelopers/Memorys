<?php

// 出力ログファイル名
$nowDay = date('Ymd');
$outlogFileName = $_POST['type'] . '_' . $nowDay . '.log';

// ログ対象ユーザー名
$userName = $_POST['user'];

// ログ出力内容
$content = date('Y/m/d H:i:s') . ' : ' . $_POST['content'] . ' : ' . $userName . "\n";

// ログ出力先
$directory = $_POST['directory'];

// ログ出力
$f = fopen($directory . '/' . $outlogFileName, 'a');
fwrite($f, $content);
fclose($f);