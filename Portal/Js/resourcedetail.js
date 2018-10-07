var FileID = request("fileid");
if (FileID == "") {
  FileID = request("id");
}
$(function () {
  if (!$config.IsCCorRC) {
    $('.crumbs_box').hide();
    $('.detail-right').hide();
    $('#MenuNav').hide();
    $('.detail-left').css({ 'margin-left': '160px' });
  } else {

  }
  if (FileID != "") {
    var uploadUrl = Storage_Address() || 'http://' + location.host;
    $("#PreviewBox").html('<div id="BR"><iframe src="' + uploadUrl + '/Upload/HttpUpload/iShowFile.aspx?fid=' + FileID + '" style="width:822px;height:562px;border:none;overflow:hidden"></iframe></div>');   
    Get_File();
    Load_HotTag();
    Load_Comment();
    IsCanReply();
  }
  OnLoad();    
})
function FullPreview() {
  var index = layer.open({
    type: 2,
    title: '资源预览',
    content: '../Frameworks/PDF/web/viewer.html?fid=' + FileID + '&show=0',
    area: ['300px', '195px'],
    maxmin: true
  });
  layer.full(index);
  $('.layui-layer-maxmin').hide();
}
//查看结果
function replace_em(str) {
  str = str.replace(/\</g, '&lt;');
  str = str.replace(/\>/g, '&gt;');
  str = str.replace(/\n/g, '<br/>');
  str = str.replace(/\[em_([0-9]*)\]/g, '<img src="../Images/face/$1.gif" border="0" />');
  return str;
}
function OnLoad() {
  $('.emotion').qqFace({
    id: 'facebox', //表情盒子的ID
    assign: 'commentText1', //给那个控件赋值
    path: '../Images/face/'	//表情存放的路径
  });
  $('.label_add').click(function () {
    $("#TagName").val("");
    if ($(this).next('.add_label').is(":hidden") == true) {
      Tag_List();
    }
    $(this).next('.add_label').toggle()

  })
}
function Tag_List() {
  var htr = [];
  var data = Tag_Hot_List();
  if (data != null) {
    var rds = rd(0, data.length - 1, 10);
    var new_data = [];
    for (var i = 0; i < rds.length; i++) {
      new_data.push(data[rds[i]]);
    }
    for (var i = 0, len = new_data.length; i < len; i++) {
      var item = new_data[i];
      htr.push('<span class="add_span" onclick="AddTag(' + item.TagID + ')"><i>+</i>' + item.Name + '</span>');
    }
  }
  $(".add_choose").html(htr.join(""));
}
function Add_Tag() {
  var name = $("#TagName").val();
  if (name == "") {
    layer.msg('请输入标签', { icon: 0, time: 2000 });
    return;
  }
  var flag = Tag_ADD(name);
  if (flag > 0) {
    $("#TagName").val("");
    AddTag(flag);
  }
}
function Add_Comment(rid) {
  var cen = '';
  var ids = '';
  if (rid == 0) {
    cen = $("#commentText1").val();
    if (chooseTag.length >= 0) {
      for (var i = 0; i < chooseTag.length; i++) {
        ids += chooseTag[i] + ',';
      }
      ids = ids.substring(0, ids.length - 1);
    }
    if (cen == "") {
      layer.msg('请输入评论内容', { icon: 0, time: 2000 });
      return;
    }
  } else {
    cen = $("#replyText" + rid).val();
    if (cen == "") {
      layer.msg('请输入评论内容', { icon: 0, time: 2000 });
      return;
    }
  }
  var flag = Comment_ADD(FileID, cen, rid, ids);
  if (flag > 0) {
    if (rid == 0) {
      if (ids != "") {
        FileTag_ADD(FileID, ids);
      }
      $("#commentText1").val("");
      chooseTag = [];
      $("#textareaBox").hide();
      layer.msg('回复成功', { icon: 1, time: 2000 });
      Get_FileTag();
      Load_Comment();
    } else {
      layer.msg('回复成功', { icon: 1, time: 2000 });
      Load_replyComment(rid);
    }
  }
}
var chooseTag = [];
function AddTag(id) {
  if (chooseTag.length == 0) {
    $("#textareaBox").show();
    var data = Tag_Get(id);
    if (data != null) {
      var str = '<span id="Tag' + data.TagID + '">' + data.Name + '<i onclick="DelTag(' + data.TagID + ')">x</i></span>';
      $("#chooseTagBox").html(str);
      chooseTag.push(id);
    }
  } else {
    if (chooseTag.indexOf(id) == -1) {
      var data = Tag_Get(id);
      if (data != null) {
        var str = '<span id="Tag' + data.TagID + '">' + data.Name + '<i onclick="DelTag(' + data.TagID + ')">x</i></span>';
        var x = $("#chooseTagBox span").length - 1;
        $("#chooseTagBox span").eq(x).after(str);
        chooseTag.push(id);
      }
    }
  }
  $(".add_label").hide();
}
function DelTag(id) {
  var ary = [];
  $("#Tag" + id).remove();
  for (var i = 0; i < chooseTag.length; i++) {
    if (chooseTag[i] != id) {
      ary.push(chooseTag[i]);
    }
  }
  chooseTag = ary;
  if (chooseTag.length == 0) {
    $("#textareaBox").hide();
  }
}
function Get_File() {
  var data = File_Portal_Get(FileID);
  var str = '';
  if (data != null) {
    str = '<h3><b class="icon24 ' + ExtSwitch(data.Ext) + '"></b>' + data.FileTitle + '</h3><p class="info"><b>上传：</b><em>' + data.CreateUserName + '</em><b>|</b><b>机构：</b><em>' + data.OrganizationName + '</em><b>|</b><b>课程：</b><em>' + data.CourseName + '</em><b>|</b><b>日期：</b><em>' + data.UploadTime.substring(0, 10) + '</em><b>|</b><b>权限：</b><em>' + ShareRangeSwitch(data.ShareRange) + '</em><b>|</b><b>访问：</b><em>' + data.Clicks + ' 次</em><b>|</b> <b>下载：</b><em>' + data.Downloads + '次</em></p>';
    title = data.FileTitle;
    Get_FileTag();
    Load_LikeFile();
    if (data.Ext.toLowerCase().indexOf('txt') != -1) {
      $('#PreviewBox').css({ 'background-color': '#FFFFFF' });
    }
  }
  $(".data_tit").html(str);
}
function Get_FileTag() {
  var data = FileTag_Get(FileID);
  var htr = ['<b>标签：</b>'];
  if (data != null) {
    for (var i = 0, len = data.length; i < len; i++) {
      var item = data[i];
      htr.push('<a target="_blank" href="list.aspx?TagID=' + item.TagID + '">' + item.Name + '</a>');
    }
  }
  $(".check_label").html(htr.join(""));
}
var title = "";
function Load_LikeFile() {
  if (!$config.IsCCorRC) {
    return;
  }
  var htr = [];
  var data;
  if (cache.likeFile == null || cache.likeFile == undefined) {
    var key = title.substring(0, title.lastIndexOf('.'));
    var ary = LikeGetKey(key);
    cache.likeFile = File_Like_List(FileID, ary[0], ary[1], ary[2], ary[3], ary[4]);
  }
  data = cache.likeFile;
  if (data != null) {
    var rds = rd(0, data.length - 1, 10);
    var new_data = [];
    for (var i = 0; i < rds.length; i++) {
      data[rds[i]].Ext = ExtSwitch(data[rds[i]].Ext);
      new_data.push(data[rds[i]]);
    }
    for (var i = 0, len = new_data.length; i < len; i++) {
      var item = new_data[i];
      htr.push('<li><b class="file16 ' + item.Ext + '"></b><a href="detail.aspx?id=' + item.FileID + '" title="' + item.FileTitle + '">' + item.FileTitle + '</a><div class="num">' + item.Downloads + '次下载</div></li>');
    }
  }
  $(".similar_data").html(htr.join(""));
}
function LikeGetKey(str) {
  var ary;
  var len = str.length;
  if (len == 1) {
    ary = [str, str, str, str, str];
  } else if (len == 2) {
    ary = [str, str.substring(0, 1), str.substring(0, 1), str.substring(1, 2), str.substring(1, 2)];
  } else if (len == 3) {
    ary = [str, str.substring(0, 2), str.substring(1, 3), str.substring(1, 2), str.substring(0, 1)];
  } else if (len == 4) {
    ary = [str, str.substring(0, 2), str.substring(2, 4), str.substring(1, 3), str.substring(1, 4)];
  } else if (len == 5) {
    ary = [str.substring(0, 3), str.substring(0, 2), str.substring(3, 5), str.substring(1, 3), str.substring(2, 5)];
  } else if (len == 6) {
    ary = [str.substring(0, 2), str.substring(2, 4), str.substring(4, 6), str.substring(0, 3), str.substring(3, 6)];
  } else if (len == 7) {
    ary = [str.substring(0, 2), str.substring(2, 4), str.substring(4, 7), str.substring(0, 3), str.substring(3, 6)];
  } else if (len == 8) {
    ary = [str.substring(0, 2), str.substring(2, 4), str.substring(4, 6), str.substring(6, 8), str.substring(5, 8)];
  } else if (len == 9) {
    ary = [str.substring(0, 2), str.substring(2, 4), str.substring(4, 6), str.substring(6, 9), str.substring(5, 8)];
  } else {
    var n = Math.round(len / 5);
    ary = [str.substring(0, n), str.substring(n, 2 * n), str.substring(2 * n, 3 * n), str.substring(len - 2 * n, len - n), str.substring(len - n, len)];
  }
  return ary;
}
var PageIndex = 1;
var PageSize = 10;
function Load_Comment() {
  var allcount = CommentCount_Get(FileID);
  if (allcount != null) {
    $("#AllCount").text("（" + allcount + "）");
  } else {
    $("#AllCount").text("（0）");
  }
  var strHtml = '';
  var data = Comment_List(FileID, 0, PageIndex, PageSize);
  if (data != null) {
    for (var i = 0; i < data.length; i++) {
      strHtml += '<li class="noboder">';
      strHtml += '    <div class="comment_man">';
      strHtml += '        <img src="' + data[i].img + '" width="50" height="50" >';
      strHtml += '    </div>';
      strHtml += '    <div class="comment_con">';
      strHtml += '        <div class="name">';
      strHtml += '            <span class="man">' + data[i].UserName + '</span>';
      strHtml += '            <span class="time">（' + Timediffer(data[i].UpdateTime, data[i].NowTime) + '）</span>';
      strHtml += '        </div>';
      if (data[i].TagNames != "") {
        var tags = data[i].TagNames.split(',');
        strHtml += '<div class="label_choose">';
        for (var n = 0; n < tags.length; n++) {
          strHtml += '<span>' + tags[n] + '</span>';
        }
        strHtml += '</div>';
      }
      strHtml += '        <p class="com_p">' + replace_em(data[i].Conten) + '</p>';
      strHtml += '        <div class="operation">';
      if (data[i].IsCanDel == 1) {
        strHtml += '<a href="javascript:Del_Comment(' + data[i].comID + ',' + data[i].replyID + ');" class="del_a">删除</a>';
      }
      strHtml += '            <a href="javascript:;" class="reply_a">回复（' + data[i].replyCount + '）</a>';
      strHtml += '        </div>';
      strHtml += '        <div id="reply_box' + data[i].comID + '" style="display:' + (data[i].replyCount > 0 ? "block" : "none") + '" class="reply_box">';
      strHtml += re_replyComment(data[i].comID);
      strHtml += '        </div>';
      strHtml += '    </div>';
      strHtml += '</li>';
    }
  }
  $(".comment_ul").html(strHtml);
  var RowsCount = (data == null ? 0 : data[0].RowsCount);
  $('#div_page_wrap').tspg({
    PageIndex: PageIndex,
    PageSize: PageSize,
    RowsCount: RowsCount,
    Method: function (index) {
      PageIndex = index;
      Load_Comment();
    }
  });
  $(".reply_a").click(function () {
    var rebox = $(this).parent().next();
    if (rebox.find('.wysyj_btn').length == 0) {
      if (IsLogin() == "1") {

      } else {
        layer.msg('请先登录，才能进行评论', { icon: 5, time: 2000 });
        return;
      }
    }
    if (rebox.is(":hidden") == false) {
      rebox.slideUp(500);
    } else {
      rebox.slideDown(500);
    }
  })
  $(".wysyj_btn").click(function () {
    if (IsLogin() == "1") {
      $(this).next().toggle();
    } else {
      layer.msg('请先登录，才能进行评论', { icon: 5, time: 2000 });
    }
  })
  $('.comment_ul li').hover(function () {
    $(this).find('.operation .del_a').toggle()

  })
  $('.reply_list').hover(function () {
    $(this).find('.del_a').toggle()

  })
}
function Tolist(id) {
  window.open('list.aspx?TagID=' + id);
}
function re_replyComment(rid) {
  var strHtml = '';
  var data = Comment_List(FileID, rid, 1, 10);
  if (data != null) {
    var x = 5;
    if (data.length - 5 < 0) {
      x = data.length;
    }
    for (var i = 0; i < x; i++) {
      strHtml += '<div class="reply_list ' + (i == 0 ? "noboder" : "") + '">';
      strHtml += '    <div class="reply_man">';
      strHtml += '        <img src="' + data[i].img + '" width="30" height="30" />';
      strHtml += '    </div>';
      strHtml += '    <div class="reply_con">';
      strHtml += '        <span class="man">' + data[i].UserName + '：</span>';
      strHtml += '        <span class="con">' + replace_em(data[i].Conten) + '</span>';
      strHtml += '        <span class="time">（' + Timediffer(data[i].UpdateTime, data[i].NowTime) + '）</span>';
      if (data[i].IsCanDel == 1) {
        strHtml += '<a href="javascript:Del_Comment(' + data[i].comID + ',' + data[i].replyID + ');" class="del_a">删除</a>';
      }
      strHtml += '    </div>';
      strHtml += '</div>';
    }
    strHtml += '<div class="reply_list" style="padding: 15px 0px 0px 0px">';
    if (data.length > 5) {
      strHtml += '    <span style="color:#707070;">还有' + (data.length - 5) + '条回复，</span><a href="javascript:Load_replyComment(' + rid + ');" style="color:#2d64b3;">点击查看</a>';
    }
    strHtml += '    <a href="javascript:;" class="wysyj_btn">我也说一句</a>';
    strHtml += '    <div style="display: none">';
    strHtml += '        <input id="replyText' + rid + '" placeholder="请输入评论内容" class="ipt" />';
    strHtml += '        <a href="javascript:Add_Comment(' + rid + ');" class="reply_btn">发表</a>';
    strHtml += '    </div>';
    strHtml += '</div>';
  } else {
    strHtml += '<div class="reply_list noboder" style="padding: 15px 0px 0px 0px;">';
    strHtml += '    <div style="display: block">';
    strHtml += '        <input id="replyText' + rid + '" placeholder="请输入评论内容" class="ipt" />';
    strHtml += '        <a href="javascript:Add_Comment(' + rid + ');" class="reply_btn">发表</a>';
    strHtml += '    </div>';
    strHtml += '</div>';
  }
  return strHtml;
}
function Load_replyComment(rid) {
  var strHtml = '';
  var data = Comment_List(FileID, rid, 1, 10);
  if (data != null) {
    $("#reply_box" + rid).prev().find('.reply_a').text('回复（' + data.length + '）');
    for (var i = 0; i < data.length; i++) {
      strHtml += '<div class="reply_list ' + (i == 0 ? "noboder" : "") + '">';
      strHtml += '    <div class="reply_man">';
      strHtml += '        <img src="' + data[i].img + '" width="30" height="30" />';
      strHtml += '    </div>';
      strHtml += '    <div class="reply_con">';
      strHtml += '        <span class="man">' + data[i].UserName + '：</span>';
      strHtml += '        <span class="con">' + replace_em(data[i].Conten) + '</span>';
      strHtml += '        <span class="time">（' + Timediffer(data[i].UpdateTime, data[i].NowTime) + '）</span>';
      if (data[i].IsCanDel == 1) {
        strHtml += '<a href="javascript:Del_Comment(' + data[i].comID + ',' + data[i].replyID + ');" class="del_a">删除</a>';
      }
      strHtml += '    </div>';
      strHtml += '</div>';
    }
    strHtml += '<div class="reply_list" style="padding: 15px 0px 0px 0px">';
    strHtml += '    <a href="javascript:;" class="wysyj_btn">我也说一句</a>';
    strHtml += '    <div style="display: none">';
    strHtml += '        <input id="replyText' + rid + '" placeholder="请输入评论内容" class="ipt" />';
    strHtml += '        <a href="javascript:Add_Comment(' + rid + ');" class="reply_btn">发表</a>';
    strHtml += '    </div>';
    strHtml += '</div>';
  } else {
    strHtml += '<div class="reply_list noboder" style="padding: 15px 0px 0px 0px;">';
    strHtml += '    <div style="display: block">';
    strHtml += '        <input id="replyText' + rid + '" placeholder="请输入评论内容" class="ipt" />';
    strHtml += '        <a href="javascript:Add_Comment(' + rid + ');" class="reply_btn">发表</a>';
    strHtml += '    </div>';
    strHtml += '</div>';
  }
  $("#reply_box" + rid).html(strHtml);
  $(".wysyj_btn").click(function () {
    if (IsLogin() == "1") {
      $(this).next().toggle();
    } else {
      layer.msg('请先登录，才能进行评论', { icon: 5, time: 2000 });
    }
  })
  $('.reply_list').hover(function () {
    $(this).find('.del_a').toggle()

  })
}
function Del_Comment(id, rid) {
  layer.confirm("确定要删除本条评论?", function () {
    var flag = Comment_Del(id);
    if (flag == "1") {
      layer.msg('删除成功', { icon: 1, time: 2000 });
      if (rid == 0) {
        Load_Comment();
      } else {
        Load_replyComment(rid);
        CommentCount_Get(FileID);
      }
    } else if (flag == "0") {
      layer.msg('您只能删除自己的评论', { icon: 0, time: 2000 });
    } else {
      layer.msg('删除失败', { icon: 2, time: 2000 });
    }
  });
}
var cache = new Object();
function Load_HotTag() {
  if (!$config.IsCCorRC) {
    return;
  }
  var htr = [];
  var data;
  if (cache.hotTag == null || cache.hotTag == undefined) {
    cache.hotTag = Tag_Hot_List();
  }
  data = cache.hotTag;
  if (data != null) {
    var rds = rd(0, data.length - 1, 10);
    var new_data = [];
    for (var i = 0; i < rds.length; i++) {
      new_data.push(data[rds[i]]);
    }
    for (var i = 0, len = new_data.length; i < len; i++) {
      var item = new_data[i];
      htr.push('<a target="_blank" href="list.aspx?TagID=' + item.TagID + '">' + item.Name + '</a>');
    }
  }
  $(".top_label").html(htr.join(""));
}
function IsCanReply() {
  var flag = IsLogin();
  if (flag == "1") {
    $(".comment_box").show();
  } else {
    $(".comment_box").hide();
  }
}
function IsLogin_Upload() {
  var flag = IsLogin();
  if (flag == "1") {
    window.open("/Resource/#/content/resource");
  } else {
    layer.msg('请先登录', {
      time: 0,
      btn: ['确定', '取消'],
      yes: function (index) {
        ToLogin();
      }
    });
  }
}

