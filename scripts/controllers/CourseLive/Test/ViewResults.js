"use strict";
var ViewResultsModule = angular.module("app.courselive.test.ViewResults", []);
ViewResultsModule.controller("ViewResultsController", [
  "$scope",
  "$state",
  "MarkingProviderUrl",
  function($scope, $state, MarkingProviderUrl) {
    $scope.testid = $G2S.request("TestID");
    $scope.exercisecount = 0;
    $scope.GroupIDS = ""; //获取所有分组id
    var surplusmiao = 0;
    var surplusfen = 0;
    var surplusshi = 0;
    //获取试卷题目
    var PaperInfo_Get = function(paperid) {
      // var paperid = 11;
      var userid = $G2S.request("UserID", "-1");
      var testid = $scope.testid;
      var url = MarkingProviderUrl + "/MarkingPaperInfo_Get";
      var param = { PaperID: paperid, TestID: testid, UserID: userid };
      $scope.baseService.post(url, param, function(data) {
        // export data to JSON string
        //alert(JSON.stringify(data.d.ExerciseChoices));
        //layer.alert(JSON.stringify(param));
        $scope.paper = data.d.paper;
        $scope.papergrouplist = data.d.papergrouplist;
        $scope.exerciselist = data.d.exerciselist;
        $scope.ExerciseChoices = data.d.ExerciseChoices;
        if (data.d.paper != null) {
          $scope.Timelimit = data.d.paper.TimeLimit;
        }
        //$scope.exercisecount = $scope.exerciselist.length;
        $scope.exerciseConten = $scope.paper.Brief;

        TestAnswer_Get();
        // export data to JSON string
        //alert(JSON.stringify(data.d));
      });

      $scope.$on("ngViewResultsLoadMark", function(ngRepeatFinishedEvent) {
        for (var i = 0; i < $scope.papergrouplist.length; i++) {
          $scope.GroupIDS = $scope.papergrouplist[i].GroupID + ",";
          var count = 0;
          var score = 0;
          var countscore = 0;
          for (var k = 0; k < $scope.exerciselist.length; k++) {
            if (parseInt($scope.exerciselist[k].ParentExerciseID) < 0) {
              $scope.exerciselist[k].ParentExerciseID = "-1";
            }
            if (
              $scope.papergrouplist[i].GroupID ==
                $scope.exerciselist[k].PaperGroupID &&
              $scope.exerciselist[k].ParentExerciseID != "-1"
            ) {
              count++;
              score = score + parseFloat($scope.exerciselist[k].Score);
              $scope.exercisecount++;
            }
            if (parseInt(score) <= 0) {
              score = 100;
            }
            countscore = countscore + score;
            $("#b_exercise_" + $scope.papergrouplist[i].GroupID).html(count);
            $("#b_exercisescore_" + $scope.papergrouplist[i].GroupID).html(
              score
            );
          }
        }
        if (parseInt($scope.paper.Score) <= 0) {
          $scope.paper.Score = countscore;
        }
        $scope.paper.Score = 100;
      });
    };

    var GetUser = function() {
      var userid = $G2S.request("UserID", "-1");
      var url = MarkingProviderUrl + "/GetUserByUserID";
      var param = { UserID: userid };
      $scope.baseService.post(url, param, function(data) {
        $scope.User = data.d;
      });
    };

    //获取答案
    var TestAnswer_Get = function() {
      var testid = $scope.testid;
      var userid = $G2S.request("UserID", "-1");
      var url = MarkingProviderUrl + "/TestAnswer_Get";
      var param = { TestID: testid, CheckUserID: userid };
      $scope.baseService.post(url, param, function(data) {
        // 调用承诺API获取数据 .resolve
        $scope.AllScore = 0;
        if (data.d.ExerciseAnswerUsers != null) {
          $scope.UseTime = data.d.ExerciseAnswerUsers.UseTime;
        } else {
          $scope.UseTime = 0;
        }
        $scope.TestAnswer = data.d.ExerciseAnswers;
        $scope.TestUsers = data.d.TestUsers;
        //if ($scope.TestUsers.Status < 20) {
        //    window.location.href = "../../CourseLive/Test/StudentWorkList";
        //    return;
        //}
        $scope.Evaluatevalue = "|-|Ac|<";
        for (var i = 0; i < $scope.TestAnswer.length; i++) {
          var rows = $scope.TestAnswer[i];
          var _choices = $scope.ExerciseChoices;
          var _choiceID = parseInt(rows.Conten, 10);
          var flagisactive = 0;

          if (parseFloat(rows.Score) > 0) {
            flagisactive = 1;
          } else {
            for (var _i = 0; _i < _choices.length; _i++) {
              if (
                _choices[_i].ChoiceID === _choiceID &&
                _choices[_i].IsCorrect
              ) {
                rows = $.extend(rows, {
                  Score: rows.PaperExerciseScore,
                  isHack: true
                });
                flagisactive = 2;
                break;
              }
            }
          }

          $scope.AllScore += parseFloat(rows.Score);
          ExerciseAnswerComment(rows.ExerciseID, flagisactive);
          if (rows.IsComment != 1) {
            $("#pingyu_" + rows.ExerciseID).hide();
          }

          if (rows.Conten != "") {
            if (rows.ExerciseType == 1) {
              $scope.ExerciseChoicesClick(rows.ExerciseID, rows.Conten);
            } else if (rows.ExerciseType == 2 || rows.ExerciseType == 3) {
              var str = rows.Conten.split("wshgkjqbwhfbxlfrh_c");
              if (str.length > 1) {
                for (var kk = 0; kk < str.length; kk++) {
                  $('input[name="xuanze_' + rows.ExerciseID + '"]').each(
                    function() {
                      if ($(this).attr("pid") == str[kk]) {
                        $(this).attr("checked", true);
                        return;
                      }
                    }
                  );
                }
              } else {
                $('input[name="xuanze_' + rows.ExerciseID + '"]').each(
                  function() {
                    if ($(this).attr("pid") == str) {
                      $(this).attr("checked", true);
                    } else {
                      $(this).attr("checked", false);
                    }
                  }
                );
              }
            } else if (rows.ExerciseType == 4 || rows.ExerciseType == 11) {
              if (document.getElementById("txt_" + rows.ExerciseID)) {
                $("#txt_" + rows.ExerciseID).val(rows.Conten);
                $("#sp_" + rows.ExerciseID).text(rows.Score);
              }
            } else if (rows.ExerciseType == 5 || rows.ExerciseType == 18) {
              if (document.getElementById("txt_" + rows.ExerciseID)) {
                $("#txt_" + rows.ExerciseID).val(rows.Conten);
                $("#sp_" + rows.ExerciseID).text(rows.Score);
              }
              $("#txt_" + rows.ExerciseID).text(rows.Conten);
            } else if (
              rows.ExerciseType == 8 ||
              rows.ExerciseType == 9 ||
              rows.ExerciseType == 10 ||
              rows.ExerciseType == 13
            ) {
              try {
                $("#oEditor_" + rows.ExerciseID).val(rows.Conten);
                $("#sp_" + rows.ExerciseID).text(rows.Score);
                var editor = EWEBEDITOR.Replace("oEditor_" + rows.ExerciseID, {
                  style: "Markingmini",
                  width: "900",
                  height: "220"
                });
              } catch (e) {}
            }
          }
        }
        $scope.yanchengji = 0;
        if ($scope.TestUsers.IsDelay == 1 && $scope.test.Delay == 3) {
          $scope.yanchengji = $scope.AllScore;
          var zhekou = $scope.AllScore * $scope.test.DelayScoreDiscount / 100;
          zhekou = zhekou.toFixed(1);
          $scope.AllScore = $scope.AllScore - zhekou;
        } else {
          $scope.yanchengji = $scope.AllScore;
        }
      });

      $scope.$on("ngViewResultsLoadOrde", function(ngRepeatFinishedEvent) {
        var flag = 0;
        $(".num_box li").each(function() {
          flag++;
          $(this).attr("index", flag);
          var orde = $(this).attr("orde");
          var exerciseid = $(this).attr("pid");

          $("#li_" + exerciseid).html(flag);
          $("#spa_" + exerciseid).text(flag + ".");
        });
        $(".num_box li").live("click", function() {
          //debugger;
          //var _num = $(this).attr("index");
          // var count = $(this).parent().index($('.question_num'));
          var exerciseid = $(this).attr("pid");
          var _top = $("#spa_" + exerciseid).offset().top;
          $("html,body").animate({ scrollTop: _top }, 500);
        });
      });
    };

    //判断对错
    var ExerciseAnswerComment = function(ExerciseID, isactive) {
      for (var i = 0; i < $scope.exerciselist.length; i++) {
        if (ExerciseID == $scope.exerciselist[i].ExerciseID) {
          $scope.exerciselist[i].ExerciseAnswerIsactive = isactive;
          break;
        }
      }
    };

    $scope.ExerciseChoicesClick = function(ExerciseID, type) {
      if (type == 1) {
        $("#panduan_" + ExerciseID + "_" + 0).removeClass("active");
      } else {
        $("#panduan_" + ExerciseID + "_" + 1).removeClass("active");
      }
      $("#panduan_" + ExerciseID + "_" + type).addClass("active");
    };

    //获取评语
    $scope.TestUser_comment = function(coexercise) {
      $scope.coexercise = coexercise;
      Test_Comment_list(coexercise);
      $("#myModal").modal("show");
    };

    //参考答案火药
    $scope.TestUser_Answer = function(exercise) {
      var analysis = $G2S.isEmpty(exercise.Analysis)
        ? "<span style='color:#f00;font-size:14px'>暂无习题解析！</span>"
        : exercise.Analysis;
      var txt_Answer = $G2S.isEmpty(exercise.Answer)
        ? "<span style='color:#f00;font-size:14px'>暂无参考答案！</span>"
        : exercise.Answer.replace("wshgkjqbwhfbxlfrh_c", ",");
      var tmpHtml = $("#pop_answer_tmp").html();
      tmpHtml = tmpHtml
        .replace(/\[\[Answer\]\]/g, txt_Answer)
        .replace(/\[\[Analysis\]\]/g, analysis)
        .replace(/\[\[height\]\]/g, "200px");
      layer.open({
        type: 1,
        title: "参考答案",
        area: ["800px", "550px"], //宽高
        content: tmpHtml
      });
    };

    //获取评语2
    var Test_Comment_list = function(coexercise) {
      var testid = $scope.testid;
      var userid = $G2S.request("UserID", "-1");
      var url = MarkingProviderUrl + "/Test_Comment_list";
      var param = {
        TestID: testid,
        StudentUserID: userid,
        ExerciseID: coexercise
      };
      $scope.baseService.post(url, param, function(data) {
        $scope.Commentlist = data.d;
      });
    };
    //获取总评语
    var Test_Comment_list2 = function() {
      //debugger;
      var testid = $scope.testid;
      var userid = $G2S.request("UserID", "-1");
      var url = MarkingProviderUrl + "/Test_Comment_list";
      var param = { TestID: testid, StudentUserID: userid, ExerciseID: 0 };
      $scope.baseService.post(url, param, function(data) {
        $scope.ZongCommentlist = data.d;
        $scope.zongcommentlength = data.d.length;
      });
    };

    //部分 收缩 展示
    $scope.GroupUpDown = function(index) {
      if (
        $(".ico_showhide")
          .eq(index)
          .attr("tid") == "1"
      ) {
        // var kid = $(thi).attr("kid");
        //$("#question_num_" + kid).hide();
        $(".num_box")
          .eq(index)
          .hide();
        $(".ico_showhide")
          .eq(index)
          .attr("tid", "2");
        $(".ico_showhide")
          .eq(index)
          .removeClass("ico_up");
        $(".ico_showhide")
          .eq(index)
          .addClass("ico_down ico_showhide");
      } else {
        $(".num_box")
          .eq(index)
          .show();
        $(".ico_showhide")
          .eq(index)
          .attr("tid", "1");
        $(".ico_showhide")
          .eq(index)
          .removeClass("ico_down");
        $(".ico_showhide")
          .eq(index)
          .addClass("ico_up ico_showhide");
      }
    };

    //关闭
    $scope.backClose = function() {
      window.close();
    };

    $scope.AnswerIsTrue = function(s1, s2) {
      //var vrrs1 = s1.split('wshgkjqbwhfbxlfrh_c');
      if (s1 != null && s1 != "" && s1 != undefined) {
        var vrrs1 = s1.split(",");
        for (var i = 0; i < vrrs1.length; i++) {
          if (vrrs1[i] == s2) {
            return true;
          }
        }
      }
    };

    var cssInit = function() {
      $(".remark_box").hover(function() {
        $(this)
          .find("span")
          .toggle();
      });
      var arr = [];
      for (var i = 0; i < $(".section_work").length; i++) {
        var _topA = $(".section_work")
          .eq(i)
          .offset().top;
        arr.push(_topA);
      }

      var ie6 = !-[1] && !window.XMLHttpRequest;
      $(window).scroll(function() {
        var _scrollTop = $(document).scrollTop();
        if (!ie6) {
          setTimeout(function() {
            for (var j = 0; j < $(".section_work").length; j++) {
              //var _top = $('.section').eq(j).offset().top;
              if (_scrollTop >= arr[j]) {
                $(".num_box li")
                  .eq(j)
                  .addClass("thisLi")
                  .siblings()
                  .removeClass("thisLi");
              } else if (_scrollTop < arr[0]) {
                $(".num_box li").removeClass("thisLi");
              }
            }
          }, 200);
        }
      });
    };

    //获取考试详细
    var Test_Get = function() {
      var testid = $scope.testid;
      var url = MarkingProviderUrl + "/Test_Get";
      var param = { TestID: testid };
      $scope.baseService.post(url, param, function(data) {
        // export data to JSON string
        //alert(JSON.stringify(data.d));
        $scope.test = data.d;
        $scope.ScaleTypeName = $scope.test.ScaleTypeName;
        PaperInfo_Get($scope.test.PaperID);
      });
    };
    var Init = function() {
      //for (i = 10100; i < 10102; ++i) {
      //    var _url_objget = "/DataProvider/CourseLive/Test/MarkingProvider.aspx/Test_Get";
      //    var _url_ansget = "/DataProvider/CourseLive/Test/MarkingProvider.aspx/MarkingPaperInfo_Get";
      //    var _param_objget = { TestID: i };
      //    $scope.baseService.post(_url_objget, _param_objget, function (data) {
      //        $scope.test = data.d
      //    });
      //    alert(JSON.stringify($scope.test));
      //    var _param_ansget = { TestID: i, PaperID: $scope.test.PaperID, UserID: -1};
      //    $scope.baseService.post(_url_ansget, _param_ansget, function (d) {
      //        alert(JSON.stringify(d));
      //    });
      //}
      cssInit();
      GetUser();
      Test_Get();
      Test_Comment_list2();
    };
    Init();
  }
]);

