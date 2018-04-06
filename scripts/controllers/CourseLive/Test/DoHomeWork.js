"use strict";
var DoHomeWorkModule = angular.module("app.courselive.test.DoHomeWork", []);
DoHomeWorkModule.controller("DoHomeWorkController", [
  "$scope",
  "$state",
  "MarkingProviderUrl",
  function($scope, $state, MarkingProviderUrl) {
    $scope.testid = $G2S.request("TestID");
    $scope.pre = $G2S.request("pre");
    $scope.IsIE = 0; //是否为IE浏览器
    $scope.IsFirefox = 0; //是否为非IE浏览器
    $scope.Timelimit = 0; //考试时长
    $scope.UseTime = 0; //所用时长
    $scope.exercisecount = 0;
    $scope.wanchenglv = "----"; //完成率默认----

    $scope.testCanSubmit = false; //此份作业可以提交
    $scope.iCanSubmit = false; //学生是否可以提交
    $scope.isLoad = false; //学生答案是否已经加载完成

    var int_id;
    var surplusmiao = 0;
    var surplusfen = 0;
    var surplusshi = 0;
    //获取试卷题目
    var PaperInfo_Get = function(paperid) {
      var testid = $scope.testid;
      var url = MarkingProviderUrl + "/PaperInfo_Get";
      if ($scope.pre == undefined) {
        url = MarkingProviderUrl + "/PaperInfo_Get";
      } else {
        url = MarkingProviderUrl + "/PaperInfo_Get_Preview";
      }

      var param = { PaperID: paperid, TestID: testid };
      $scope.baseService.post(url, param, function(data) {
        $scope.paper = data.d.paper;
        $scope.papergrouplist = data.d.papergrouplist;
        $scope.exerciselist = data.d.exerciselist;
        $scope.ExerciseChoices = data.d.ExerciseChoices;
        $scope.Timelimit = 9999;
        $scope.exerciseConten = $scope.paper.Brief;
      });
      $scope.$on("ngPaperInfo", function(ngRepeatFinishedEvent) {
        // add answer page
        var __orig_title = $(".ng-binding").html();
        var testid = $scope.testid;
        var __new_title =
          __orig_title +
          ' <a class="hack_btn_answer" style="color:cyan;" href="javascript:void(0);">' +
          "即时答案" +
          "</a>";
        __new_title =
          __new_title +
          ' <a style="color:orange;" href="/G2S/CourseLive/Test/viewResults?TestID=' +
          testid +
          '">' +
          "参考答案" +
          "</a>";
        $("h4.ng-binding").html(__new_title);
        $("a.hack_btn_answer").on("click", function() {
          $scope._showAnswer = !$scope._showAnswer;
        });

        //锚点
        var flag = 0;
        $(".question_num li").each(function() {
          flag++;
          $(this).attr("index", flag);
          var orde = $(this).attr("orde");
          var exerciseid = $(this).attr("pid");
          $("#li_" + exerciseid).html(flag);
          $("#sp_" + exerciseid).text(flag + ".");
        });
        $(".question_num li").live("click", function() {
          var exerciseid = $(this).attr("pid");
          var _top = $("#sp_" + exerciseid).offset().top;
          $("html,body").animate({ scrollTop: _top }, 500);
        });

        if ($scope.IsFirefox == 1) {
          setInterval(function() {
            $scope.$apply(EwebeditorByValue());
          }, 5000);
        }
      });
      $scope.$on("ngLoadTime", function(ngRepeatFinishedEvent) {
        var pre = $scope.pre;
        if (pre == undefined) {
          if (
            $scope.exerciselist.length > 10 &&
            $scope.exerciselist.length <= 20
          ) {
            setTimeout(TestAnswer_Get, 1000);
          } else if (
            $scope.exerciselist.length > 20 &&
            $scope.exerciselist.length <= 40
          ) {
            setTimeout(TestAnswer_Get, 1000);
          } else if (
            $scope.exerciselist.length > 40 &&
            $scope.exerciselist.length <= 999
          ) {
            setTimeout(TestAnswer_Get, 2000);
          } else {
            setTimeout(TestAnswer_Get, 600);
          }
          autosave(); //改为在获取学生答案后再开始自动保存
        } else {
          $(".remain_box").hide();
          $(".paper_operation").hide();
          autosave();
        }

        var flag = 0;
        for (var i = 0; i < $scope.papergrouplist.length; i++) {
          var count = 0;
          var score = 0;
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
            $("#b_exercise_" + $scope.papergrouplist[i].GroupID).html(count);
            $("#b_exercisescore_" + $scope.papergrouplist[i].GroupID).html(
              score.toFixed(1)
            );
          }
        }
      });
    };

    //获取当前作业编号序号
    var ExerciseByOrder = function() {
      for (var i = 0; i < $scope.papergrouplist.length; i++) {
        var count = 0;
        var score = 0;
        for (var k = 0; k < $scope.exerciselist.length; k++) {
          if (parseInt($scope.exerciselist[k].ParentExerciseID) < 0) {
            $scope.exerciselist[k].ParentExerciseID = "-1";
          }
          if (
            $scope.papergrouplist[i].GroupID ==
              $scope.exerciselist[k].PaperGroupID &&
            $scope.exerciselist[k].ParentExerciseID != "-1"
          ) {
            $scope.exerciselist[k].Orde = k + 1;
          }
        }
      }
    };

    //判断当前id是否有子集
    $scope.exerciseIsson = function(id) {
      var flag = 0;
      for (var k = 0; k < $scope.exerciselist.length; k++) {
        if ($scope.exerciselist[k].ParentExerciseID == id) {
          flag = 1;
        }
      }
      return flag;
    };

    var Test_CanSeeTest = function() {
      var testid = $scope.testid;
      var url = MarkingProviderUrl + "/Test_CanSeeTest";
      var param = { TestID: testid, CheckUserID: -1, ret: 0 };
      $scope.baseService.post(url, param, function(data) {
        if (data.d == 0) {
          window.location.href = "StudentWorkList";
        }
      });
    };

    //获取考试详细
    var Test_Get = function() {
      var testid = $scope.testid;
      var url = MarkingProviderUrl + "/Test_Get";
      var param = { TestID: testid };
      $scope.baseService.post(url, param, function(data) {
        $scope.test = data.d;
        $scope.testCanSubmit = true; //此份作业可以提交
        //if ($scope.test.TimeStatus == 3 && $scope.test.Delay == 0) { //作业考试已结束&&禁止迟交的作业
        //    $scope.testCanSubmit = true; //此份作业可以提交
        //} else {
        //    $scope.testCanSubmit = true;
        //}
        $scope.ScaleTypeName = $scope.test.ScaleTypeName;

        PaperInfo_Get($scope.test.PaperID);
      });
    };
    //获取答案
    var TestAnswer_Get = function() {
      var testid = $scope.testid;
      var url = MarkingProviderUrl + "/TestAnswer_Get";
      var param = { TestID: testid, CheckUserID: -1 };
      $scope.baseService.post(url, param, function(data) {
        // 调用承诺API获取数据 .resolve

        if (data.d.ExerciseAnswerUsers != null) {
          $scope.UseTime = data.d.ExerciseAnswerUsers.UseTime;
        } else {
          $scope.UseTime = 0;
        }

        //如果不是考试不显示时间（试卷需要时间）
        if ($scope.test.Type != 2) {
          surplusfen = 0;
        } else {
          surplusfen = parseInt($scope.Timelimit) - parseInt($scope.UseTime);
        }
        //if (surplusfen > 0) {
        //    saveTime();
        //} else {
        $("#jishiqi").html("----");
        //}

        $scope.TestAnswer = data.d.ExerciseAnswers;
        $scope.TestUsers = data.d.TestUsers;
        if ($scope.TestUsers.Status < 20) {
          $scope.iCanSubmit = true;
        } else {
          if ($scope.test.ScoreSource <= 1 && $scope.test.Type != "2") {
            $scope.iCanSubmit = true;
          } else {
            flagdingshi = 200; //定时保存字段 默认数值为等于或小于120 大于120后不会执行定时保存了
          }
        }
        for (var i = 0; i < $scope.TestAnswer.length; i++) {
          var rows = $scope.TestAnswer[i];
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
                    }
                  }
                );
              }
              $scope.ExerciseCheckClick(rows.ExerciseID);
            } else if (rows.ExerciseType == 4 || rows.ExerciseType == 11) {
              if (document.getElementById("txt_" + rows.ExerciseID)) {
                $("#txt_" + rows.ExerciseID).val(rows.Conten);
                $scope.ExerciseTextClick(rows.ExerciseID, 0);
              }
            } else if (rows.ExerciseType == 5 || rows.ExerciseType == 18) {
              //debugger;
              if (document.getElementById("txt_" + rows.ExerciseID)) {
                $("#txt_" + rows.ExerciseID).val(rows.Conten);
                $scope.ExerciseTextClick(rows.ExerciseID, 0);
              }
              $("#txt_" + rows.ExerciseID).text(rows.Conten);
            } else if (
              rows.ExerciseType == 8 ||
              rows.ExerciseType == 9 ||
              rows.ExerciseType == 10 ||
              rows.ExerciseType == 13
            ) {
              try {
                // debugger;
                // $("#oEditor_" + rows.ExerciseID).val(rows.Conten);
                // var editor = EWEBEDITOR.Replace("oEditor_" + rows.ExerciseID, { style: "mini", width: "880", height: "220" });
                if ($scope.IsIE == 1) {
                  document
                    .getElementById("frmoEditor_" + rows.ExerciseID)
                    .contentWindow.setHTML(rows.Conten);
                  $scope.ExerciseTextClick(rows.ExerciseID, 1);
                } else {
                  $("#txt_" + rows.ExerciseID).val(
                    rows.Conten.replace(/<[^>]+>|&nbsp;/g, "")
                  );
                  $scope.ExerciseTextClick(rows.ExerciseID, 0);
                }
              } catch (e) {
                // alert(e);
              }
            }
          }
        }
        $scope.isLoad = true;
      });
    };

    $scope.Loadewebeditorhtml = function(ExerciseID) {
      var strHtml = "";
      var strsplit = window.location.href.split("/CourseLive");
      var palyurl = strsplit[0];
      strHtml +=
        "  <input type='hidden' name='oEditor_" +
        ExerciseID +
        "' id='oEditor_" +
        ExerciseID +
        "'  ng-value='frmoEditor" +
        ExerciseID +
        "'/>";
      strHtml +=
        "<iframe src='" +
        palyurl +
        "/Frameworks/eWebEditor/ewebeditor.htm?id=oEditor_" +
        ExerciseID +
        "&style=mini' frameborder='0' scrolling='no' width='880' height='220' style='display: block;' id='frmoEditor_" +
        ExerciseID +
        "' onblur='ExerciseTextClick(" +
        ExerciseID +
        ",1)'></iframe>";
      return strHtml;
    };

    //计时器
    var flagSecond = 0;
    var saveTime = function() {
      var flagmiao = "0";
      var flagfen = "0";
      var flagshi = "0";
      for (var ii = 0; ii < 100; ii++) {
        if (parseInt(surplusfen) > 60) {
          surplusshi++;
          surplusfen = surplusfen - 60;
        }
      }
      if (parseInt(surplusfen) == 0) {
        if (parseInt(surplusshi) > 0) {
          surplusshi--;
          surplusfen = surplusfen + 60;
        }
      }
      if (parseInt(surplusmiao) == 0) {
        surplusfen--;
        surplusmiao = 59;
      }
      if (parseInt(surplusmiao) > 9) {
        flagmiao = "";
      }
      if (parseInt(surplusfen) > 9) {
        flagfen = "";
      }
      if (parseInt(surplusshi) > 9) {
        flagshi = "";
      }
      $("#jishiqi").html(
        flagshi +
          surplusshi +
          ":" +
          flagfen +
          surplusfen +
          ":" +
          flagmiao +
          surplusmiao
      );
      surplusmiao--;
      flagSecond++;
      if (flagSecond == 120) {
        //定时120秒保存答案
        flagSecond = 0;
      }
      setTimeout(saveTime, 1000);
      //取消提交
      //if (surplusmiao == 0 && parseInt(surplusfen) == 0 && surplusshi == 0) {

      //    //$scope.TestTempSave_Upd();//关闭页面前最后再暂存一次可能导致暂存方法取了空数据
      //    var testid = $scope.testid;
      //    var url = MarkingProviderUrl + "/Test_Submit";
      //    var param = { TestID: testid };
      //    $scope.baseService.post(url, param, function (data) {
      //        window.location.href = "StudentWorkList";
      //    });
      //}
    };
    //获取用户信息
    var GetUser = function() {
      var url = MarkingProviderUrl + "/GetUser";
      var param = {};
      $scope.baseService.post(url, param, function(data) {
        $scope.User = data.d;
      });
    };

    //判断题答案保存
    $scope.ExerciseChoicesClick = function(ExerciseID, type) {
      if (type == 1) {
        $("#panduan_" + ExerciseID + "_" + 0).removeClass("active");
      } else {
        $("#panduan_" + ExerciseID + "_" + 1).removeClass("active");
      }
      $("#panduan_" + ExerciseID + "_" + type).addClass("active");
      ExerciseAnswerComment(ExerciseID, type, "1");
    };

    //单选/多选答案保存
    $scope.ExerciseCheckClick = function(ExerciseID) {
      var arr_v = new Array();
      $('input[name="xuanze_' + ExerciseID + '"]:checked').each(function() {
        arr_v.push($(this).attr("pid"));
      });
      var type = 0;
      if (arr_v != "") {
        type = 1;
      }
      var stras = arr_v;
      if (arr_v.length >= 1) {
        stras = "";
        for (var i = 0; i < arr_v.length; i++) {
          if (i != arr_v.length - 1) {
            stras += arr_v[i] + "wshgkjqbwhfbxlfrh_c";
          } else {
            stras += arr_v[i];
          }
        }
      }
      ExerciseAnswerComment(ExerciseID, stras, type);
    };
    //文本框/ewebeditor答案保存
    $scope.ExerciseTextClick = function(ExerciseID, type) {
      // debugger;
      var arr_v = "";
      if (type == 0) {
        arr_v = $("#txt_" + ExerciseID).val();
      } else {
        //debugger;
        arr_v = document
          .getElementById("frmoEditor_" + ExerciseID)
          .contentWindow.getHTML();
        //EWEBEDITOR.UpdateAll();
        //arr_v = $("#oEditor_" + ExerciseID).val();
      }
      var type = 0;
      if (arr_v != "") {
        type = 1;
      }
      ExerciseAnswerComment(ExerciseID, arr_v, type);
    };

    //往对象里面插入答案
    var ExerciseAnswerComment = function(ExerciseID, comment, isactive) {
      //debugger;
      for (var i = 0; i < $scope.exerciselist.length; i++) {
        if (ExerciseID == $scope.exerciselist[i].ExerciseID) {
          $scope.exerciselist[i].ExerciseAnswerComment = comment;
          $scope.exerciselist[i].ExerciseAnswerIsactive = isactive;
          //$scope.exerciseReverse[i].ExerciseAnswerComment = comment;
          //$scope.exerciseReverse[i].ExerciseAnswerIsactive = isactive;
          break;
        }
      }
      var count = 0;
      for (var i = 0; i < $scope.exerciselist.length; i++) {
        if ($scope.exerciselist[i].ExerciseAnswerIsactive == 1) {
          count++;
        }
      }
      var wancheng = count / $scope.exercisecount;
      wancheng = wancheng * 100;
      if (wancheng != 100) {
        $scope.wanchenglv = wancheng.toFixed(2) + "%";
      } else {
        $scope.wanchenglv = wancheng + "%";
      }
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
        $(".question_num")
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
        $(".question_num")
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

    //暂存
    $scope.zancuntishi = function() {
      $scope.TestTempSave_Upd(1);
    };

    //保存答案
    $scope.TestTempSave_Upd = function(n) {
      if (!$scope.isLoad) return;

      if ($scope.IsFirefox == 1) {
        EwebeditorByValue();
      }

      var testid = $scope.testid;
      var answer = "";
      for (var i = 0; i < $scope.exerciselist.length; i++) {
        if ($scope.exerciselist[i].ParentExerciseID >= 0) {
          answer +=
            $scope.exerciselist[i].ExerciseID +
            "wshgkjqbwhfbxlfrh_b" +
            $scope.exerciselist[i].ExerciseAnswerComment +
            "wshgkjqbwhfbxlfrh_a";
        }
      }
      var url = MarkingProviderUrl + "/TestTempSave_Upd";
      var param = { TestID: testid, Answer: answer };
      $scope.baseService.post(url, param, function(data) {
        if (n == 2) {
          if (data.d == 1) {
            Submit_Ing();
          } else if (data.d == 2) {
            layer.msg(
              "提交成功,但是提交的答案可能存在错误,请重新打开页面检查一下是否提交正确",
              {
                icon: 0,
                time: 2000
              }
            );
            Submit_Ing();
          } else if (data.d == -1) {
            layer.alert("提交时间已过", { icon: 2 });
          } else {
            layer.alert("提交失败", { icon: 2 });
          }
        } else if (n == 1) {
          if (data.d == 1) {
            layer.msg("暂存成功", { icon: 1, time: 2000 });
          } else if (data.d == 2) {
            layer.msg(
              "暂存成功,但是提交的答案可能存在错误,请重新打开页面检查一下是否提交正确",
              {
                icon: 0,
                time: 2000
              }
            );
          } else if (data.d == -1) {
            layer.alert("提交时间已过", { icon: 2 });
          } else {
            layer.alert("暂存失败", { icon: 2 });
          }
        }
      });
    };

    //作业提交
    $scope.Test_Submit = function() {
      if ($scope.IsFirefox == 1) {
        EwebeditorByValue();
      }
      var flag = 0;
      for (var i = 0; i < $scope.exerciselist.length; i++) {
        if (
          $scope.exerciselist[i].ExerciseAnswerComment == "" &&
          $scope.exerciselist[i].ParentExerciseID >= 0 &&
          $scope.exerciselist[i].ExerciseAnswerIsactive == 0
        ) {
          flag++;
        }
      }
      if (flag > 0) {
        layer.msg("您有" + flag + "道题目未完成,请完成后再提交", {
          icon: 2,
          time: 2000
        });
      } else {
        var msg = "您确认提交吗?";
        if ($scope.test.TimeStatus == 3 && $scope.test.Delay == 3) {
          //作业考试已结束&&迟交扣分类型作业
          msg = "该测试已到截止时间,继续提交将会扣除一定分值！";
        }
        layer.confirm(msg, { icon: 3, title: "提示" }, function(index) {
          $scope.TestTempSave_Upd(2);
          layer.msg("提交中", { icon: 16 });
          layer.close(index);
        });
      }
    };
    function Submit_Ing() {
      var testid = $scope.testid;
      var url = MarkingProviderUrl + "/Test_Submit";
      var param = { TestID: testid };
      $scope.baseService.post(url, param, function(data) {
        if (data.d == 1) {
          layer.msg("提交成功", { icon: 1 }, function() {
            try {
              if (window.opener && window.opener.reload_testList) {
                window.opener.reload_testList();
              }
            } catch (e) {}
            window.close();
          });
        } else if (data.d == -1) {
          layer.alert("登录状态已失效，请在新的页面中重新登录，然后再次提交", {
            icon: 0
          });
        } else {
          layer.alert("提交失败,请重试,或暂存后刷新页面再次提交", { icon: 2 });
        }
      });
    }

    //撤回重做
    $scope.Test_Return = function() {
      layer.confirm("您确认撤回重做吗?", { icon: 3, title: "提示" }, function(
        index
      ) {
        var testid = $scope.testid;
        var url = MarkingProviderUrl + "/TestStudent_Status_Upd";
        var param = { TestID: testid, Status: 10 };
        $scope.baseService.post(url, param, function(data) {
          layer.msg("撤回成功! 请按时提交，否则会受迟交扣分的影响", {
            icon: 1,
            time: 3000
          });
          window.location.reload();
        });
        layer.close(index);
      });
    };

    //自动保存
    var flagdingshi = 0;
    var autosave = function() {
      if ($scope.TestUsers != null && $scope.TestUsers.Status === 20) {
        //已提交，不再计时
        return;
      }
      if (!checkIsNeedAutoSave()) {
        setTimeout(autosave, 5000);
        return;
      }
      if (flagdingshi == 30) {
        $scope.TestTempSave_Upd();
        flagdingshi = 0;
      }
      flagdingshi++;
      //if (flagdingshi % 10 == 0) console.info(flagdingshi);
      setTimeout(autosave, 1000);
    };

    //判断是否需要开启计时器
    var checkIsNeedAutoSave = function() {
      var bool = false;
      var answer = "";
      if ($scope.isLoad) {
        //学生答案还未加载，暂时不开启计时
        for (var i = 0; i < $scope.exerciselist.length; i++) {
          if ($scope.exerciselist[i].ParentExerciseID >= 0) {
            var answer =
              $scope.exerciselist[i].ExerciseAnswerComment == null
                ? ""
                : $.trim($scope.exerciselist[i].ExerciseAnswerComment);
            if (answer != "") {
              bool = true;
              break;
            }
          }
        }
      }

      return bool;
    };

    var cssInit = function() {
      var arr = [];
      for (var i = 0; i < $(".question_list li").length; i++) {
        var _topA = $(".question_list li")
          .eq(i)
          .offset().top;
        arr.push(_topA);
      }

      var ie6 = !-[1] && !window.XMLHttpRequest;
      $(window).scroll(function() {
        var _scrollTop = $(document).scrollTop();
        if (!ie6) {
          setTimeout(function() {
            for (var j = 0; j < $(".question_list li").length; j++) {
              if (_scrollTop >= arr[j]) {
                $(".question_num li").removeClass("active");
                $(".question_num li")
                  .eq(j)
                  .addClass("active");
              } else if (_scrollTop < arr[0]) {
                $(".question_num li").removeClass("active");
              }
            }
          }, 200);
        }
      });

      //var ie6 = !-[1, ] && !window.XMLHttpRequest;
      //$(window).scroll(function () {
      //    var _scrollTop = $(document).scrollTop();
      //    if (!ie6) {
      //        setTimeout(function () {
      //            for (var j = 0; j < $('.question_list li').length; j++) {
      //                //var _top = $('.section').eq(j).offset().top;

      //            };
      //        }, 200);
      //    };
      //});
    };
    var EwebeditorByValue = function() {
      $("iframe").each(function(sender, id) {
        // debugger;
        var arr_v = "";
        if (id.id != "") {
          arr_v = document.getElementById(id.id).contentWindow.getHTML();
          var type = 0;
          if (arr_v != "") {
            type = 1;
          }

          var ExerciseID = id.id.split("_")[1];
          //alert(type);
          ExerciseAnswerComment(ExerciseID, arr_v, type);
        }
      });
    };

    var Init = function() {
      var userAgent = navigator.userAgent,
        rMsie = /(msie\s|trident.*rv:)([\w.]+)/,
        rFirefox = /(firefox)\/([\w.]+)/,
        rOpera = /(opera).+version\/([\w.]+)/,
        rChrome = /(chrome)\/([\w.]+)/,
        rSafari = /version\/([\w.]+).*(safari)/;
      var browser;
      var version;
      var ua = userAgent.toLowerCase();
      function uaMatch(ua) {
        var match = rMsie.exec(ua);
        if (match != null) {
          return { browser: "IE", version: match[2] || "0" };
        }
        var match = rFirefox.exec(ua);
        if (match != null) {
          return { browser: match[1] || "", version: match[2] || "0" };
        }
        var match = rOpera.exec(ua);
        if (match != null) {
          return { browser: match[1] || "", version: match[2] || "0" };
        }
        var match = rChrome.exec(ua);
        if (match != null) {
          return { browser: match[1] || "", version: match[2] || "0" };
        }
        var match = rSafari.exec(ua);
        if (match != null) {
          return { browser: match[2] || "", version: match[1] || "0" };
        }
        if (match != null) {
          return { browser: "", version: "0" };
        }
      }
      var browserMatch = uaMatch(userAgent.toLowerCase());
      if (browserMatch.browser) {
        browser = browserMatch.browser;
        version = browserMatch.version;
        if (browser != "IE") {
          $scope.IsFirefox = 1;
        }
      }

      $scope.IsIE = 1;
      Test_CanSeeTest();
      GetUser();
      cssInit();
      Test_Get();
    };
    Init();
  }
]);