function DownFile() {
  var flag = File_Download(FileID);
  if (flag != null) {
    switch (flag) {
      case "1":
      case "2":
      case "3":
        var data = File_Portal_Get(FileID);
        if (data.DownURL != null) {
          downBox(data.DownURL);
        }
        break;
      default:
        download_file(flag);
        break;
    }
  }
}
function download_file(url) {
  if (typeof (download_file.iframe) == "undefined") {
    var iframe = document.createElement("iframe");
    download_file.iframe = iframe;
    document.body.appendChild(download_file.iframe);
  }
  download_file.iframe.src = "download.aspx?guid=" + url;
  download_file.iframe.style.display = "none";
}
function downBox(url, ext) {
  $('.ts_down_pop').show();
  var w = $(window).width();
  var h = $(window).height();
  var pos = 'left:' + (w / 2 - 100) + 'px;top:' + (h / 2 - 70) + 'px;';
  var htr = '<div id="DownFile" style="position:fixed;width:400px;height:140px;background:#fff;border:1px solid #ccc;' + pos + 'z-index: 19891015"><div style="width:400px;height:40px;border-bottom:#ccc;float:left;background:#284A51"><span style="float:left;font-size:16px;font-weight:600;color:#fff;line-height:40px;margin-left:8px">文件下载</span><a href="javascript:CloseDown();" class="icon_close_btn" style="float: right;margin: 12px;"></a></div><div style="float: left; width: 400px; height: 50px; text-align: left;color: #999;font-size: 18px;line-height: 50px;margin-top:20px;"><a style="float:left;margin: 12px 10px 12px 120px;" class="icon24 ' + ext + '" href="' + url + '"></a><a href="' + url + '" style="text-align: left;color: #999;font-size: 18px;line-height: 50px;">(右键另存为下载)</a></div></div>';
  $('body').after(htr);
}
function CloseDown() {
  $('.ts_down_pop').hide();
  $('#DownFile').remove();
}
function CloseMsg2() {
  $('.ts_msg2').remove();
}

function nofindUserImg(obj) {
  obj.src = "../Images/User_M.jpg";
  obj.onerror = null;
}