ViewResultsModule.directive("onSubmitStudentByMark", function($timeout) {
  return {
    restrict: "A",
    link: function(scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function() {
          scope.$emit("ngSubmitStudentByMark");
        });
      }
    }
  };
});

ViewResultsModule.directive("onViewResultsMarkCardExercise", function(
  $timeout
) {
  return {
    restrict: "A",
    link: function(scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function() {
          scope.$emit("ngViewResultsMarkCardExercise");
        });
      }
    }
  };
});

ViewResultsModule.directive("onViewResultsLoadMark", function($timeout) {
  return {
    restrict: "A",
    link: function(scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function() {
          scope.$emit("ngViewResultsLoadMark");
        });
      }
    }
  };
});

ViewResultsModule.directive("onViewResultsLoadOrde", function($timeout) {
  return {
    restrict: "A",
    link: function(scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function() {
          scope.$emit("ngViewResultsLoadOrde");
        });
      }
    }
  };
});

//选项筛选器
ViewResultsModule.filter("choicesFilter", function() {
  return function(item, ExerciseID) {
    return item.filter(function(i) {
      return i.ExerciseID == ExerciseID;
    });
  };
});

ViewResultsModule.filter("sortFilter", function() {
  return function(item, flag) {
    if (flag) {
      item.sort(function() {
        return 0.5 - Math.random();
      });
    }
    return item;
  };
});
//习题筛选器
ViewResultsModule.filter("exerciseFilter", function() {
  return function(item, GroupID, PaperID) {
    return item.filter(function(i) {
      return (
        i.PaperID == PaperID &&
        i.PaperGroupID == GroupID &&
        i.ParentExerciseID <= 0
      );
    });
  };
});

