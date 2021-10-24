<?php

require '../../Config/UploadPath.php';

$rootDir = '../../';

$accountImageUploadFolder = $rootDir . ACCOUNT_IMAGE_UPLOAD_PATH . $_POST['userId'];
$accountImageTempUploadFile = $_FILES['accountImage']['tmp_name'];
$accountImageUploadFile = $accountImageUploadFolder . '/account.jpg';

if (is_dir($accountImageUploadFolder) == false) {
  mkdir($accountImageUploadFolder, 0755);
}

if (is_uploaded_file($accountImageTempUploadFile)) {
  if (move_uploaded_file($accountImageTempUploadFile, $accountImageUploadFile)) {

    // ファイルを読み込めるように権限を設定
    chmod($accountImageUploadFile, 0755);
    
    echo '1';
  } else {
    echo '0';
  }
} else {
  echo '-1';
}