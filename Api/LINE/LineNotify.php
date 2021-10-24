<?php

// アクセス通知
$accessMessage = (isset($_POST["accessMessage"])) ? $_POST["accessMessage"] : "";
if (strlen($accessMessage) > 0) {
    NotifyAccess($accessMessage);
}

// チャット投稿通知
$notifyMessage = (isset($_POST["notifyMessage"])) ? $_POST["notifyMessage"] : "";
if (strlen($notifyMessage) > 0) {
    NotifyChat($notifyMessage);
}

/**
 * サイトアクセス通知
 * @param $message アクセス通知を行う際のメッセージ内容
 */
function NotifyAccess($message) {
    // アクセス用トークン[アクセス]
    $token = "fyCreYFEpb9yr8NAAmQdCU3ZDaGgUor0w7GHDgzHQsA";

    // LINE通知実行
    NotifyLine($message, $token);
}

/**
 * チャット投稿通知
 * @param $message アクセス通知を行う際のメッセージ内容
 */
function NotifyChat($message) {
    // チャットメッセージ通知用トークン[チャット]
    $token = "yBH4BLAJQgJkh0QHifPJhL3r6ankDO2zs50C3iaZAnL";

    // LINE通知実行
    NotifyLine($message, $token);
}

/**
 * LINE通知
 * @param $message LINE通知を行う際のメッセージ内容
 * @param $token LINE通知用トークン(通知目的別)
 */
function NotifyLine($message, $token) {
    // リクエストヘッダの作成
    $query = http_build_query(['message' => $message]);
    $header = [
        'Content-Type: application/x-www-form-urlencoded',
        'Authorization: Bearer ' . $token,
        'Content-Length' . strlen($query)
    ];
    
    $ch = curl_init('https://notify-api.line.me/api/notify');
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => $header,
        CURLOPT_POSTFIELDS     => $query,
    ];
    
    curl_setopt_array($ch, $options);
    curl_exec($ch);
    curl_close($ch);
}

?>