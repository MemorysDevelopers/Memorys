// 初期化処理
function Init() {
  let memorys = new Vue({
    el: '#memorys',
    data: {
      // アプリバージョン
      appVersion: '2.2',

      // デバイス情報
      deviceInfo: {},

      // ログイン情報
      signInUser: null,
      inputSignInUserAddress: '',
      inputSignInUserPassword: '',
      loginErrorMessage: '',
      isLoading: false,
      loginAccountList: [],
      MAX_LENGTH_LOGIN_ACCOUNT_LIST: 6,
      LOGIN_CHECK_INTERVAL: 1000 * 20,
      isAdminUser: false,

      // アカウント情報
      accountImage: DEFAULT_ACCOUNT_IMAGE,  // アカウントイメージパス
      updateMyPageResult: '',  // マイページ更新結果
      userConfig: {},
      
      memoryContent: '',  // 思考内容
      memoryList: [],  // 思考リスト
      memoryShareList: [],  // シェア対象思考リスト
      confirmShareMemory: {},  // シェア確認対象思考メモ情報
      topMemoryTrendList: [],

      page: 1,  // ページ識別子
      // ページ識別子定数定義
      PAGES: {
        PAGE_LOGIN: 0,
        PAGE_TOP: 1,
        PAGE_LIST: 2,
        PAGE_SHARE_LIST: 3,
        PAGE_INQUIRY: 4,
        PAGE_MY: 5,
        PAGE_MAINTE: 6,
      },
      listTitle: '',  // リストタイトル
      listType: 0,  // リスト種別
      // リスト識別子定数定義
      LIST_TYPE: {
        LIST_MEMORYS: 0,
        LIST_TASKS: 1,
      },

      // 時刻フォーマット定数定義
      DATE_FORMAT: {
        DATE_TIME: 'YYYY/MM/DD HH:mm:ss',
      },

      memoryInputHeight: 0,

      // 思考メモAI
      memoryAi: null,
      isAiMode: true,

      // 過去思考メモ呼び出しタイミングを示すプログレスバー値
      analysisByDatetimeProgress: '0',

      // お問い合わせ
      inquiryAddress: '',
      inquiryContent: '',
      inquiryCheck: '',
      inquiryResult: '',

      isCopyToClipboard: false,  // クリップボードへのコピーが可能か否か
      isCopyToClipboardSuccess: false,  // クリップボードへのコピーが成功したか否か

      // 検索系
      isSearchAiLoding: false,  // AI検索中の際に表示するロードアニメーション発動
      listAiSearchText: '',  // AI検索用検索キーワード

      // メンテ
      mainteUserId: '',

      // タスク
      taskList: [],
      TASK_CHECKED: '|■|',
      TASK_NO_CHECK: '|□|',
      TASK_CHECKED_HTML: '<i class="fas fa-check-circle"></i>',
      TASK_NO_CHECK_HTML: '<i class="far fa-check-circle"></i>',
      isListLoading: false,
      confirmArchive: {},
      isTaskClickStop: false,

    },
    // インスタンス作成時に呼び出される
    created: async function() {

      // デバイス情報を取得する
      this.deviceInfo = GetDeviceInfo();

      firebase.initializeApp(FIREBASE_CONFIG);

      // ログイン状態の保持を「セッション」単位とする
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

      // 内側ウィンドウ高さを設定する
      this.SetInnerWindowHeight();

      // 内側ウィンドウサイズが変更される際に高さを再設定する
      $(window).on('resize', this.SetInnerWindowHeight);

      // ログイン判定
      if (await this.IsSignIn() === false) {
        // ログイン用のページに遷移
        this.page = this.PAGES.PAGE_LOGIN;

        // アプリ追加説明カルーセルを動作させる
        this.StartPwaExplanationCarousel();

        return;
      }

      // アプリ起動ログ
      this.OutlogDebug('アプリが起動されました');
      
      this.isAdminUser = await this.IsAdminLogin();

      // ユーザー設定取得
      this.InitializeUserConfig();

      // 保存していた思考メモが存在する場合は、入力欄へ適用する
      this.SetInputMemory();

      // 保存していたアカウントイメージを適用する
      this.InitializeAccountImageToApp();

      // AIの動作を開始
      this.memoryAi = new MemorysAi(this.signInUser);
      this.memoryAi.PeriodicExecution(await this.GetMemoryList());

      // 解析結果のアニメーションを開始
      this.StartAnalyzedInfoAnimation();

      // 現在アクセス中のユーザーを解析する
      this.SendInitAccessInfo();
      this.StartGetNowLoginAccountList();

      // リスト種別初期値
      this.InitializeListType();
      
    },
    updated: function() {
      // タスクチェックイベント発行
      this.EventTaskCheck();
    },
    methods: {
      // 思考登録時の一連の処理
      RegistMemory: async function() {

        // 思考登録時の一連の処理実行ログ
        this.OutlogDebug('思考登録時の一連の処理が実行されました');
      
        if (this.IsContentTask()) {
          // タスク登録
          await this.MemoryTasks();

        } else {
          // 思考メモ登録
          await this.Memory();
        
        }

        // 記憶対象思考メモ確認用モーダルを閉じる
        $('#confirm-memorys-modal').modal('hide');

        // ロードアイコンを表示
        this.isLoading = true;

        // アイデア傾向/思考傾向記録実行ログ
        this.OutlogDebug('アイデア傾向/思考傾向記録が実行されました');

        // アイデア傾向/思考傾向記録実行
        this.RegistIdeaTrend(this.memoryContent, this.signInUser.uid);

        // AI解析実行ログ
        this.OutlogDebug('AI解析が実行されました');

        let analysisAiResult = false;
        if (this.IsContentTask() == false) {
          // AI解析
          analysisAiResult = await this.memoryAi.AnalysisAi(this.memoryContent);
        }
        
        // ロードアイコンを表示
        this.isLoading = false;

        // 思考メモ入力初期化
        this.memoryContent = '';
        // 保存思考メモを初期化する
        this.InitializeInputMemorys();

        // AIで解析した過去思考メモにデータがあった場合は画面へ表示する
        if (analysisAiResult == true) {

          // AI解析により抽出した思考メモを表示ログ
          this.OutlogDebug('AI解析により抽出した思考メモが表示されました');

          this.memoryAi.OutputDisplayContentAi('#memorys-ai-modal-body');
          this.memoryAi.OutputDisplayDayAgoMessage('#memorys-ai-modal-center-title');
          $('#memorys-ai-modal').modal({
            keyboard: true,
            focus: true,
            show: true,
          });
        }
      },
      // 思考登録
      Memory: function() {

        // 思考登録ログ
        this.OutlogDebug('思考登録が実行されました');

        return new Promise(resolve => {
          firebase.database().ref('Memorys/' + this.signInUser.uid + '/' + this.GetNowTimestamp()).set({
            content: this.memoryContent,
            registDate: this.GetNowDatetime(this.DATE_FORMAT.DATE_TIME),
          }, (err) => {
            if (err) {

            } else {

              // 管理者へ投稿された旨を通知
              if (DEVELOP_MODE === false) {
                $(function() {
                  $.post('./Api/LINE/LineNotify.php', {'notifyMessage': '思考メモが書かれました。'});
                });
              }

              resolve();
            }
          });
        });
      },
      // タスク登録
      MemoryTasks: function() {

        // タスク登録ログ
        this.OutlogDebug('タスク登録が実行されました');

        return new Promise(resolve => {
          firebase.database().ref('Tasks/' + this.signInUser.uid + '/' + this.GetNowTimestamp()).set({
            content: this.memoryContent,
            isArchive: '0',
            registDate: this.GetNowDatetime(this.DATE_FORMAT.DATE_TIME),
          }, (err) => {
            if (err) {

            } else {

              // 管理者へ投稿された旨を通知
              if (DEVELOP_MODE === false) {
                $(function() {
                  $.post('./Api/LINE/LineNotify.php', {'notifyMessage': 'タスクが書かれました。'});
                });
              }

              resolve();
            }
          });
        });
      },
      // 記憶対象の思考メモ内容を確認する
      ConfirmMemorys: function() {

        // 記憶ボタン押下ログ
        this.OutlogDebug('記憶ボタンが押下されました');

        if (this.memoryContent) {
          // 記憶対象思考メモ確認用モーダルを表示する
          $('#confirm-memorys-modal').modal('show');
        }
      },
      // 現在時刻のUNIXタイムを取得
      GetNowTimestamp: function() {
        return moment().valueOf();
      },
      // 指定フォーマットの現在時刻を取得
      GetNowDatetime: function(format) {
        return moment().format(format);
      },
      // 思考リストを取得
      GetMemoryList: function() {

        // 思考リスト取得ログ
        this.OutlogDebug('思考リストが取得されました');

        return new Promise(resolve => {
          let memoryListTemp;

          firebase.database().ref('Memorys/' + this.signInUser.uid).once('value', function(memorys) {
            let memoryVal = memorys.val();
            memoryListTemp = [];

            if (memoryVal) {
              Object.keys(memoryVal).reverse().forEach(function(memoryKey) {
                if (memoryKey > 0) {
                  memoryListTemp.push({
                    memoryKey: memoryKey,
                    content: memoryVal[memoryKey].content,
                    isShared: (memoryVal[memoryKey].isShared && memoryVal[memoryKey].isShared == '1') ? '1' : '0',
                    registDate: memoryVal[memoryKey].registDate,
                    previousDay: moment().diff(moment(memoryVal[memoryKey].registDate)),
                  });
                }
              });
            }

            resolve(memoryListTemp);
          });
        });
      },
      // タスクリストを取得
      GetTaskList: function() {

        // タスクリスト取得ログ
        this.OutlogDebug('タスクリストが取得されました');

        return new Promise(resolve => {
          let taskListTemp;

          firebase.database().ref('Tasks/' + this.signInUser.uid).once('value', function(tasks) {
            let taskVal = tasks.val();
            taskListTemp = [];

            if (taskVal) {
              Object.keys(taskVal).reverse().forEach(function(taskKey) {
                if (taskKey > 0 && taskVal[taskKey].isArchive == '0') {
                  taskListTemp.push({
                    taskKey: taskKey,
                    task: taskVal[taskKey].content,
                    registDate: taskVal[taskKey].registDate,
                    previousDay: moment().diff(moment(taskVal[taskKey].registDate)),
                  });
                }
              });
            }

            resolve(taskListTemp);
          });
        });
      },
      // AI検索キーワード入力を行う
      ShowInputAiSearch: function() {

        // AI検索ボタン押下ログ
        this.OutlogDebug('AI検索ボタンが押下されました');

        // AI検索キーワード入力用モーダルを表示する
        $('#ai-search-list-modal').modal('show');
      },
      // 思考一覧ページからAI検索を行う
      SearchAiFromMemoryList: async function() {
        if (this.isSearchAiLoding == false && this.listAiSearchText.trim().length > 0) {
          try {

            // AI検索処理実行ログ
            this.OutlogDebug('AI検索処理が実行されました');

            // AI検索キーワード入力用モーダルを非表示にする
            $('#ai-search-list-modal').modal('hide');

            // 検索結果を初期化
            this.memoryList = [];
            this.memoryList.splice();
  
            // ロボットによるロードアニメーションを開始する
            this.StartLoadingSearchRobot();

            // AIによる類似した思考メモの検索
            let searchAiResult = await this.memoryAi.SearchAi(this.listAiSearchText);

            if (searchAiResult != false) {
              this.memoryList = searchAiResult.filter(function(memorys) {
                let degreeOfSimilarity = memorys['degreeOfSimilarity'].split('_')[0];
                return parseFloat(degreeOfSimilarity) >= 0.20;
              });
              this.memoryList.splice();
            }

            // ロボットによるロードアニメーションを終了する
            this.StopMoveLoadingSearchRobot();

            // 検索キーワードを初期化する
            this.listAiSearchText = '';
  
          } catch {
  
          }
        }
      },
      // 検索中にロボットが動くアニメーションを実装
      StartLoadingSearchRobot: function() {

        this.isSearchAiLoding = true;

        let self = this;
        $(function() {
          $('#load-search-robot').css('display', 'inline');
          self.MoveRightOutLoadingSearchRobot();
        });
      },
      // ロボットが右に去っていくアニメーション
      MoveRightOutLoadingSearchRobot: function() {
        if (this.isSearchAiLoding) {
          let self = this;
          $('#load-search-robot').animate({left: '110%'}, 1500, function() {
            $('#load-search-robot').css('left', '-50%');
            self.MoveLeftInLoadingSearchRobot();
          });
        }
      },
      // ロボットが左から現れるアニメーション
      MoveLeftInLoadingSearchRobot: function() {
        if (this.isSearchAiLoding) {
          let self = this;
          $('#load-search-robot').animate({left: '50%'}, 1500, function() {
            $('#load-search-robot-around').animate({fontSize: '5.0em'}, 1000, function() {
              $('#load-search-robot-around').animate({fontSize: '2.0em'}, 1000, function() {
                self.MoveRightOutLoadingSearchRobot();
              });
            });
          });
        }
      },
      // ロボットアニメーションを止める
      StopMoveLoadingSearchRobot: function() {
        $('#load-search-robot').css('display', 'none');
        this.isSearchAiLoding = false;
      },
      // 思考一覧ページへ遷移する
      MoveMemoryList: async function() {

        // 思考一覧ページへ遷移ログ
        this.OutlogDebug('思考一覧ページへ遷移されました');
        
        // 思考メモリストを取得
        this.memoryList = await this.GetMemoryList();
        // splice()により、オブジェクトを反映する
        this.memoryList.splice();

        // タスクリストを取得
        this.taskList = await this.GetTaskList();
        this.taskList.splice();

        // 初期化
        this.isSearchAiLoding = false;
        this.listAiSearchText = '';

        this.page = this.PAGES.PAGE_LIST;

        // 管理者へ思考メモリストにアクセスされた旨を通知
        if (DEVELOP_MODE === false) {
          $(function() {
            //$.post('./Api/LINE/LineNotify.php', {'accessMessage': '思考メモリストにアクセスがありました。'});
          });
        }
      },
      // シェア思考リストを取得
      GetMemoryShareList: async function() {

        // シェア思考リスト取得ログ
        this.OutlogDebug('シェア思考リストが取得されました');

        // シェアデータに初期化用データを追加
        await this.InitializeShareData();

        let self = this;
        let memoryShareListTemp;

        firebase.database().ref('ShareMemorys').on('value', function(memorys) {
          let memoryVal = memorys.val();
          memoryShareListTemp = [];
          Object.keys(memoryVal).reverse().forEach(function(memoryKey) {
            if (memoryKey > 0) {
              memoryShareListTemp.push({
                memoryKey: memoryKey,
                content: memoryVal[memoryKey].content,
                goodCount: memoryVal[memoryKey].goodCount,
                originMemoryKey: memoryVal[memoryKey].originMemoryKey,
                accountImageUserId: (memoryVal[memoryKey].accountImageUserId) ? memoryVal[memoryKey].accountImageUserId : '',
                accountImagePath: DEFAULT_ACCOUNT_IMAGE,
              });
            }
          });

          this.memoryShareList = memoryShareListTemp;
          this.memoryShareList.splice();

          // シェア一覧へアカウントイメージを反映する
          this.SetShareAccountImagePath(this.memoryShareList);
          
        }.bind(this));
      },
      // シェア思考一覧ページへ遷移する
      MoveMomoryShareList: async function() {

        // シェア思考一覧ページへ遷移ログ
        this.OutlogDebug('シェア思考一覧ページへ遷移されました');

        this.page = this.PAGES.PAGE_SHARE_LIST;
        this.GetMemoryShareList();

        // 管理者へシェアリストにアクセスされた旨を通知
        if (DEVELOP_MODE === false) {
          $(function() {
            //$.post('./Api/LINE/LineNotify.php', {'accessMessage': 'シェアリストにアクセスがありました。'});
          });
        }
      },
      // アドレスバーを除いたウィンドウ高さを取得する
      SetInnerWindowHeight: function() {

        // ウィンドウ高さ設定ログ
        this.OutlogDebug('ウィンドウの高さが設定されました');

        let inputHeight;
        if (this.deviceInfo.OsType === 'Android') {
          inputHeight = 600;//document.documentElement.clientHeight;
        } else {
          inputHeight = $(window).height();
        }

        // 内側ウィンドウ高さを設定する
        this.memoryInputHeight = String(inputHeight * 0.77);
      },
      // シェアを行う
      ShareMemory: async function(memoryInfo) {

        // シェアデータに初期化用データを追加
        await this.InitializeShareData();

        if (memoryInfo.isShared == '1') {

          // シェア解除ログ
          this.OutlogDebug('シェアが解除されました');

          // シェア解除
          let deleteShareMemoryKey = await this.GetShareMemoryKey(memoryInfo.memoryKey);
          await this.DeleteShareMemory(deleteShareMemoryKey);
          await this.UpdateShareMode(memoryInfo);

          // 管理者へシェア解除された旨を通知
          if (DEVELOP_MODE === false) {
            $(function() {
              $.post('./Api/LINE/LineNotify.php', {'notifyMessage': 'シェアが解除されました。'});
            });
          }

        } else {

          // シェア実行ログ
          this.OutlogDebug('シェアが実行されました');

          // シェア実行
          await this.RegistShareMemory(memoryInfo);
          await this.UpdateShareMode(memoryInfo);

          // 管理者へシェアされた旨を通知
          if (DEVELOP_MODE === false) {
            $(function() {
              $.post('./Api/LINE/LineNotify.php', {'notifyMessage': '思考メモがシェアされました。'});
            });
          }

        }

        // シェア確認用モーダルを閉じる
        $('#confirm-share-modal').modal('hide');

        this.MoveMemoryList();
      },
      // シェア解除を行う
      DeleteShareMemory: function(deleteShareMemoryKey) {
        return new Promise(resolve => {
          firebase.database().ref('ShareMemorys/' + deleteShareMemoryKey).remove();
          resolve();
        });
      },
      // シェア実行を行う
      RegistShareMemory: function(memoryInfo) {
        return new Promise(resolve => {
          firebase.database().ref('ShareMemorys/' + this.GetNowTimestamp()).set({
            content: memoryInfo.content,
            originMemoryKey: memoryInfo.memoryKey,
            accountImageUserId: (this.accountImage == DEFAULT_ACCOUNT_IMAGE) ? '' : this.signInUser.uid,
          }, (err) => {
            if (err) {

            } else {
              resolve();
            }
          });
        });
      },
      // 対象思考メモのシェアモードを更新する
      UpdateShareMode: function(memoryInfo) {
        return new Promise(resolve => {
          let updateMemorys = {};
          updateMemorys['Memorys/' + this.signInUser.uid + '/' + memoryInfo.memoryKey] = {
            content: memoryInfo.content,
            registDate: memoryInfo.registDate,
            isShared: (memoryInfo.isShared == '1') ? '0' : '1',
          };

          firebase.database().ref().update(updateMemorys);
          resolve();
        });
      },
      // 対象思考メモのシェアキーを取得する
      GetShareMemoryKey: function(originMemoryKey) {

        // 対象思考メモのシェアキー取得ログ
        this.OutlogDebug('対象思考メモのシェアキーが取得されました');

        return new Promise(resolve => {
          firebase.database().ref('ShareMemorys').once('value', function(shareMemorys) {
            let shareMemoryVal = shareMemorys.val();
            let targetShareMemoryKey = '';
            Object.keys(shareMemoryVal).reverse().forEach(function(shareMemoryKey) {
              if (shareMemoryKey > 0) {
                if (originMemoryKey == shareMemoryVal[shareMemoryKey].originMemoryKey) {
                  targetShareMemoryKey = shareMemoryKey;
                }
              }
            });

            resolve(targetShareMemoryKey);
          });
        });
      },
      // 思考メモのシェア確認を行う
      ConfirmShare: function(memoryInfo) {

        // シェアボタン押下ログ
        this.OutlogDebug('シェアボタンが押下されました');

        // シェア確認用モーダルを表示する
        this.confirmShareMemory = memoryInfo;
        $('#confirm-share-modal').modal('show');
      },
      // 共感カウントを+1する
      GoodMemory: function(memoryInfo, ignoreShareUserId) {

        // 共感ボタン押下ログ
        this.OutlogDebug('共感ボタンが押下されました');

        if (this.signInUser.uid == ignoreShareUserId) {
          return;
        }

        let updateMemorys = {};
        updateMemorys['ShareMemorys/' + memoryInfo.memoryKey + '/goodCount'] = (memoryInfo.goodCount) ? parseInt(memoryInfo.goodCount) + 1 : 1;
        firebase.database().ref().update(updateMemorys);
      },
      // 削除バグ防止のため、シェアデータを初期作成する
      InitializeShareData: function() {
        return new Promise(async resolve => {
          await firebase.database().ref('ShareMemorys/0').set({
            content: '',
            originMemoryKey: '',
          });
          resolve();
        });
      },
      // 入力途中の思考メモをDBへ保存しておく
      SaveInputMemory: function() {

        // 入力途中の思考メモ保存ログ
        this.OutlogDebug('入力途中の思考メモが保存されました');

        firebase.database().ref('InputMemorys/' + this.signInUser.uid).set(this.memoryContent);
      },
      // 保存していた思考メモを入力欄へ適用する
      SetInputMemory: function() {

        // 保存思考メモ適用ログ
        this.OutlogDebug('保存していた思考メモが入力欄へ適用されました');

        let self = this;
        firebase.database().ref('InputMemorys/' + this.signInUser.uid).once('value', function(inputMemorys) {
          if (inputMemorys.val()) {
            
            // 保存思考メモ入力欄適用
            self.memoryContent = inputMemorys.val();
          } else {

            // 保存思考メモを初期化する
            self.InitializeInputMemorys();
          }
        });
      },
      // 保存思考メモを初期化する
      InitializeInputMemorys: async function() {
        await firebase.database().ref('InputMemorys/' + this.signInUser.uid).set('');
      },
      // ログイン判定を行う
      IsSignIn: function() {

        // ログイン判定ログ
        this.OutlogDebug('ログイン判定が実行されました');

        return new Promise(resolve => {

          let self = this;
          let isSignIn = false;

          firebase.auth().onAuthStateChanged((user) => {
            if (user) {
              self.signInUser = user;
              isSignIn = true;
            }

            resolve(isSignIn);
          });

        });
      },
      // メールアドレスでのログイン処理を行う
      SignIn: function() {

        // メールアドレスによるログインボタン押下ログ
        this.OutlogDebug('メールアドレスによるログインボタンが押下されました');

        if (IsEmpty(this.inputSignInUserAddress)) {
          this.loginErrorMessage = 'メールアドレスによるログインを行うには、メールアドレスを入力してください。';
          return;
        }
        if (IsEmpty(this.inputSignInUserPassword)) {
          this.loginErrorMessage = 'メールアドレスによるログインを行うには、パスワードを入力してください。';
          return;
        }
        let alphaOutCheck = /[^A-Za-z0-9-\._@]/;
        if (alphaOutCheck.test(this.inputSignInUserAddress)) {
          this.loginErrorMessage = 'メールアドレスに利用できない文字が含まれています。';
          return;
        }

        if (this.inputSignInUserAddress && this.inputSignInUserPassword) {

          // メールアドレスによるログイン実行ログ
          this.OutlogDebug('メールアドレスによるログインが実行されました');
          
          let self = this;

          firebase.auth().signInWithEmailAndPassword(this.inputSignInUserAddress, this.inputSignInUserPassword)
          .then(async (signInUserInfo) => {
            if (await self.IsSignIn()) {

              // 管理者へメールアドレスによりログインされた旨を通知
              if (DEVELOP_MODE === false) {
                $(function() {
                  $.post('./Api/LINE/LineNotify.php', {'accessMessage': 'メールアドレスによるログインがありました。'});
                });
              }
              
              // ログイン時の処理を行う
              self.SignInSuccessProcess(self);

            }
          })
          .catch((error) => {
            if (error.code === 'auth/user-not-found') {
              this.loginErrorMessage = '入力したメールアドレスに対応するユーザーが存在しないようです。';
            } else if (error.code === 'auth/invalid-email') {
              this.loginErrorMessage = '入力したメールアドレスは形式が違うようです。(OK:example@XXXX.com)';
            } else if (error.code === 'auth/wrong-password') {
              this.loginErrorMessage = '入力したパスワードが間違っているようです。';
            } else {
              this.loginErrorMessage = 'メールによる認証に失敗しました。管理者へお問い合わせください。';
            }
          });

        }
      },
      // Googleアカウントでのログイン処理を行う
      SignInGoogle: function() {

        // Googleアカウントでのログイン実行ログ
        this.OutlogDebug('Googleアカウントでのログインが実行されました');

        let provider = new firebase.auth.GoogleAuthProvider();

        // Googleのポップアップによりログインを行う
        this.SignInPopup(this, provider);

        // Googleのログインページへリダイレクトし、ログインを行う
        // firebase.auth().signInWithRedirect(provider);

        // 管理者へGoogleによりログインされた旨を通知
        if (DEVELOP_MODE === false) {
          $(function() {
            $.post('./Api/LINE/LineNotify.php', {'accessMessage': 'Googleによるログインがありました。'});
          });
        }
      },
      // Twitterアカウントでのログイン処理を行う
      SignInTwitter: function() {

        // Twitterアカウントでのログイン実行ログ
        this.OutlogDebug('Twitterアカウントでのログインが実行されました');

        let provider = new firebase.auth.TwitterAuthProvider();

        // Twitterのポップアップによりログインを行う
        this.SignInPopup(this, provider);

        // Twitterのログインページへリダイレクトし、ログインを行う
        // firebase.auth().signInWithRedirect(provider);

        // 管理者へTwitterによりログインされた旨を通知
        if (DEVELOP_MODE === false) {
          $(function() {
            $.post('./Api/LINE/LineNotify.php', {'accessMessage': 'Twitterによるログインがありました。'});
          });
        }
      },
      // Facebookアカウントでのログイン処理を行う
      SignInFacebook: function() {

        // Facebookアカウントでのログイン実行ログ
        this.OutlogDebug('Facebookアカウントでのログインが実行されました');

        let provider = new firebase.auth.FacebookAuthProvider();

        // Facebookのポップアップによりログインを行う
        this.SignInPopup(this, provider);

        // Facebookのログインページへリダイレクトし、ログインを行う
        // firebase.auth().signInWithRedirect(provider);

        // 管理者へFacebookによりログインされた旨を通知
        if (DEVELOP_MODE === false) {
          $(function() {
            $.post('./Api/LINE/LineNotify.php', {'accessMessage': 'Facebookによるログインがありました。'});
          });
        }
      },
      // Githubアカウントでのログイン処理を行う
      SignInGithub: function() {

        // Githubアカウントでのログイン実行ログ
        this.OutlogDebug('Githubアカウントでのログインが実行されました');

        let provider = new firebase.auth.GithubAuthProvider();

        // Githubのポップアップによりログインを行う
        this.SignInPopup(this, provider);

        // Githubのログインページへリダイレクトし、ログインを行う
        // firebase.auth().signInWithRedirect(provider);

        // 管理者へGitHubによりログインされた旨を通知
        if (DEVELOP_MODE === false) {
          $(function() {
            $.post('./Api/LINE/LineNotify.php', {'accessMessage': 'Githubによるログインがありました。'});
          });
        }
      },
      // OAuthポップアップによるログイン
      SignInPopup: function(self, provider) {

        // ロードアイコンを表示
        this.isLoading = true;

        firebase.auth()
        .signInWithPopup(provider)
        .then(async (result) => {
          if (await self.IsSignIn()) {

            // ログイン時の処理を行う
            self.SignInSuccessProcess(self);
          
          }
        }).catch((error) => {
          // ロードアイコンを表示
          this.isLoading = false;

          this.loginErrorMessage = '認証中にエラーが発生しました。何度認証してもログインできない場合は、管理者へお問い合わせください。';
        });
      },
      // アカウント作成処理を行う
      SignUp: function() {

        // メールアドレスによるアカウント作成ボタン押下ログ
        this.OutlogDebug('メールアドレスによるアカウント作成ボタンが押下されました');

        if (IsEmpty(this.inputSignInUserAddress)) {
          this.loginErrorMessage = 'アカウント作成を行うには、アカウント用のメールアドレスを入力してください。';
          return;
        }
        if (IsEmpty(this.inputSignInUserPassword)) {
          this.loginErrorMessage = 'アカウント作成を行うには、アカウント用のパスワードを入力してください。';
          return;
        }
        let alphaOutCheck = /[^A-Za-z0-9-\._@]/;
        if (alphaOutCheck.test(this.inputSignInUserAddress)) {
          this.loginErrorMessage = 'メールアドレスに利用できない文字が含まれています。';
          return;
        }

        if (this.inputSignInUserAddress && this.inputSignInUserPassword) {

          // メールアドレスによるアカウント作成実行ログ
          this.OutlogDebug('メールアドレスによるアカウント作成が実行されました');
          
          let self = this;

          firebase.auth().createUserWithEmailAndPassword(this.inputSignInUserAddress, this.inputSignInUserPassword)
          .then(async (signInUserInfo) => {
            if (await self.IsSignIn()) {

              // 管理者へメールアドレスによりアカウント作成された旨を通知
              if (DEVELOP_MODE === false) {
                $(function() {
                  $.post('./Api/LINE/LineNotify.php', {'accessMessage': 'メールアドレスによるアカウント作成がありました。'});
                });
              }

              // ログイン時の処理を行う
              self.SignInSuccessProcess(self);
            
            }
          })
          .catch((error) => {
            if (error.code === 'auth/email-already-in-use') {
              this.loginErrorMessage = '既に入力されたメールアカウントは存在しています。';
            } else if (error.code === 'auth/invalid-email') {
              this.loginErrorMessage = '入力したメールアドレスは形式が違うようです。(OK:example@XXXX.com)';
            } else if (error.code === 'auth/weak-password') {
              this.loginErrorMessage = '入力したパスワードの文字数が少ないです。';
            } else {
              this.loginErrorMessage = 'メールによるアカウントの作成に失敗しました。管理者へお問い合わせください。';
            }
          });

        }
      },
      // ログアウト処理を行う
      SignOut: function() {

        // ログアウト実行ログ
        this.OutlogDebug('ログアウトが実行されました');

        firebase.auth().signOut()
        .then(() => {
          window.location.reload();
        })
        .catch();
      },
      // ログイン処理成功時に行う処理
      SignInSuccessProcess: async function(self) {
        // アプリのトップページへ移動する
        // this.page = this.PAGES.PAGE_TOP;

        // DBへ思考メモ記録用のひな形を作成する
        await firebase.database().ref('Memorys/' + self.signInUser.uid + '/0').set({
          content: '',
          registDate: '',
        });

        // DBへアカウントIDに紐づくメールアドレスを保存しておく
        await firebase.database().ref('UserAddress/' + self.signInUser.uid).set(self.signInUser.email);

        // AIの動作を開始
        // this.memoryAi = new MemorysAi(firebase.database(), this.signInUser);
        // this.memoryAi.PeriodicExecution();

        window.location.reload();
      },
      // ヘッダーメニューを操作する
      AnimationHeaderMenu: function() {

        // ヘッダーメニュー操作ボタン押下ログ
        this.OutlogDebug('ヘッダーメニュー操作ボタンが押下されました');

        if ($('#menu-box').css('top') == '0px') {
          // ヘッダーメニューを非表示にする
          this.AnimationHideHeaderMenu();
        } else {
          // ヘッダーメニューを表示する
          this.AnimationShowHeaderMenu();
        }
      },
      // ヘッダーメニューを表示するアニメーション
      AnimationShowHeaderMenu: function() {

        // ヘッダーメニュー表示ログ
        this.OutlogDebug('ヘッダーメニューが表示されました');

        $('#menu-box').animate({top: 0}, 400, 'swing');
      },
      // ヘッダーメニューを非表示にするアニメーション
      AnimationHideHeaderMenu: function() {

        // ヘッダーメニュー非表示ログ
        this.OutlogDebug('ヘッダーメニューが非表示にされました');

        $('#menu-box').animate({top: '-150%'}, 400, 'swing');
      },
      // 入力コントロールメニューを操作する
      AnimationMemoryInputControl: function() {
        
        // 入力コントロールメニュー操作ボタン押下ログ
        this.OutlogDebug('入力コントロールメニュー操作ボタンが押下されました');

        if ($('#memory-input-control').css('right') == '0px') {
          // 入力コントロールメニューを非表示にする
          this.AnimationHideMemoryInputControl();
        } else {
          // 入力コントロールメニューを表示する
          this.AnimationShowMemoryInputControl();
        }
      },
      // 入力コントロールメニューを表示するアニメーション
      AnimationShowMemoryInputControl: function() {

        // 入力コントロールメニュー表示ログ
        this.OutlogDebug('入力コントロールメニューが表示されました');

        $('#memory-input-control').animate({right: 0}, 200, 'swing');
      },
      // 入力コントロールメニューを非表示にするアニメーション
      AnimationHideMemoryInputControl: function() {

        // 入力コントロールメニュー非表示ログ
        this.OutlogDebug('入力コントロールメニューが非表示にされました');

        $('#memory-input-control').animate({right: '-20%'}, 200, 'swing');
      },
      // トップ画面へ遷移
      MoveTopPage: async function() {

        // トップ画面へ遷移ログ
        this.OutlogDebug(((await this.IsSignIn()) ? 'トップ' : 'ログイン') + '画面へ遷移されました');

        if (await this.IsSignIn()) {

          // トップ画面へ遷移
          this.page = this.PAGES.PAGE_TOP;
          this.AnimationHideHeaderMenu();

        } else {

          // ログイン画面へ遷移
          this.page = this.PAGES.PAGE_LOGIN;

        }
      },
      // スーパーリロード
      UpdateApp: function() {

        // スーパーリロード実行ログ
        this.OutlogDebug('スーパーリロードが実行されました');

        window.location.reload(true);
      },
      // 解析結果のアニメーションを開始
      StartAnalyzedInfoAnimation: function() {

        // 解析結果アニメーション開始ログ
        this.OutlogDebug('解析結果のアニメーションが開始されました');

        this.StartAdvanceAnalysisProgress();
        this.AnalyzedInfoAnimation();
        setInterval(this.AnalyzedInfoAnimation, 1000 * 15);  // 10秒に一度定期実行
      },
      // 解析結果のアニメーション
      AnalyzedInfoAnimation: function() {
        if (this.IsAnalysisResult()) {

          // 解析結果アニメーション実行ログ
          // this.OutlogDebug('解析結果のアニメーションが実行されました');

          this.analysisByDatetimeProgress = '0';

          $('#analysis-by-datetime-box p').fadeOut(1000);
          $('#analysis-by-datetime-box span').fadeOut(1000, function() {

            $('#analysis-by-datetime-box').css('display', 'block');
            $('#analysis-by-datetime-box-crecive-row').css('display', 'block');
            $('#analysis-by-datetime-progress-crecive-row').css('display', 'block');

            this.memoryAi.OutputDisplayContent($('#analysis-by-datetime-box p'));
            $('#analysis-by-datetime-box span').html(this.$options.filters.PreviousDays(this.memoryAi.AnalysisMemorys.registDate) + '&nbsp;&nbsp;');

            $('#analysis-by-datetime-box p').fadeIn(1000, function() {
              $('#analysis-by-datetime-box p').css('display', '-webkit-box');
            });
            $('#analysis-by-datetime-box span').fadeIn(1000);
            $('#analysis-by-datetime-progress').fadeIn(1000);

          }.bind(this));
          
        } else {

          $('#analysis-by-datetime-progress').css('display', 'none');
          $('#analysis-by-datetime-box').css('display', 'none');
          $('#analysis-by-datetime-box p').css('display', 'none');
          $('#analysis-by-datetime-box span').css('display', 'none');
          $('#analysis-by-datetime-box-crecive-row').css('display', 'none');
          $('#analysis-by-datetime-progress-crecive-row').css('display', 'none');

        }
      },
      // 解析結果表示タイミングを示すプログレスバーを進める処理を開始する
      StartAdvanceAnalysisProgress: function() {
        setInterval(function() {
          this.analysisByDatetimeProgress = String(parseInt(this.analysisByDatetimeProgress) + 1);
        }.bind(this), 150);
      },
      // 解析結果があるか否かを判定する
      IsAnalysisResult: function() {
        return this.memoryAi.AnalysisMemorys && this.memoryAi.AnalysisMemorys.content;
      },
      // エラーログ出力
      OutlogError: function(logContent) {
        let userName = this.$options.filters.ShowLoginUserName(this.signInUser);
        $(function() {
          $.post('./Api/Log/Logout.php', {'content': logContent, 'type': 'error', 'directory': 'Error', 'user': userName});
        });
      },
      OutlogErrorStackTrace: function(e) {
        if (e.stack) {
          OutlogError(e.message + ' : ' + e.stack.replace(/(\r\n|\r|\n)/gi, ' '));
        } else {
          OutlogError(e.message);
        }
      },
      // デバッグログ出力
      OutlogDebug: function(logContent) {
        let userName = this.$options.filters.ShowLoginUserName(this.signInUser);
        $(function() {
          $.post('./Api/Log/Logout.php', {'content': logContent, 'type': 'debug', 'directory': 'Debug', 'user': userName});
        });
      },
      // お問い合わせ内容確認
      ConfirmInquiry: function() {

        this.inquiryCheck = '';

        if (!this.inquiryAddress) {
          this.inquiryCheck = '返信用メールアドレスを入力してください。';
          return;
        }
        if (!this.inquiryContent) {
          this.inquiryCheck = 'お問い合わせ内容を入力してください。';
          return;
        }

        $('#inquiry-confirm-modal').modal('show');
      },
      // お問い合わせ送信
      SendInquiry: function() {

        let self = this;

        $(function() {
          $.post('./Api/Mail/Inquiry.php', {txtMailAddress:self.inquiryAddress, txtInquiryContent:self.inquiryContent}, function(response) {
            self.inquiryResult = (response == '1')
              ? 'お問い合わせが完了しました。<br>返信をお待ちください。'
              : 'お問い合わせに失敗しました。<br>何度も失敗してしまう場合は、大変申し訳ありませんが、Twitter、もしくはLINE@からお問い合わせをお願い致します。';
            
            $('#inquiry-confirm-modal').modal('hide');
            $('#inquiry-result-modal').modal('show');

            // お問い合わせ結果モーダルが閉じられた際に、お問い合わせが完了していたら、入力内容を初期化する
            $('#inquiry-result-modal').on('hidden.bs.modal', function() {
              if (response == '1') {
                self.inquiryAddress = '';
                self.inquiryContent = '';
                self.inquiryCheck = '';
                self.inquiryResult = '';
              }
            });
          });
        });
      },
      // お問い合わせ画面へ遷移
      MoveInquiryPage: function() {

        // お問い合わせ画面へ遷移ログ
        this.OutlogDebug('お問い合わせ画面へ遷移されました');

        this.inquiryAddress = '';
        this.inquiryContent = '';
        this.inquiryCheck = '';
        this.inquiryResult = '';

        this.page = this.PAGES.PAGE_INQUIRY;

        // 元ページへ戻るボタンの文言を判定する
        let self = this;
        $(async function() {
          $('#returnButtonInInquiry').text(await self.IsSignIn() ? 'トップ' : 'ログイン');
        });
      },
      // PWA適用説明用のカルーセル動作を開始する
      StartPwaExplanationCarousel: function() {

        let self = this;

        $('#pwa-explanation-modal').on('shown.bs.modal', function() {

          // クリップボードへのコピー処理が可能か否かを判定する
          self.isCopyToClipboard = (navigator.clipboard) ? true : false;
          self.isCopyToClipboardSuccess = false;
          
          // カルーセル開始
          $('.carousel').carousel({
            interval: 1000 * 10,  // 10秒
            pause: false,
            ride: 'carousel',
          });
        });
      },
      // 当アプリのURLをクリップボードへコピーする
      CopyMemorysUrl: function() {
        let copyText = window.location.href;
        navigator.clipboard.writeText(copyText);
        this.isCopyToClipboardSuccess = true;
      },
      // マイページ画面へ遷移
      MoveMyPage: async function() {

        // マイページ画面へ遷移ログ
        this.OutlogDebug('マイページ画面へ遷移されました');

        // 保存していたアカウントイメージを適用する
        await this.InitializeAccountImageToApp();

        // マイページ画面へ遷移
        this.page = this.PAGES.PAGE_MY;

        // 保存していたユーザー設定を適用する
        await this.SettingUserConfigToMyPage(this.userConfig);

        // トップトレンド情報を表示する
        await this.GetTopTrendList();

        // デフォルトイメージか保存したアカウントイメージか判定する
        if (this.accountImage != DEFAULT_ACCOUNT_IMAGE) {
          $(function() {
            $('#account-image').css('opacity', '1');
          });
        }
      },
      // ローカルフォルダからアカウント用のイメージを選択する
      SelectAccountImage: function() {

        let self = this;

        $(function() {
          $('#account-image-select').click();
          $('#account-image-select').on('change', function() {
            
            if (this.files && this.files.length > 0) {
              let selectFile = this.files[0];
              
              // 画像ファイルのみ処理を行う
              if (selectFile.type.startsWith('image/')) {
                
                // ファイルの相対パスを読み込む
                let fileReader = new FileReader();
                fileReader.readAsDataURL(selectFile);
                
                // ファイルのサムネイルを画面へ表示する
                fileReader.onload = function() {
                  self.accountImage = fileReader.result;
                  $('#account-image').css('opacity', '1');
                };
              
              }
            }
          });
        });
      },
      // マイページを更新する
      UpdateMyPage: async function() {

        // マイページ更新結果
        let failedCount = 0;

        // ロードアイコンを表示
        this.isLoading = true;

        // アカウントイメージを更新する
        failedCount += (await this.UpdateAccountImage()) ? 0 : 1;

        // ユーザー設定を更新する
        failedCount += (await this.UpdateUserConfig()) ? 0 : 1;

        // ロードアイコンを非表示
        this.isLoading = false;
      
        this.updateMyPageResult = (failedCount === 0)
          ? 'マイページが更新されました。'
          : 'マイページの更新に失敗しました。<br>何度も失敗してしまう場合は、大変申し訳ありませんが、Twitter、もしくはLINE@からお問い合わせをお願い致します。';
        
        $('#update-my-page-result-modal').modal('show');
      },
      // アカウントイメージを更新する
      UpdateAccountImage: function() {
        return new Promise(resolve => {
          if (this.accountImage != DEFAULT_ACCOUNT_IMAGE) {

            if ($('#account-image-select').prop('files').length == 0) {
              resolve(true);
              
            } else {

              // 選択中のアカウントイメージファイル
              let accountImageFile = $('#account-image-select').prop('files')[0];
              let formData = new FormData();
              formData.append('accountImage', accountImageFile);
              formData.append('userId', this.signInUser.uid);

              $(function() {
                $.ajax({
                  url: './Api/Upload/AccountImageUpload.php',
                  type: 'post',
                  data: formData,
                  processData: false,
                  contentType: false,
                  cache: false,
                })
                .done(function(response) {
                  if (response == '1') {
                    resolve(true);
                  } else {
                    resolve(false);
                  }
                })
                .fail(function() {
                  resolve(false);
                });
              });

            }

          } else {
            resolve(true);

          }
        });
      },
      // ユーザ設定を行う
      UpdateUserConfig: function() {

        let self = this;

        return new Promise(resolve => {
          try {
            let configListType;
            $(async function() {
              configListType = $('input:radio[name="list-type-select"]:checked').val();

              await firebase.database().ref('UserConfig/' + self.signInUser.uid).set({
                defaultListType: configListType,
              });
  
              resolve(true);
            });

          } catch (e) {
            resolve(false);
          }
        });
      },
      // アカウントイメージをアプリへ適用する
      InitializeAccountImageToApp: function() {
        return new Promise(resolve => {

          let self = this;

          $(function() {
            $.ajax({
              url: './Api/Upload/IsAccountImageFile.php',
              type: 'post',
              data: { userId: self.signInUser.uid },
            })
            .done(function(response) {
              if (response == '1') {
                self.accountImage = './img/AccountImage/' + self.signInUser.uid + '/account.jpg';

              } else {
                self.accountImage = DEFAULT_ACCOUNT_IMAGE;

              }
              resolve();
            })
            .fail(function() {
              self.accountImage = DEFAULT_ACCOUNT_IMAGE;
              resolve();
            });
          });

        });
      },
      // シェア一覧へアカウントイメージを適用する
      SetShareAccountImagePath: function(memoryShareList) {
        return new Promise(async resolve => {
          for (shareIndex in memoryShareList) {
            memoryShareList[shareIndex].accountImagePath = await this.GetAccountImagePath(memoryShareList[shareIndex].accountImageUserId);
          }
          memoryShareList.splice();
          resolve();
        });
      },
      // 指定アカウントのイメージを取得する
      GetAccountImagePath: function(userId) {
        return new Promise(resolve => {
          if (userId) {
            $(function() {
              $.ajax({
                url: './Api/Upload/IsAccountImageFile.php',
                type: 'post',
                data: { userId: userId },
              })
              .done(function(response) {
                if (response == '1') {
                  resolve('./img/AccountImage/' + userId + '/account.jpg');

                } else {
                  resolve(DEFAULT_ACCOUNT_IMAGE);

                }
              })
              .fail(function() {
                resolve(DEFAULT_ACCOUNT_IMAGE);
              });
            });
          } else {
            resolve(DEFAULT_ACCOUNT_IMAGE);
          }
        });
      },
      // ユーザー設定を取得する
      InitializeUserConfig: function() {

        let self = this;

        return new Promise(resolve => {
          firebase.database().ref('UserConfig/' + self.signInUser.uid).once('value', function(config) {
            let configVal = config.val();
            if (configVal) {

              // デフォルトリスト種別
              self.userConfig['defaultListType'] = configVal['defaultListType'];
            
            }
          });
        });
      },
      // ユーザー設定をマイページへ適用する
      SettingUserConfigToMyPage: function(userConfig) {

        let self = this;

        return new Promise(resolve => {
          if (userConfig) {
            $(function() {
              
              // // デフォルトリスト種別
              $('input:radio[name="list-type-select"]').val([userConfig['defaultListType']]);
              
              resolve();
            
            });
          }
        });
      },
      // 現在アクセス中のユーザーを解析し、リストを作成する
      StartGetNowLoginAccountList: function() {

        this.SendNowAccessInfo();
        this.GetNowLoginAccountList();

        setInterval(function() {
          this.SendNowAccessInfo();
          this.GetNowLoginAccountList();
        }.bind(this), this.LOGIN_CHECK_INTERVAL);
      },
      // アプリ起動時のアクセス情報保存
      SendInitAccessInfo: function() {
        firebase.database().ref('LoginUserAccessInfo/' + this.signInUser.uid).update({
          ReAccessDate: this.GetNowTimestamp(),
        });
      },
      // アプリ起動中のアクセス情報保存
      SendNowAccessInfo: async function() {
        await firebase.database().ref('LoginUserAccessInfo/' + this.signInUser.uid).update({
          RealAccessDate: this.GetNowDatetime(this.DATE_FORMAT.DATE_TIME),
        });
      },
      // 現在アクセス中のユーザーリストを作成
      GetNowLoginAccountList: function() {

        let self = this;

        firebase.database().ref('LoginUserAccessInfo').once('value', function(loginAccountInfo) {
          let loginAccountInfoVal = loginAccountInfo.val();
          let realAccessDate;
          let nowDate = moment();
          
          let loginAccountListTmp = [];
          Object.keys(loginAccountInfoVal).forEach(async function(loginAccountId) {
            if (loginAccountId != '0' && loginAccountListTmp.length < self.MAX_LENGTH_LOGIN_ACCOUNT_LIST) {

              // アクセス中の日時登録
              realAccessDate = loginAccountInfoVal[loginAccountId].RealAccessDate;

              if (nowDate.diff(moment(realAccessDate)) > self.LOGIN_CHECK_INTERVAL) {
                // アクセス外

              } else {

                // アクセス中
                // if (loginAccountListTmp.length == 0) {
                loginAccountListTmp.push(await self.GetAccountImagePath(loginAccountId));

                // } else {
                //   let insertIndex = self.SortReAccessDate(loginAccountListTmp, loginAccountInfoVal[loginAccountId]);
                //   loginAccountListTmp.splice(insertIndex, 0, await self.GetAccountImagePath(loginAccountId));
                // }
                
              }
            }
          });

          self.loginAccountList = loginAccountListTmp;
          self.loginAccountList = self.loginAccountList.sort().reverse();
          self.loginAccountList.splice();
        });
      },
      // アプリ起動時の日時でソート
      SortReAccessDate: function(objList, objTarget) {
        let insertIndex = 0;
        Object.keys(objList).forEach(function(objKey) {
          if (objList[objKey].ReAccessDate && objTarget.ReAccessDate) {
          
            if (objList[objKey].ReAccessDate < objTarget.ReAccessDate) {
              return insertIndex;
            }
            
          } else {
  
            return -1;
  
          }
          insertIndex++;
        });

        return insertIndex;
      },
      // アイデアトレンド情報テーブルに対して、過去情報から再登録を行う
      ResetIdeaTrend: function(userId) {
        let self = this;
        return new Promise(async resolve => {
          if (self.isAdminUser && userId) {

            try {
              // ロードアイコンを表示
              self.isLoading = true;

              // 指定ユーザーのアイデアトレンド情報を削除する
              await self.DeleteIdeaTrend(userId);
              
              // 指定ユーザーのアイデアトレンド情報を全て登録する
              await self.RegistAllIdeaTrendFromUser(userId);

              // ロードアイコンを非表示
              self.isLoading = false;

              resolve();

            } catch(e) {
              // ロードアイコンを非表示
              self.isLoading = false;

              resolve();
            }

          } else {
            
            resolve();
          }
        });
      },
      // アイデアトレンド情報テーブルに形態素解析結果を登録する
      RegistIdeaTrend: function(memoryContent, userId) {
        return new Promise(resolve => {
          try {
            let ideaTrends = {};
            ideaTrends['9999999999999'] = encodeURIComponent(memoryContent);

            $(function() {
              $.post('./Api/DB/update_idea_trend.php', {param: JSON.stringify({analysisTarget:ideaTrends}), userId:userId}, function(res) {
                resolve(true);
              });
            });
          } catch(e) {
            resolve(false);
          }
        });
      },
      // 特定ユーザーのアイデアトレンド情報を全て登録する
      RegistAllIdeaTrendFromUser: function(userId) {
        let self = this;
        return new Promise(resolve => {
          firebase.database().ref('Memorys/' + userId).once('value', function(memorys) {
            let memoryVal = memorys.val();
            let ideaTrends = {};
            Object.keys(memoryVal).forEach(function(memoryKey) {
              if (memoryKey > 0) {
                ideaTrends[memoryKey] = encodeURIComponent(memoryVal[memoryKey].content);
              }
            });

            // アイデア傾向/思考傾向記録実行
            $.post('./Api/DB/update_idea_trend.php', {param: JSON.stringify({analysisTarget:ideaTrends}), userId:userId}, function(res) {
              resolve();
            });
          });
        });
      },
      // 指定ユーザーのアイデアトレンド情報テーブルの中身を削除する
      DeleteIdeaTrend: function(userId) {
        return new Promise(resolve => {
          try {
            $(function() {
              $.post('./Api/DB/delete_idea_trend.php', {userId:userId}, function(res) {
                resolve((res == '1'));
              });
            });
          } catch(e) {
            resolve(false);
          }
        });
      },
      // 管理者判定
      IsAdminLogin: function() {
        let self = this;
        return new Promise(resolve => {
          try {
            $(function() {
              $.post('./Api/Authentication/IsAdminLogin.php', {userId:self.signInUser.uid}, function(isAdmingUser) {
                resolve((isAdmingUser == '1'));
              });
            });
          } catch(e) {
            resolve(false);
          }
        });
      },
      // メンテナンスページへ遷移する
      MoveMainte: async function() {

        // メンテナンスページへ遷移ログ
        this.OutlogDebug('メンテナンスページへ遷移されました');

        this.page = this.PAGES.PAGE_MAINTE;

        if (this.IsAdminLogin() == false) {
          this.UpdateApp();
        }
      },
      // 入力欄へのタスク挿入
      InsertTaskSymbol: function() {
        let self = this;
        $(function() {

          // カーソル位置取得
          let cursorPosition = $('#memory-input').get(0).selectionStart;

          // 挿入場所の前後文字列取得
          let insertBefore = self.memoryContent.slice(0, cursorPosition);
          let insertAfter = self.memoryContent.slice(cursorPosition);
          // 再セットする入力内容を作成
          let resetContent = insertBefore + self.TASK_NO_CHECK + insertAfter;
          
          // 入力欄へ反映する
          self.memoryContent = resetContent;

          // 挿入内容反映タイミングの関係上、絶妙に遅らせて対応する
          setTimeout(function() {
            $('#memory-input').focus();
            $('#memory-input').get(0).selectionStart = cursorPosition + self.TASK_NO_CHECK.length;
            $('#memory-input').get(0).selectionEnd = cursorPosition + self.TASK_NO_CHECK.length;
          }, 100);

        });
      },
      // タスクチェックイベント
      EventTaskCheck: function() {
        let self = this;
        $(function() {
          $('.task-box').on('click', async function() {
            try {
              
              if (self.isTaskClickStop) {
                // イベント中止フラグが立っている場合は、処理を行わない
                return;
              }
              // 意図しないイベント起動を行わないためにイベント中止フラグを立てる
              self.isTaskClickStop = true;

              // ローディング開始
              self.isListLoading = true;

              if ($(this).attr('check-value') == '1') {

                $(this).attr('check-value', '0');
                $(this).html(self.TASK_NO_CHECK_HTML);

              } else {

                $(this).attr('check-value', '1');
                $(this).html(self.TASK_CHECKED_HTML);

              }

              // タスクボックス
              let taskBox = $(this).parent();

              // タスクキーを取得する
              let taskKey = taskBox.attr('id').replace('task-list-content-', '');
              // 現在の状態で更新する
              await firebase.database().ref('Tasks/' + self.signInUser.uid + '/' + taskKey + '/content')
                .set(self.ReplaceTaskBoxReverse(self.ReplaceNewLineReverse(taskBox.html())));

              // ローディング終了
              self.isListLoading = false;

              setTimeout(function() {
                self.isTaskClickStop = false;
              }, 10);

            } catch (e) {
              // ローディング終了
              self.isListLoading = false;
            }
          });
        });
      },
      // 入力内容タスク判定
      IsContentTask: function() {
        return (this.memoryContent.indexOf(this.TASK_CHECKED) != -1 || this.memoryContent.indexOf(this.TASK_NO_CHECK) != -1);
      },
      // タスクのアーカイブ確認を行う
      ConfirmArchive: function(taskInfo) {

        // アーカイブボタン押下ログ
        this.OutlogDebug('アーカイブボタンが押下されました');

        // アーカイブ確認用モーダルを表示する
        this.confirmArchive = taskInfo;
        $('#confirm-archive-modal').modal('show');
      },
      // タスクをアーカイブする
      ArchiveTask: function(taskInfo) {

        // アーカイブ実行ボタン押下ログ
        this.OutlogDebug('アーカイブ実行ボタンが押下されました');

        firebase.database().ref('Tasks/' + this.signInUser.uid + '/' + taskInfo.taskKey + '/isArchive')
          .set('1', (err) => {
            if (err) {

            } else {

              // 管理者へ投稿された旨を通知
              if (DEVELOP_MODE === false) {
                $(function() {
                  $.post('./Api/LINE/LineNotify.php', {'notifyMessage': 'タスクがアーカイブされました。'});
                });
              }

              // アーカイブ確認用モーダルを閉じる
              $('#confirm-archive-modal').modal('hide');

              this.MoveMemoryList();
            }
          });
      },
      // HTML用の改行タグを改行コードに変換する
      ReplaceNewLineReverse: function(text) {
        return text.replace(/<br>/ig, '\n');
      },
      // タスクアイコンを識別用文字列に変換する
      ReplaceTaskBoxReverse: function(text) {
        return text
          .replace(/<span class="task-box icon-color" check-value="0"><i class="far fa-check-circle"><\/i><\/span>&nbsp;/ig, this.TASK_NO_CHECK)
          .replace(/<span class="task-box icon-color" check-value="1"><i class="fas fa-check-circle"><\/i><\/span>&nbsp;/ig, this.TASK_CHECKED);
      },
      // リスト種別初期化
      InitializeListType: function() {

        // リスト種別初期値
        initListType = this.userConfig['defaultListType'];

        // リスト種別設定
        this.SetListType(initListType);

      },
      // リスト種別設定
      SetListType: function(listTypeSet) {
        // リスト種別設定
        if (listTypeSet == this.LIST_TYPE.LIST_MEMORYS) {
          this.listType = this.LIST_TYPE.LIST_MEMORYS;
          this.listTitle = 'アイデア';

        } else if (listTypeSet == this.LIST_TYPE.LIST_TASKS) {
          this.listType = this.LIST_TYPE.LIST_TASKS;
          this.listTitle = 'タスク';

        }
      },
      // トップトレンド情報を取得する
      GetTopTrendList: function() {
        let self = this;
        self.topMemoryTrendList = [];
        return new Promise(resolve => {
          $(function() {
            $.post('./Api/DB/select_top_idea_trend.php', {userId:self.signInUser.uid, selectCount:10}, function(res) {
              if (res != '0') {
                let topTrendList = JSON.parse(decodeURIComponent(res));
                Object.keys(topTrendList).forEach(function(topTrend) {
                  self.topMemoryTrendList.push({
                    trend: topTrend,
                    trendCount: topTrendList[topTrend],
                  });
                });
              }
              resolve();
            });
          });
        });
      },
    },
    filters: {
      ReplaceNewLine: function(text) {
        return (text) ? text.replace(/\r\n|\r|\n/ig, '<br>') : '';
      },
      ReplaceTaskBox: function(text) {
        if (text) {
          return text
            .replace(/\|□\|/ig, '<span class="task-box icon-color" check-value="0"><i class="far fa-check-circle"></i></span>&nbsp;')
            .replace(/\|■\|/ig, '<span class="task-box icon-color" check-value="1"><i class="fas fa-check-circle"></i></span>&nbsp;');
        } else {
          return '';
        }
      },
      PreviousDays: function(date) {
        let nowDate = moment();
        let registDateTmp = moment(date);

        let diffDays = nowDate.diff(registDateTmp, 'days');
        let diffYears = nowDate.diff(registDateTmp, 'years');
        let diffMonths = nowDate.diff(registDateTmp, 'months');
        let diffYearsMessage = diffYears > 0 ? String(diffYears) + '年' : '';
        let diffMonthsMessage = diffMonths > 0 ? String(diffMonths % 12) + 'カ月' : '';
        let yearMonthLinkDaysString = diffYearsMessage.length > 0 || diffMonthsMessage.length > 0 ? 'と' : '';
        let diffDaysMessage = (diffDays % 30 > 0 ? yearMonthLinkDaysString + String(diffDays % 30) + '日' : '');
        let dayAgoMessage = diffYearsMessage + diffMonthsMessage + diffDaysMessage + (diffYearsMessage.length > 0 || diffMonthsMessage.length > 0 || diffDaysMessage.length > 0 ? '前' : '');

        return dayAgoMessage;
      },
      RegistDateFormatToList: function(date) {
        return moment(date).format('YYYY/MM/DD HH:mm');
      },
      ShowLoginUserName: function(userInfo) {
        let loginUserName = '';

        if (userInfo && userInfo.displayName) {
          loginUserName = userInfo.displayName;

        } else if (userInfo && userInfo.email) {
          loginUserName = userInfo.email;

        }
        
        return loginUserName;
      },
    },
  });
}