ViewResultsModule.filter("exerciseFilter2", function() {
  return function(item, GroupID, PaperID) {
    return item.filter(function(i) {
      if (i.ParentExerciseID < 0) {
        return false;
      } else {
        return i.PaperID == PaperID && i.PaperGroupID == GroupID;
      }
    });
  };
});

ViewResultsModule.filter("exerciseParentFilter", function() {
  return function(item, GroupID, PaperID, ParentExerciseID) {
    return item.filter(function(i) {
      return (
        i.PaperID == PaperID &&
        i.PaperGroupID == GroupID &&
        i.ParentExerciseID == ParentExerciseID
      );
    });
  };
});

ViewResultsModule.filter("ToNumByLetter", function() {
  return function(s) {
    return {
      1: "A",
      2: "B",
      3: "C",
      4: "D",
      5: "E",
      6: "F",
      7: "G",
      8: "H",
      9: "I",
      10: "J",
      11: "K"
    }[s];
  };
});

ViewResultsModule.filter("exerciseParentIsshow", function() {
  return function(item) {
    return item.filter(function(i) {
      //debugger;
    });
  };
});

//正确答案筛选
ViewResultsModule.filter("exerciseAnswerIsTrue", function() {
  return function(s1, s2) {
    var vrrs1 = s1.split("wshgkjqbwhfbxlfrh_c");
    for (var i = 0; i < vrrs1.length; i++) {
      return true;
    }
  };
});
