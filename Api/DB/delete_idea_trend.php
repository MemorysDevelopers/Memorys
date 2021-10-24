<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

try {

  // POST用のクエリパラメータを作成する
  $paramTargetUserId = http_build_query(['param' => $_POST['userId']]);

  $functions = new PostFunctions();
  $response = $functions->ExecutePost($paramTargetUserId, MAIN_HOST . DB_API_DELETE_IDEA_TREND);

  echo trim($response);

} catch(Exception $e) {

  echo '0';

}