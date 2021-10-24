<?php

class PostFunctions {
  // curlによるPost送信を実現する関数
  public function ExecutePost($query, $postPath) {
    // HTTPヘッダ部を作成
    $header = [
      'Content-Type: application/x-www-form-urlencoded',
      'Authorization: Bearer ',
      'Content-Length' . strlen($query)
    ];

    // POST送信先指定
    $ch = curl_init($postPath);

    // 各種オプションを設定
    $options = [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_POST           => true,
      CURLOPT_HTTPHEADER     => $header,
      CURLOPT_POSTFIELDS     => $query,
    ];
    // HTTP1.1で通信を行う
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    // 各種オプション設定を適用する
    curl_setopt_array($ch, $options);

    // 思考メモ解析APIを実行
    $apiResult = curl_exec($ch);

    // 実行結果情報を取得
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    $response = '';
    if ($error) {
      $response = 'error code : ' . $errno . ' - error content : ' . $error;
    }
    switch ($http_code) {
      case 200:
        $response = $apiResult;
        break;
      default:
        $response .= ' - failed http code : ' . $http_code;
        break;
    }

    curl_close($ch);

    return $response;
  }
}
