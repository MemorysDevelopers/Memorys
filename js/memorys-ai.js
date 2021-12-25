// コンストラクタ
let MemorysAi = function(signInUser) {
  // 読み取った思考メモ情報を保持しておく
  ReadMemorysResult = [];
  // 思考メモを解析した結果を保持しておく
  AnalysisMemorys = {};
  // AIによって解析した思考メモの結果を保持しておく
  AnalysisAiMemorys = {};
  // ログインユーザー情報
  SignInUserInfo = signInUser;
};

// 時系列情報を元にした過去思考メモ解析
MemorysAi.prototype.AnalysisByDatetime = function() {
  // 戻り値の形式：'6 months'
  let dateAtoType = this.GetAnalysisDateAgoType();
  
  // ***********************************
  // **** 読み込んだ思考メモを解析する ****
  // ***********************************

  if (!this.AnalysisMemorys) {
    this.AnalysisMemorys = {memoryKey: '', content: '', isShared: '0', registDate: '', previousDay: '',};
  }

  let memoryResult = {};
  this.ReadMemorysResult.forEach(function(memoryInfo) {
    memoryResult[memoryInfo.memoryKey] = {
      content:encodeURIComponent(memoryInfo.content),
      registDate:memoryInfo.registDate,
    };
  });

  let self = this;

  $.post('./Api/AiAnalysis/AnalysisByDatetime.php',{memorys: JSON.stringify({
    analysisDateAgo:dateAtoType,            // 
    memoryList:memoryResult,                // 過去に記憶させた思考メモリスト
  })}, function(analysisByDatetimeData) {
    try {

      if (analysisByDatetimeData) {
        let jsonAnalysisData = JSON.parse(analysisByDatetimeData);
        jsonAnalysisData = jsonAnalysisData[GetRundomNumber(jsonAnalysisData.length)];

        if (jsonAnalysisData) {
          self.AnalysisMemorys['content'] = decodeURIComponent(decodeURIComponent(jsonAnalysisData['content']));
          self.AnalysisMemorys['registDate'] = jsonAnalysisData['registDate'];
        }
      }

    } catch (e) {
    }
  });
}

// 解析し、選出した思考メモを指定箇所に表示する
MemorysAi.prototype.OutputDisplayContent = function(outputElement) {
  $(outputElement).text(this.AnalysisMemorys.content);
}
// 解析し、選出した思考メモを指定箇所に表示する
MemorysAi.prototype.OutputDisplayContentAi = function(outputElement) {
  $(outputElement).text(this.AnalysisAiMemorys.content);
}

// 解析し、選出した思考メモの過去年月情報を指定箇所に表示する
MemorysAi.prototype.OutputDisplayDayAgoMessage = function(outputElement) {
  $(outputElement).text(this.GetDiffDateMessage(this.AnalysisAiMemorys.registDate));
}

// 解析結果の思考メモがどれくらい前の情報なのかメッセージにして返す
MemorysAi.prototype.GetDiffDateMessage = function(registDateArgs) {
  let nowDate = moment();
  let registDateTmp = moment(registDateArgs);

  let diffDays = nowDate.diff(registDateTmp, 'days');
  let diffYears = nowDate.diff(registDateTmp, 'years');
  let diffMonths = nowDate.diff(registDateTmp, 'months');
  let diffYearsMessage = diffYears > 0 ? String(diffYears) + '年' : '';
  let diffMonthsMessage = diffMonths > 0 ? String(diffMonths % 12) + 'カ月' : '';
  let yearMonthLinkDaysString = diffYearsMessage.length > 0 || diffMonthsMessage.length > 0 ? 'と' : '';
  let diffDaysMessage = (diffDays % 30 > 0 ? yearMonthLinkDaysString + String(diffDays % 30) + '日' : '');
  let dayAgoMessage = diffYearsMessage + diffMonthsMessage + diffDaysMessage + '前にアイデアメモがあります';

  return dayAgoMessage;
}

// AI解析処理を実行する
MemorysAi.prototype.PeriodicExecution = function(memoryList) {

  // 解析用思考データを設定する
  this.ReadMemorysResult = memoryList;

  // 思考メモを時系列で解析する
  this.AnalysisByDatetime();

  // 読み込みや解析を定期実行する
  setInterval(function() {

    // 思考メモを時系列で解析する
    this.AnalysisByDatetime();
    
  }.bind(this), 1000 * 10);  // 10秒に一度定期実行
}

