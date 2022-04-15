<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

try {

  // POST用のクエリパラメータを作成する
  $queryUserId = $_POST['userId'];
  $queryCommunityId = $_POST['communityId'];
  $queryMemberName = $_POST['memberName'];
  $paramQuery = http_build_query(['param' => '{"userId":"' . $queryUserId . '","communityId":"' . $queryCommunityId . '","memberName":"' . $queryMemberName . '"}']);

  $functions = new PostFunctions();
  $response = $functions->ExecutePost($paramQuery, MAIN_HOST . DB_API_JOINING_COMMUNITY);
  // 改行コードを削る
  $response = str_replace("\n", '', str_replace("\r", '', $response));

  echo $response;

} catch(Exception $e) {

  echo '0';

}