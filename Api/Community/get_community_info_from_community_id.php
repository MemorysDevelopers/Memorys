<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

try {

  // POST用のクエリパラメータを作成する
  $queryCommunityId = $_POST['communityId'];
  $paramQuery = http_build_query(['param' => '{"communityId":"' . $queryCommunityId . '"}']);

  $functions = new PostFunctions();
  $response = $functions->ExecutePost($paramQuery, MAIN_HOST . DB_API_SELECT_COMMUNITY_INFO_FROM_COMMUNITY_ID);
  // 改行コードを削る
  $response = str_replace("\n", '', str_replace("\r", '', $response));

  echo $response;

} catch(Exception $e) {

  echo '0';

}