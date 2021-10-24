<?php

require '../../Config/Authentication.php';

$signInUserId = $_POST['userId'];
echo ($signInUserId === ADMIN_USER_ID) ? '1' : '0';