DoHomeWorkModule.directive("onPaperInfo", function($timeout) {
  return {
    restrict: "A",
    link: function(scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function() {
          scope.$emit("ngPaperInfo");
        });
      }
    }
  };
});

DoHomeWorkModule.directive("onLoadTime", function($timeout) {
  return {
    restrict: "A",
    link: function(scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function() {
          scope.$emit("ngLoadTime");
        });
      }
    }
  };
});
//选项筛选器
DoHomeWorkModule.filter("choicesFilter", function() {
  return function(item, ExerciseID) {
    return item.filter(function(i) {
      return i.ExerciseID == ExerciseID;
    });
  };
});

DoHomeWorkModule.filter("sortFilter", function() {
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
DoHomeWorkModule.filter("exerciseFilter", function() {
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

DoHomeWorkModule.filter("exerciseFilter2", function() {
  return function(item, GroupID, PaperID, ExerciseID) {
    return item.filter(function(i) {
      if (i.ParentExerciseID < 0) {
        return false;
      } else {
        return i.PaperID == PaperID && i.PaperGroupID == GroupID;
      }
    });
  };
});

DoHomeWorkModule.filter("exerciseFilter3", function() {
  return function(item, GroupID, PaperID) {
    return item.filter(function(i) {
      return i.PaperID == PaperID && i.PaperGroupID == GroupID;
    });
  };
});

DoHomeWorkModule.filter("exerciseParentFilter", function() {
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

DoHomeWorkModule.filter("exerciseParentFilter2", function() {
  return function(item, GroupID, PaperID, ParentExerciseID) {
    return item.filter(function(i) {
      return i.PaperID == PaperID && i.PaperGroupID == GroupID;
    });
  };
});

DoHomeWorkModule.filter("ToNumByLetter", function() {
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
