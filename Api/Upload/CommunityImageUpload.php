<?php

require '../../Config/UploadPath.php';

$rootDir = '../../';

$communityImageUploadFolder = $rootDir . COMMUNITY_IMAGE_UPLOAD_PATH . $_POST['communityId'];
$communityImageTempUploadFile = $_FILES['communityImage']['tmp_name'];
$communityImageUploadFile = $communityImageUploadFolder . '/' . $_FILES['communityImage']['name'];

if (is_dir($communityImageUploadFolder) == false) {
  mkdir($communityImageUploadFolder, 0755);
}

if (is_uploaded_file($communityImageTempUploadFile)) {
  if (move_uploaded_file($communityImageTempUploadFile, $communityImageUploadFile)) {

    // ファイルを読み込めるように権限を設定
    chmod($communityImageUploadFile, 0755);
    
    echo '1';
  } else {
    echo '0';
  }
} else {
  echo '-1';
}