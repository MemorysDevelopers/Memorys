<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

try {

  // POST用のクエリパラメータを作成する
  $queryUserId = $_POST['userId'];
  $queryCommunityId = $_POST['communityId'];
  $queryMemberName = $_POST['memberName'];
  $queryIdeaTrendList = $_POST['ideaTrendList'];
  $queryCommunityName = $_POST['communityName'];
  $queryDescription = $_POST['description'];
  $queryImageName = $_POST['imageName'];
  $paramQuery = http_build_query(['param' => '{"userId":"' . $queryUserId . '","communityId":"' . $queryCommunityId . '","memberName":"' . $queryMemberName . '","ideaTrendList":"' . $queryIdeaTrendList . '","communityName":"' . $queryCommunityName . '","description":"' . $queryDescription . '","imageName":"' . $queryImageName . '"}']);

  $functions = new PostFunctions();
  $response = $functions->ExecutePost($paramQuery, MAIN_HOST . DB_API_UPDATE_COMMUNITY_INFO);
  // 改行コードを削る
  $response = str_replace("\n", '', str_replace("\r", '', $response));

  echo $response;

} catch(Exception $e) {

  echo '0';

}