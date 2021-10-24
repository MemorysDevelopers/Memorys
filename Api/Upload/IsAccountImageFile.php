<?php

require '../../Config/UploadPath.php';

$rootDir = '../../';

echo (is_file($rootDir . ACCOUNT_IMAGE_UPLOAD_PATH . $_POST['userId'] . '/account.jpg')) ? '1' : '0';