// 解析対象の過去年月情報をランダムに抽出する
MemorysAi.prototype.GetAnalysisDateAgoType = function() {
  // どれくらい前の思考メモを解析対象するかを返す
  let dateAgoType = [
    //'3 days',     // 3日前
    '-14 days',    // 2週間前
    '-1 month',   // 1カ月前
    '-3 month',   // 3カ月前
    '-6 month',   // 半年前
    '-1 year',    // 1年前
    '-2 year',    // 2年前
    '-3 year',    // 3年前
    '-10 year',   // 10年前
  ];

  let dateAgoTypeIndex = GetRundomNumber(dateAgoType.length);
  return dateAgoType[dateAgoTypeIndex];
}

// AI機能の自然言語解析を行う
MemorysAi.prototype.AnalysisAi = async function(analysisText) {
  return new Promise(resolve => {
    // Pythonに向けてAjax送信を行い、投稿内容解析を行う
    let memoryResult = {};
    this.ReadMemorysResult.forEach(function(memoryInfo) {
      memoryResult[memoryInfo.memoryKey] = {
        content:encodeURIComponent(memoryInfo.content),
        registDate:memoryInfo.registDate,
      };
    });

    let self = this;

    self.AnalysisAiMemorys = {};
    $.post('./Api/AiAnalysis/Analysis.php',{memorys: JSON.stringify({
      analysisTarget:encodeURIComponent(analysisText),        // 投稿内容
      memoryList:memoryResult,                                // 過去に記憶させた思考メモリスト
    })}, function(mecabAnalysis) {
      try {

        let jsonMecabAnalysis = JSON.parse(mecabAnalysis);
        self.AnalysisAiMemorys['content'] = decodeURIComponent(decodeURIComponent(jsonMecabAnalysis['original']));
        self.AnalysisAiMemorys['registDate'] = jsonMecabAnalysis['registDate'].replace('+', ' ');
        self.AnalysisAiMemorys['degreeOfSimilarity'] = jsonMecabAnalysis['degreeOfSimilarity'];

        resolve(true);

      } catch (e) {
        resolve(false);
      }
    });
  });
}

// AIによる解析検索を行う
MemorysAi.prototype.SearchAi = async function(searchText) {
  return new Promise(resolve => {
    // Pythonに向けてAjax送信を行い、投稿内容解析を行う
    let memoryResult = {};
    this.ReadMemorysResult.forEach(function(memoryInfo) {
      memoryResult[memoryInfo.memoryKey] = {
        content:encodeURIComponent(memoryInfo.content),
        registDate:memoryInfo.registDate,
      };
    });

    let self = this;

    let searchAiMemorys = [];
    $.post('./Api/AiAnalysis/SearchAi.php',{memorys: JSON.stringify({
      analysisTarget:encodeURIComponent(searchText),          // 検索内容
      memoryList:memoryResult,                                // 過去に記憶させた思考メモリスト
    })}, function(mecabAnalysis) {
      try {

        let jsonMecabAnalysis = JSON.parse(mecabAnalysis);

        let searchAiMemorysTmp = [];
        searchAiMemorysTmp = Object.entries(jsonMecabAnalysis);

        searchAiMemorys = searchAiMemorysTmp.sort().reverse().map(function(memorys) {
          return {
            degreeOfSimilarity: memorys[0],
            memoryKey: memorys[1]['memoryKey'],
            content: decodeURIComponent(memorys[1]['original']),
            registDate: memorys[1]['registDate'].replace('+', ' '),
          };
        });

        resolve(searchAiMemorys);

      } catch (e) {
        resolve(false);
      }
    });
  });
}

// 単語検索を行う
MemorysAi.prototype.SearchSingleWord = async function(searchText) {
  return new Promise(resolve => {

    // 指定キーワードによる単語検索を行う
    let memoryResult = [];
    this.ReadMemorysResult.forEach(function(memoryInfo) {
      if (memoryInfo.content && memoryInfo.content.indexOf(searchText) != -1) {
        memoryResult.push({
          memoryKey: memoryInfo.memoryKey,
          content: memoryInfo.content,
          registDate: memoryInfo.registDate,
        });
      }
    });

    resolve(memoryResult);
  });
}