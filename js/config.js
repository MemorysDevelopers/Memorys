const FIREBASE_CONFIG = {
	apiKey: 'AIzaSyAvGm1r11N-wOBiKzPuWWHTB8KJhYhHGG8',
	authDomain: 'memorys-6d14e.firebaseapp.com',
	databaseURL: 'https://memorys-6d14e-default-rtdb.firebaseio.com',
	projectId: 'memorys-6d14e',
	storageBucket: 'gs://memorys-6d14e.appspot.com',
	messagingSenderId: '94373201418',
	appId: '1:94373201418:web:6b3d5f98a197131a9cc1f3',
	measurementId: 'G-FV0B7MQHBB'
};

const DEFAULT_ACCOUNT_IMAGE = './img/memoryslogo_skeleton.png';

// Vue.config.errorHandler = function(err, vm, info) {
// 	let logContent = String(err).replace(/(\r\n|\r|\n)/gi, ' ');
// 	$(function() {
// 		$.post('./Api/Log/Logout.php', {'content': logContent, 'type': 'error', 'directory': 'Error', 'user': ''});
// 	});
// }

window.onerror = function(errorMessage, filePath, rowNumber, columnNumber, errorObject) {
	let logContent = 'error message [' + errorMessage + '] / error location [' + filePath + ' (row ' + rowNumber + ', col ' + columnNumber + ')] / error object [' + String(errorObject) + ']';
	$(function() {
		$.post('./Api/Log/Logout.php', {'content': logContent, 'type': 'error', 'directory': 'Error', 'user': ''});
		$.post('./Api/Mail/SendMail.php', {'error': logContent});
	});
}